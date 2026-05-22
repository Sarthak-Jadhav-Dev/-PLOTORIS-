import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getLLM } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // 1. Fetch some chunks from the Bucket to get context. We limit to ~40 chunks to avoid token limit overflow.
    const { data: documents, error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>phase", 2)
      .limit(40);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch bucket papers." }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: "Your Knowledge Bucket is empty. Please upload or fetch papers in Phase 2 first." }, { status: 400 });
    }

    // Prepare context with citations
    const contextMap = new Map();
    documents.forEach(doc => {
      const title = doc.metadata?.title || "Unknown Paper";
      if (!contextMap.has(title)) {
        contextMap.set(title, []);
      }
      contextMap.get(title).push(doc.content);
    });

    let formattedContext = "";
    contextMap.forEach((chunks, title) => {
      formattedContext += `\n--- Paper: ${title} ---\n${chunks.join("\n...\n")}\n`;
    });

    const model = getLLM(req, 0.2, "gemini-2.0-flash");

    const prompt = `
      You are an expert academic research assistant. Scan the following excerpts from research papers.
      Your goal is to extract potential Independent Variables (IV) and Dependent Variables (DV) based on the findings or hypotheses mentioned in these papers.

      For each extracted variable pair, determine:
      1. Independent Variable (IV)
      2. Dependent Variable (DV)
      3. Relationship: 'Positive', 'Negative', or 'Non-directional'
      4. Citation: The exact paper title where this was found
      5. Validation: A detailed explanation (3-4 sentences) of WHY this relationship exists according to the literature.

      Return ONLY a valid JSON array of objects exactly matching this schema:
      [
        {
          "id": "unique-id-1",
          "iv": "Name of Independent Variable",
          "dv": "Name of Dependent Variable",
          "relationship": "Positive",
          "citation": "Paper Title",
          "validation": "Detailed explanation..."
        }
      ]

      Context:
      ${formattedContext.substring(0, 30000)} // Ensure we don't exceed typical token limits

      JSON OUTPUT:
    `;

    const res = await model.invoke(prompt);
    let contentStr = res.content.toString().trim();
    if (contentStr.startsWith("```json")) {
      contentStr = contentStr.replace(/```json\n?/, "").replace(/```$/, "").trim();
    } else if (contentStr.startsWith("```")) {
      contentStr = contentStr.replace(/```\n?/, "").replace(/```$/, "").trim();
    }

    const variables = JSON.parse(contentStr);

    return NextResponse.json({ variables });

  } catch (err: any) {
    console.error("Extract variables API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
