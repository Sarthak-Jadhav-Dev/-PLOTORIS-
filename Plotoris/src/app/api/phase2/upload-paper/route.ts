import { NextResponse } from "next/server";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
// import pdfParse from "pdf-parse"; // In a real node env, you'd use pdf-parse to extract text. 

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key_here") {
      console.warn("No valid OPENAI_API_KEY found. Simulating successful upload for frontend testing.");
      await new Promise(r => setTimeout(r, 2000));
      return NextResponse.json({ success: true, mock: true });
    }

    // 1. Extract Text (Simplified for Edge/Node compat in this prototype)
    // Normally you'd use WebPDFLoader or pdf-parse here.
    const textContent = "Extracted text from the research paper would go here... Attention is all you need..."; 
    
    // 2. Chunking
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const docs = await textSplitter.createDocuments(
      [textContent], 
      [{ source: file.name, type: "research_paper" }]
    );

    // 3. Supabase Client Setup
    const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
       throw new Error("Supabase credentials missing.");
    }
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);

    // 4. Embed and Store
    await SupabaseVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      {
        client,
        tableName: "Documents",
        queryName: "match_documents",
      }
    );

    return NextResponse.json({ success: true, chunksProcessed: docs.length });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
  }
}
