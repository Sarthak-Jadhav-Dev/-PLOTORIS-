import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: fetch saved kanban board for project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "dataset_kanban")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ columns: [] });

    return NextResponse.json(JSON.parse(data.content));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: save full kanban board state
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, columns } = body;
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    // Delete old board first
    await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "dataset_kanban");

    const { error } = await supabase.from("Documents").insert({
      content: JSON.stringify({ columns }),
      embedding: new Array(768).fill(0), // placeholder vector
      metadata: {
        project_id,
        phase: 5,
        type: "dataset_kanban",
        updated_at: new Date().toISOString(),
      },
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save kanban error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
