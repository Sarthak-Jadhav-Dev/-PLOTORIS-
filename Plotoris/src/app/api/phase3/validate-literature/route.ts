import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { hypothesis, project_id } = await req.json();
    if (!hypothesis) {
      return NextResponse.json({ error: "Hypothesis is required" }, { status: 400 });
    }
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    

    // Embed the hypothesis to search against the literature corpus
    const embeddings = getEmbeddings(req);
    const queryEmbedding = await embeddings.embedQuery(hypothesis);

    // Call match_documents RPC to find relevant paper chunks
    const { data: matchedDocs, error: matchError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 8,
      p_project_id: project_id,
    });

    if (matchError) {
      console.error("RPC Error:", matchError);
      throw new Error("Failed to search literature corpus");
    }

    // Format context from retrieved chunks
    const context = matchedDocs && matchedDocs.length > 0 
      ? matchedDocs.map((doc: any) => `Paper: ${doc.metadata?.title || 'Unknown'}\nContent: ${doc.content}`).join("\n\n")
      : "";

    const model = getLLM(req, 0.1, "gemini-2.0-flash");

    const prompt = `
You are a peer reviewer verifying if a hypothesis is supported or contradicted by the existing literature corpus.
Hypothesis: "${hypothesis}"

Context from Literature Corpus:
${context || "No relevant literature found in the corpus."}

Provide a JSON object with this exact structure:
{
  "verdict": "Supported" | "Contradicted" | "Insufficient Evidence",
  "confidence": 85, // integer 0-100
  "explanation": "Detailed explanation based on the literature.",
  "supporting_papers": [
    { "title": "Paper Title", "quote": "Relevant quote supporting the hypothesis." }
  ],
  "contradicting_papers": [
    { "title": "Paper Title", "quote": "Relevant quote contradicting the hypothesis." }
  ]
}
Return only the raw JSON.
`;

    const aiResponse = await model.invoke(prompt);
    let parsed;
    try {
      const contentStr = aiResponse.content.toString().trim();
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentStr);
    } catch (e) {
      console.error("Parse error from Gemini:", aiResponse.content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Embed validation result for later retrieval
    const vector = await embeddings.embedQuery(`Literature validation for hypothesis: ${hypothesis}. Verdict: ${parsed.verdict}`);

    await supabase.from("Documents").insert({
      content: JSON.stringify(parsed),
      embedding: vector,
      metadata: {
        project_id,
        phase: 3,
        type: "literature_validation",
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
