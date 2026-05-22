import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id, paper_id } = await req.json();

    if (!project_id || !paper_id) {
      return NextResponse.json({ error: "project_id and paper_id are required" }, { status: 400 });
    }

    // Fetch the documents for this paper
    const { data: documents, error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>paper_id", paper_id);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch paper context." }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: "No context found for this paper." }, { status: 404 });
    }

    const context = documents.map(d => d.content).join("\n\n---\n\n").substring(0, 30000);

    const model = getLLM(req, 0.2, "gemini-2.0-flash");

    const prompt = `
      You are an expert research assistant. Read the following paper context (which might be an abstract or full text chunks) and generate a structured Literature Review card.

      Return ONLY a valid JSON object matching this schema exactly:
      {
        "introduction": "Brief introduction and background of the paper (2-3 sentences)",
        "methodology": "The methods, datasets, or approaches used (2-3 sentences)",
        "results_future": "Key findings, results, and suggested future scope (2-3 sentences)",
        "best_flow": "What to read first, key sections to focus on, and any important citations to understand this paper."
      }

      Context:
      ${context}

      JSON OUTPUT:
    `;

    const res = await model.invoke(prompt);
    let contentStr = res.content.toString().trim();
    if (contentStr.startsWith("```json")) {
      contentStr = contentStr.replace(/```json\n?/, "").replace(/```$/, "").trim();
    } else if (contentStr.startsWith("```")) {
      contentStr = contentStr.replace(/```\n?/, "").replace(/```$/, "").trim();
    }

    const reviewData = JSON.parse(contentStr);

    return NextResponse.json({ review: reviewData });

  } catch (error: any) {
    console.error("Lit Review API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
