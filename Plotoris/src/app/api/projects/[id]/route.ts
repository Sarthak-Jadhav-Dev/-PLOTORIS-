import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // 1. Delete all Documents (embeddings, variables, chunks) associated with the project
    const { error: docError } = await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", projectId);

    if (docError) {
      console.error("Failed to delete project documents:", docError);
    }

    // 2. Delete all Project Members (invitations, access)
    const { error: memberError } = await supabase
      .from("ProjectMembers")
      .delete()
      .eq("project_id", projectId);
      
    if (memberError) {
      console.error("Failed to delete project members:", memberError);
    }

    // 3. Delete the actual Project metadata
    const { error: projError } = await supabase
      .from("Projects")
      .delete()
      .eq("id", projectId);

    if (projError) {
      console.error("Failed to delete project:", projError);
      return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete project API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
