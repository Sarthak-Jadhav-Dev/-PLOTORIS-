import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getEmbeddings } from "@/lib/ai-provider";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function POST(req: Request) {
  try {
    const { projectId, url, files } = await req.json();

    if (!projectId || !url || !files || !Array.isArray(files)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }
    const [, owner, repo] = match;
    const token = process.env.GITHUB_TOKEN;

    const embeddings = getEmbeddings(req);
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    
    let totalChunks = 0;

    // We process synchronously to avoid too many parallel requests
    for (const filePath of files) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
        const headers: any = {};
        if (token) headers['Authorization'] = `token ${token}`;
        
        const fileRes = await fetch(rawUrl, { headers });
        if (!fileRes.ok) continue; // Skip files that fail (e.g. binaries or bad paths)
        
        const content = await fileRes.text();
        if (!content || content.trim() === "") continue;

        const chunks = await textSplitter.createDocuments([content]);
        const chunkTexts = chunks.map(c => c.pageContent);
        
        // Batch embed all chunks for this file in one network request!
        const vectors = await embeddings.embedDocuments(chunkTexts);
        
        const records = chunks.map((chunk, i) => ({
          content: chunk.pageContent,
          embedding: vectors[i],
          metadata: {
            project_id: projectId,
            phase: 5,
            type: "code_chunk",
            source: "github",
            github_url: url,
            path: filePath,
            chunk_index: i
          }
        }));

        if (records.length > 0) {
          const { error } = await supabase.from("Documents").insert(records);
          if (error) console.error("Supabase insert error:", error);
          else totalChunks += records.length;
        }

      } catch (err) {
        console.error(`Failed to process file ${filePath}`, err);
      }
    }

    // Save the persistent link record
    const { error: linkError } = await supabase.from("Documents").insert({
      content: url,
      embedding: await embeddings.embedQuery(`Github repo link: ${url}`),
      metadata: {
        project_id: projectId,
        phase: 5,
        type: "github_repo_link",
        source: "github",
        github_url: url,
        files_embedded: files.length,
        total_chunks: totalChunks
      }
    });

    if (linkError) {
      console.error("Failed to save repo link:", linkError);
    }

    return NextResponse.json({ success: true, filesProcessed: files.length, totalChunks });
  } catch (error: any) {
    console.error("GitHub embeddings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
