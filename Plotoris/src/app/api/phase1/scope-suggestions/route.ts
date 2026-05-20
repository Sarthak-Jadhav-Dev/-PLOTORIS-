import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problem, question, domain, project_id } = body;
    
    const geminiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key is required." }, { status: 401 });
    }

    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-2.0-flash",
      temperature: 0.3,
    });

    const prompt = `
      You are an expert academic research advisor.
      Define the scope boundaries for a research project with the following details:
      Problem: "${problem || 'Not specified'}"
      Question: "${question || 'Not specified'}"
      Domain: "${domain || 'Not specified'}"

      Provide your response STRICTLY as a JSON object with this exact structure:
      {
        "inclusions": [
          { "item": string (e.g. "English-language datasets published after 2020"), "category": string ("methodology"|"data"|"population") }
        ],
        "exclusions": [
          { "item": string (what to exclude), "reason": string (why it is excluded) }
        ],
        "population": {
          "target": string,
          "characteristics": string[] (e.g. ["Aged 18-24", "Currently enrolled"]),
          "size_range": string (e.g. "N = 100-150"),
          "geographic": string
        },
        "constraints": {
          "time_range": string,
          "budget": string,
          "resources": string[],
          "ethical": string[]
        },
        "scope_warning": string (1 sentence warning about a potential scope creep risk)
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

        const textToEmbed = `Phase 1 Scope Definitions: Inclusions: ${JSON.stringify(parsedResult.inclusions)}. Exclusions: ${JSON.stringify(parsedResult.exclusions)}. Constraints: ${JSON.stringify(parsedResult.constraints)}`;
        const vector = await embeddings.embedQuery(textToEmbed);

        await supabase.from("Documents").insert({
          content: textToEmbed,
          embedding: vector,
          metadata: { project_id, phase: 1, role: "assistant", type: "scope_suggestions" }
        });
      } catch (err) {
        console.warn("Embedding failed", err);
      }
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate scope" }, { status: 500 });
  }
}
