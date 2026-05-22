import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { research_question, problem_context, project_id } = body;
    
    // Retrieve Gemini API key from headers or environment
    if (!research_question) {
      return NextResponse.json({ error: "Research question is required" }, { status: 400 });
    }

    

    // 1. Embed and Store User Question
    try {
      const embeddings = getEmbeddings(req);

      const userVector = await embeddings.embedQuery(research_question);

      await supabase.from("Documents").insert({
        content: `User Research Question: ${research_question}`,
        embedding: userVector,
        metadata: {
          project_id: project_id || "unassigned",
          phase: 1,
          role: "user",
          type: "research_question"
        }
      });
    } catch (embErr) {
      console.warn("Failed to generate or store user embeddings", embErr);
      // We don't fail the whole request if embeddings fail for now
    }

    // 2. Evaluate Question with Gemini
    const model = getLLM(req, 0.2, "gemini-2.0-flash");

    const prompt = `
      You are an expert academic research advisor.
      Evaluate the following research question based on: Clarity, Specificity, Testability, and Novelty.
      
      Problem Context (if any): ${problem_context || "None provided"}
      Research Question: "${research_question}"

      Provide your evaluation STRICTLY as a JSON object with the following exact keys and types:
      {
        "overall_score": number (0-100),
        "grade": string (e.g., "A", "B+", "C"),
        "dimension_scores": {
          "clarity": number (0-10),
          "specificity": number (0-10),
          "testability": number (0-10),
          "novelty": number (0-10)
        },
        "issues": [
          {
            "id": string (unique, e.g., "i1"),
            "dimension": string (e.g., "specificity"),
            "severity": string ("high" or "medium" or "low"),
            "issue": string (brief description of the problem),
            "suggestion": string (how to fix it)
          }
        ],
        "improved_versions": [
          {
            "version": string (a better rewrite of the question),
            "changes_made": string (brief explanation of what was changed)
          }
        ]
      }

      CRITICAL: Respond ONLY with the raw JSON object. Do NOT wrap it in \`\`\`json markdown blocks. Do not include any other text.
    `;

    const aiResponse = await model.invoke(prompt);
    let parsedResult;
    try {
      let contentStr = aiResponse.content.toString().trim();
      contentStr = contentStr.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      
      const startIndex = contentStr.indexOf('{');
      const endIndex = contentStr.lastIndexOf('}');
      
      if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
        contentStr = contentStr.substring(startIndex, endIndex + 1);
      }
      
      // Fix unescaped newlines inside strings which break JSON.parse
      contentStr = contentStr.replace(/[\r\n]+/g, ' ');
      
      parsedResult = JSON.parse(contentStr);
    } catch (parseErr: any) {
      const rawOutput = aiResponse.content.toString();
      console.error("Parse Error. LLM returned:", rawOutput);
      return NextResponse.json({ 
        error: `Failed to parse AI response. ${parseErr.message}. LLM Output: ${rawOutput.substring(0, 150)}...` 
      }, { status: 500 });
    }

    // 3. Embed and Store AI Response
    try {
      const embeddings = getEmbeddings(req);

      const aiTextToEmbed = `AI Evaluation of Research Question: 
Overall Score: ${parsedResult.overall_score} 
Issues: ${parsedResult.issues.map((i: any) => i.issue).join("; ")}
Improvements: ${parsedResult.improved_versions.map((i: any) => i.version).join("; ")}`;

      const aiVector = await embeddings.embedQuery(aiTextToEmbed);

      await supabase.from("Documents").insert({
        content: aiTextToEmbed,
        embedding: aiVector,
        metadata: {
          project_id: project_id || "unassigned",
          phase: 1,
          role: "assistant",
          type: "evaluation_feedback"
        }
      });
    } catch (embErr) {
      console.warn("Failed to generate or store AI embeddings", embErr);
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Validation error:", error);
    return NextResponse.json({ error: error.message || "Failed to validate question" }, { status: 500 });
  }
}
