import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain, project_id, context } = body;

    const geminiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }
    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key is required." }, { status: 401 });
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-2.0-flash",
      temperature: 0.7, // Higher temp for brainstorming
    });

    const prompt = `
      You are an expert academic research advisor.
      Generate 3 highly novel and feasible academic research problems within the domain of "${domain}".
      ${context ? `Additional context from user: ${context}` : ''}

      Provide your response STRICTLY as a JSON object with this exact structure:
      {
        "problems": [
          {
            "id": string (unique uuid),
            "statement": string (the problem statement),
            "novelty_score": number (0-10),
            "feasibility_score": number (0-10),
            "rationale": string (why this is important),
            "suggested_question": string (a specific research question),
            "domain_tags": string[] (3 tags),
            "key_concepts": string[] (3 concepts),
            "potential_methods": string[] (2-3 methods)
          }
        ],
        "domain_analysis": string (a brief 2 sentence analysis of current trends in this domain),
        "recommended_next_steps": string (1 sentence)
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

    // Embed and store
    if (project_id) {
      try {
        const embeddings = new GoogleGenerativeAIEmbeddings({
          apiKey: geminiKey,
          model: "text-embedding-004",
        });

        const textToEmbed = `Phase 1 Generated Problems for Domain: ${domain}. Context: ${context}. Response: ${JSON.stringify(parsedResult.problems.map((p: any) => p.statement))}`;
        const vector = await embeddings.embedQuery(textToEmbed);

        await supabase.from("Documents").insert({
          content: textToEmbed,
          embedding: vector,
          metadata: { project_id, phase: 1, role: "assistant", type: "problem_generation" }
        });
      } catch (err) {
        console.warn("Embedding failed", err);
      }
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate problems" }, { status: 500 });
  }
}
