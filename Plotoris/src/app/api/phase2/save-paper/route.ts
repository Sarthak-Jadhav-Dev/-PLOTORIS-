import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paper, project_id } = body;
    
    if (!paper || !project_id) {
      return NextResponse.json({ error: "Paper details and project ID are required." }, { status: 400 });
    }
    

    // Embed the paper abstract
    const embeddings = getEmbeddings(req);

    const textToEmbed = `Title: ${paper.title}\nAuthors: ${paper.authors}\nYear: ${paper.year}\nAbstract: ${paper.abstract}`;
    const vector = await embeddings.embedQuery(textToEmbed);

    // Save to Supabase
    const { error } = await supabase.from("Documents").insert({
      content: textToEmbed,
      embedding: vector,
      metadata: { 
        project_id, 
        phase: 2, 
        role: "user", 
        type: "fetched_paper",
        paper_id: paper.id,
        title: paper.title,
        url: paper.url,
        year: paper.year,
        authors: paper.authors
      }
    });

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error("Failed to store paper in database.");
    }

    return NextResponse.json({ success: true, message: "Paper embedded and added to bucket." });
  } catch (error: any) {
    console.error("Save paper error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
