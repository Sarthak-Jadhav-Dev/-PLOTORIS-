import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { comment, project_id } = await req.json();
    if (!comment) return NextResponse.json({ error: "Reviewer comment is required" }, { status: 400 });
    if (!project_id) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    // ── 1. Fetch project context (methodology, hypothesis, design) ────────────
    const { data: docs } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", ["hypothesis", "methodology_draft", "design_recommendation", "sample_size", "ethics_checklist"]);

    const contextStr = docs?.map(d => {
      const type = (d.metadata as any)?.type ?? "context";
      return `### ${type.toUpperCase()}\n${d.content}`;
    }).join("\n\n") || "";

    const model = getLLM(req, 0.3, "gemini-2.0-flash");

    const prompt = `You are an experienced academic author drafting a professional, respectful point-by-point response to a peer reviewer critique. 
Use the project context below to craft a grounded, evidence-based response that cites specific methodology decisions made in prior phases.

PROJECT CONTEXT:
${contextStr.slice(0, 5000) || "No project context available — respond based on general academic best practices."}

REVIEWER COMMENT:
"${comment}"

Draft a formal, complete response letter section for this specific comment. Include:
1. An acknowledgment of the reviewer's valid concern
2. A clear explanation of what action was taken (with specific reference to the manuscript section/page if appropriate)
3. Any justification where you are not making a change, with citations if needed

Write in formal academic prose. Do not use bullet points — write in flowing paragraphs. Begin directly with "We thank the reviewer..."`;

    const aiResponse = await model.invoke(prompt);
    const response = aiResponse.content.toString().trim();

    // ── 2. Embed and store response ───────────────────────────────────────────
    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(`Reviewer response: ${response.slice(0, 500)}`);
    await supabase.from("Documents").insert({
      content: JSON.stringify({ comment, response }),
      embedding: vector,
      metadata: { project_id, phase: 9, type: "reviewer_response" },
    });

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("generate-response error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
