import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");

    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("phase1_data")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (error || !data) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load Phase 1 data" }, { status: 500 });
  }
}
