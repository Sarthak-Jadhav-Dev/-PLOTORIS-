import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problem, question, scope, objectives, project_id } = body;
    
    const model = getLLM(req, 0.3, "gemini-2.0-flash");

    const prompt = `
      You are an expert academic research advisor.
      The user has just completed Phase 1 (Initialization) of their research project.
      Here is the data they finalized:
      Problem Statement: ${JSON.stringify(problem)}
      Research Question: ${JSON.stringify(question)}
      Scope: ${JSON.stringify(scope)}
      SMART Objectives: ${JSON.stringify(objectives)}

      Write a cohesive, 2-3 sentence executive summary congratulating them on completing Phase 1 and summarizing what the project is fundamentally about based on these parameters. 
      Do NOT use JSON. Just return the raw text string.
    `;

    const aiResponse = await model.invoke(prompt);
    const summary = aiResponse.content.toString().trim();

    // Embed the final executive summary as the capstone for Phase 1
    if (project_id) {
      try {
        const embeddings = getEmbeddings(req);
        const vector = await embeddings.embedQuery(`Phase 1 Executive Summary: ${summary}`);
        await supabase.from("Documents").insert({
          content: `Phase 1 Executive Summary: ${summary}`,
          embedding: vector,
          metadata: { project_id, phase: 1, role: "assistant", type: "phase_1_summary" }
        });
        
        // Save the structured data to our new phase1_data table
        await supabase.from("phase1_data").upsert({
          project_id,
          problem,
          question,
          scope,
          objectives,
          summary,
          updated_at: new Date().toISOString()
        });
      } catch (err) { console.warn("Saving to database failed", err); }
    }

    const nodes = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

    return NextResponse.json({
      knowledge_graph_nodes: nodes,
      phase1_complete: true,
      next_phase_unlocked: "p2",
      ai_summary: summary
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to finalize Phase 1" }, { status: 500 });
  }
}
