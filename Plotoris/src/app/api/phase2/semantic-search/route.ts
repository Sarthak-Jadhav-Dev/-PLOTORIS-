import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      console.warn("No valid OPENAI_API_KEY found. Returning mock results.");
      await new Promise(r => setTimeout(r, 1000));
      throw new Error("No OpenAI Key"); // Trigger fallback in frontend
    }

    const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
       throw new Error("Supabase credentials missing.");
    }
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

    const vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
      client,
      tableName: "Documents",
      queryName: "match_documents",
    });

    const similarityResults = await vectorStore.similaritySearchWithScore(query, 5);

    const formattedResults = similarityResults.map(([doc, score]) => ({
      title: doc.metadata.source || "Unknown Source",
      content: doc.pageContent,
      similarity: score, // Note: pgvector match_documents returns cosine similarity where 1 is perfect match
    }));

    return NextResponse.json({ results: formattedResults });

  } catch (error: any) {
    console.error("Semantic Search API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
