import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { goal, problem, question, project_id } = body;
    
    if (!goal) {
      return NextResponse.json({ error: "Goal is required." }, { status: 400 });
    }

    // 1. Embed user input goal
    if (project_id) {
      try {
        const embeddings = getEmbeddings(req);
        const userVector = await embeddings.embedQuery(`User Draft Goal: ${goal}`);
        await supabase.from("Documents").insert({
          content: `User Draft Goal: ${goal}`,
          embedding: userVector,
          metadata: { project_id, phase: 1, role: "user", type: "draft_goal" }
        });
      } catch (err) { console.warn("Failed embedding draft goal", err); }
    }

    const model = getLLM(req, 0.2, "gemini-2.0-flash");

    const prompt = `
      You are an expert academic research advisor.
      Convert the user's raw research goal into a SMART objective (Specific, Measurable, Achievable, Relevant, Time-bound).
      
      Problem: "${problem || 'Not specified'}"
      Question: "${question || 'Not specified'}"
      Draft Goal: "${goal}"

      Provide your response STRICTLY as a JSON object with this exact structure:
      {
        "smart_analysis": {
          "specific": { "score": number (0-10), "issue": string | null },
          "measurable": { "score": number (0-10), "issue": string | null },
          "achievable": { "score": number (0-10), "issue": string | null },
          "relevant": { "score": number (0-10), "issue": string | null },
          "timebound": { "score": number (0-10), "issue": string | null }
        },
        "smart_objective": string (The rewritten, professional SMART objective),
        "success_criteria": string[] (3 specific criteria for success),
        "breakdown": {
          "specific": string (explanation),
          "measurable": string,
          "achievable": string,
          "relevant": string,
          "timebound": string
        },
        "milestones": [
          { "milestone": string, "timeline": string (e.g. "Month 1") }
        ]
      }

      CRITICAL: Respond ONLY with raw JSON. No markdown blocks.
    `;

    const aiResponse = await model.invoke(prompt);
    let parsedResult;
    try {
      let contentStr = aiResponse.content.toString().trim();
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        parsedResult = JSON.parse(contentStr);
      }
    } catch (parseErr) {
      console.error("Parse Error. LLM returned:", aiResponse.content.toString());
      return NextResponse.json({ error: "Failed to parse AI response." }, { status: 500 });
    }

    // Embed and store AI SMART Objective
    if (project_id) {
      try {
        const embeddings = getEmbeddings(req);
        const textToEmbed = `Phase 1 Final SMART Objective: ${parsedResult.smart_objective}. Success Criteria: ${JSON.stringify(parsedResult.success_criteria)}.`;
        const vector = await embeddings.embedQuery(textToEmbed);
        await supabase.from("Documents").insert({
          content: textToEmbed,
          embedding: vector,
          metadata: { project_id, phase: 1, role: "assistant", type: "smart_objective" }
        });
      } catch (err) { console.warn("Embedding failed", err); }
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to convert to SMART objective" }, { status: 500 });
  }
}
