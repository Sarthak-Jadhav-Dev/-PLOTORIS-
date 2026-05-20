import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();

    const geminiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

    if (!project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key is required." }, { status: 401 });
    }

    // Retrieve all fetched_paper and paper_chunk documents for this project
    const { data: documents, error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", ["fetched_paper", "paper_chunk"]);

    if (error) {
      throw new Error("Failed to fetch documents for gap analysis.");
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: "No papers found in your Bucket. Please fetch or upload papers first." }, { status: 400 });
    }

    // Limit context length by selecting a subset or summarizing, but for now we concatenate up to ~30k chars
    const combinedContext = documents.map(d => `Title: ${d.metadata.title}\nContent: ${d.content}`).join("\n\n").substring(0, 40000);

    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-2.0-flash",
      temperature: 0.3,
    });

    const prompt = `
      You are a postdoctoral researcher specializing in literature review analysis.
      Below is a corpus of paper abstracts and extracted chunks related to a single project.
      
      Your task is to identify:
      1. Contradictions: Where do authors disagree?
      2. Consensus: What is generally agreed upon?
      3. White-Space/Gaps: What are the obvious missing areas of research that none of these papers cover?

      CORPUS:
      ${combinedContext}

      Provide your response STRICTLY as a JSON object with this exact structure:
      {
        "contradictions": [{ "topic": string, "description": string, "papers_involved": string[] }],
        "consensus": [{ "topic": string, "description": string }],
        "gaps": [{ "gap_identified": string, "why_it_matters": string }]
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

    return NextResponse.json({ analysis: parsedResult });

  } catch (error: any) {
    console.error("Gap Detector API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
