import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { query, project_id } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    if (!project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    const embeddings = getEmbeddings(req);

    const queryEmbedding = await embeddings.embedQuery(query);

    // Call the match_documents function in Supabase
    // We filter by project_id and specific types (papers/chunks)
    const { data: documents, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: 8,
      filter: { project_id }
    });

    if (error) {
      console.error("Supabase match_documents error:", error);
      throw new Error("Failed to search database.");
    }

    // Filter to only paper chunks and fetched papers just to be safe
    const validDocs = (documents || []).filter((doc: any) => 
      doc.metadata?.type === "paper_chunk" || doc.metadata?.type === "fetched_paper"
    );

    const formattedResults = validDocs.map((doc: any) => ({
      title: doc.metadata?.title || "Unknown Source",
      content: doc.content,
      similarity: doc.similarity, 
      metadata: doc.metadata
    }));

    return NextResponse.json({ results: formattedResults });

  } catch (error: any) {
    console.error("Semantic Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
