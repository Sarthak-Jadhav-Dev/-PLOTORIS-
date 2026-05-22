import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // Fetch distinct metadata from Documents for this project
    const { data, error } = await supabase
      .from("Documents")
      .select("metadata")
      .eq("metadata->>project_id", projectId)
      .eq("metadata->>phase", 2);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to fetch bucket papers." }, { status: 500 });
    }

    // Deduplicate by paper_id
    const papersMap = new Map();
    (data || []).forEach(doc => {
      const meta = doc.metadata || {};
      const paperId = meta.paper_id;
      if (paperId && !papersMap.has(paperId)) {
        papersMap.set(paperId, {
          id: paperId,
          paper_id: paperId,
          title: meta.title,
          url: meta.url,
          year: meta.year,
          authors: meta.authors,
          source: meta.source || (meta.type === 'fetched_paper' ? 'fetch' : 'upload')
        });
      }
    });

    return NextResponse.json({ papers: Array.from(papersMap.values()) });

  } catch (error: any) {
    console.error("Fetch bucket papers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paperId = searchParams.get("paperId");

    if (!paperId) {
      return NextResponse.json({ error: "paperId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>paper_id", paperId);

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: "Failed to delete paper." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Paper deleted successfully." });

  } catch (error: any) {
    console.error("Delete paper error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
