import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { domain, project_id, context } = body;

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }
    const model = getLLM(req, 0.7, "gemini-2.0-flash");

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
      contentStr = contentStr.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      
      // Fix unescaped newlines inside strings which break JSON.parse
      contentStr = contentStr.replace(/[\r\n]+/g, ' ');
      
      const startIndex = contentStr.indexOf('{');
      let endIndex = contentStr.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        contentStr = contentStr.substring(startIndex, endIndex + 1);
      }
      
      // Auto-append missing closing braces if LLM truncated the JSON
      const openBraces = (contentStr.match(/\{/g) || []).length;
      const closeBraces = (contentStr.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        contentStr += '}'.repeat(openBraces - closeBraces);
      }
      
      parsedResult = JSON.parse(contentStr);
    } catch (parseErr: any) {
      const rawOutput = aiResponse.content.toString();
      console.error("Parse Error. LLM returned:", rawOutput);
      return NextResponse.json({ 
        error: `Failed to parse AI response. ${parseErr.message}. LLM Output: ${rawOutput.substring(0, 150)}...` 
      }, { status: 500 });
    }

    // Embed and store
    if (project_id) {
      try {
        const embeddings = getEmbeddings(req);

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
