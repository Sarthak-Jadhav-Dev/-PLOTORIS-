import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("Documents")
      .select("metadata")
      .eq("metadata->>project_id", projectId)
      .eq("metadata->>type", "github_repo_link")
      .single();

    if (error && error.code !== "PGRST116") { // Ignore no-rows error
      console.error("Fetch github link error:", error);
      return NextResponse.json({ error: "Failed to fetch link." }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ link: null });
    }

    return NextResponse.json({ link: data.metadata });
  } catch (error: any) {
    console.error("Fetch link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Delete all github source embeddings and the link metadata for this project
    const { error } = await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", projectId)
      .eq("metadata->>source", "github");

    if (error) {
      console.error("Delete github link error:", error);
      return NextResponse.json({ error: "Failed to unlink repository." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unlink error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
