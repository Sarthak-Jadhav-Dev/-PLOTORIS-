import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { custom_idea, project_id } = body;
    
    if (!custom_idea) {
      return NextResponse.json({ error: "Custom idea is required" }, { status: 400 });
    }
    // 1. Prompt Gemini to structure the raw text
    const model = getLLM(req, 0.2, "gemini-2.0-flash");

    const prompt = `
      You are an expert academic research advisor.
      The user has provided a raw, unstructured description of their research project idea, bypassing the standard Q&A process.
      Your task is to parse, infer, and structure this idea into the standard Phase 1 format.

      Raw User Input: "${custom_idea}"

      Provide your response STRICTLY as a JSON object with this exact structure:
      {
        "problem": { "statement": string, "rationale": string },
        "question": { "question": string },
        "scope": { 
          "inclusions": [{ "item": string, "category": string }],
          "exclusions": [{ "item": string, "reason": string }],
          "constraints": { "time_range": string, "resources": string[] }
        },
        "objectives": {
          "smart_objective": string,
          "success_criteria": string[]
        },
        "ai_summary": string (A 2-3 sentence executive summary of what this project is about based on the user's input, confirming that the foundation is set.)
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

    // 2. Embed user input and AI structured summary to Supabase
    if (project_id) {
      try {
        const embeddings = getEmbeddings(req);
        
        const userVector = await embeddings.embedQuery(`User Direct Custom Idea: ${custom_idea}`);
        await supabase.from("Documents").insert({
          content: `User Direct Custom Idea: ${custom_idea}`,
          embedding: userVector,
          metadata: { project_id, phase: 1, role: "user", type: "bypassed_raw_input" }
        });

        const structuredText = `Phase 1 Bypassed Structured Summary: Problem: ${parsedResult.problem.statement}. Question: ${parsedResult.question.question}. Objective: ${parsedResult.objectives.smart_objective}.`;
        const aiVector = await embeddings.embedQuery(structuredText);
        await supabase.from("Documents").insert({
          content: structuredText,
          embedding: aiVector,
          metadata: { project_id, phase: 1, role: "assistant", type: "phase_1_summary" }
        });
      } catch (err) { console.warn("Embedding failed", err); }
    }

    // 3. Generate mock KG Nodes
    const nodes = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

    return NextResponse.json({
      knowledge_graph_nodes: nodes,
      phase1_complete: true,
      next_phase_unlocked: "p2",
      ai_summary: parsedResult.ai_summary,
      structured_data: parsedResult // For the UI to potentially use or display
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process custom idea" }, { status: 500 });
  }
}
