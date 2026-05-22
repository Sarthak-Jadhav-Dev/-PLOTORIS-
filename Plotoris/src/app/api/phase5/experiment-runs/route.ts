import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// GET: fetch all experiment runs for a project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "experiment_run")
      .order("metadata->>created_at", { ascending: true });

    if (error) throw error;

    const runs = data?.map(d => JSON.parse(d.content)) ?? [];
    return NextResponse.json({ runs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: create a new experiment run
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, ...runData } = body;
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const id = runData.id || crypto.randomUUID();
    const run = { ...runData, id, created_at: new Date().toISOString() };

    const embeddings = getEmbeddings(req);
    const textToEmbed = `Experiment Run: ${run.runId}. Operator: ${run.operator}. Condition: ${run.condition}. Hypothesis: ${run.hypothesis || ""}. Outcome: ${run.outcome || ""}. Observations: ${run.observations || ""}`;
    const vector = await embeddings.embedQuery(textToEmbed);

    const { error } = await supabase.from("Documents").insert({
      content: JSON.stringify(run),
      embedding: vector,
      metadata: {
        project_id,
        phase: 5,
        type: "experiment_run",
        run_id: run.runId,
        created_at: run.created_at,
      },
    });

    if (error) throw error;
    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    console.error("Create run error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: update an existing experiment run
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { project_id, id, ...runData } = body;
    if (!project_id || !id) return NextResponse.json({ error: "project_id and id required" }, { status: 400 });

    const run = { ...runData, id, updated_at: new Date().toISOString() };

    const embeddings = getEmbeddings(req);
    const textToEmbed = `Experiment Run: ${run.runId}. Operator: ${run.operator}. Condition: ${run.condition}. Hypothesis: ${run.hypothesis || ""}. Outcome: ${run.outcome || ""}. Observations: ${run.observations || ""}`;
    const vector = await embeddings.embedQuery(textToEmbed);

    // Delete old version and insert updated
    await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "experiment_run")
      .eq("metadata->>run_id", run.runId);

    const { error } = await supabase.from("Documents").insert({
      content: JSON.stringify(run),
      embedding: vector,
      metadata: {
        project_id,
        phase: 5,
        type: "experiment_run",
        run_id: run.runId,
        created_at: run.created_at || new Date().toISOString(),
      },
    });

    if (error) throw error;
    return NextResponse.json({ success: true, run });
  } catch (error: any) {
    console.error("Update run error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: remove a specific experiment run
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    const run_id = searchParams.get("run_id");
    if (!project_id || !run_id) return NextResponse.json({ error: "project_id and run_id required" }, { status: 400 });

    const { error } = await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "experiment_run")
      .eq("metadata->>run_id", run_id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete run error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
