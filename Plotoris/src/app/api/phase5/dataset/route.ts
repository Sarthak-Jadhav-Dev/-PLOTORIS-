import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const maxDuration = 60; // Just in case, allow longer execution if dataset is huge

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "raw_dataset")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ dataset: null });

    return NextResponse.json({ 
      dataset: JSON.parse(data.content),
      metadata: data.metadata 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // We are receiving a JSON body where payload can be up to ~10-15MB (parsed string).
    // Next.js body size limit is 4MB by default for Edge, but for Node runtime it's higher.
    // If it fails on vercel, we might need configuration, but it should work for local/most cases.
    const body = await req.json();
    const { project_id, filename, rowCount, columns, data } = body;
    
    if (!project_id || !data) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    // Clean up old dataset first
    await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "raw_dataset");

    // Save the new parsed dataset
    const { error } = await supabase.from("Documents").insert({
      content: JSON.stringify(data),
      embedding: new Array(768).fill(0),
      metadata: { 
        project_id, 
        type: "raw_dataset",
        filename,
        rowCount,
        columns
      }
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
