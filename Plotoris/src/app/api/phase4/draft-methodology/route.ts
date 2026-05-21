import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    

    // Fetch all Phase 3 & 4 context (hypothesis, variables, design, sample, ethics, timeline)
    const { data: docs, error: fetchError } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", [
        "hypothesis",
        "variable_map",
        "design_recommendation",
        "sample_size",
        "ethics_checklist",
        "timeline",
      ]);

    if (fetchError) {
      throw new Error(`Failed to fetch project context: ${fetchError.message}`);
    }

    // Build a labelled context string for the prompt
    const contextStr =
      docs
        ?.map(d => {
          const type = (d.metadata as any)?.type ?? "context";
          return `### ${type.toUpperCase()}\n${d.content}`;
        })
        .join("\n\n") || "No prior project context found.";

    const model = getLLM(req, 0.2, "gemini-2.0-flash");

    const prompt = `You are an expert academic researcher and methodologist. Using the following project context from previous phases, write a complete, journal-quality **Research Methodology** section in academic prose. Include all sub-sections: research design, participants & sampling strategy, data collection instruments & procedures, ethical considerations, and data analysis plan. Use markdown headings (##, ###) to structure the output.

Project context:
${contextStr}

Write the full methodology section now. Output only the methodology text — no introduction, no preamble.`;

    const aiResponse = await model.invoke(prompt);
    const methodology = aiResponse.content.toString().trim();

    // Embed and store
    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(methodology.slice(0, 2000));

    await supabase.from("Documents").insert({
      content: methodology,
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "methodology_draft",
      },
    });

    return NextResponse.json({ methodology });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
