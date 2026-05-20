import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { iv, dv, relationship, project_id } = body;

    const geminiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

    if (!iv || !dv) {
      return NextResponse.json({ error: "IV and DV are required" }, { status: 400 });
    }
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key is required" }, { status: 401 });
    }

    // ─── Step 1: Retrieve Phase 1 context ────────────────────────────────────
    const { data: phase1Docs, error: p1Error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>phase", "1")
      .in("metadata->>type", ["phase_1_summary", "problem_generation"]);

    if (p1Error) console.warn("Phase 1 fetch warning:", p1Error.message);

    const phase1Context = phase1Docs?.map(d => d.content).join("\n\n") || "";

    // ─── Step 2: Retrieve Phase 2 literature gap context via pgvector RAG ────
    // Embed the user's IV + DV to find the most relevant literature
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: geminiKey,
      model: "text-embedding-004",
    });

    const queryText = `${iv} ${dv} ${relationship}`;
    const queryEmbedding = await embeddings.embedQuery(queryText);

    const { data: ragDocs, error: ragError } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: 0.45,
      match_count: 6,
      p_project_id: project_id,
    });

    if (ragError) console.warn("Phase 2 RAG warning:", ragError.message);

    const literatureContext =
      ragDocs && ragDocs.length > 0
        ? ragDocs
            .map((doc: any) => `Source: ${doc.metadata?.title || "Paper"}\n${doc.content}`)
            .join("\n\n")
        : "No literature corpus found — generating based on domain knowledge.";

    // ─── Step 3: Call Gemini with full cross-phase context ───────────────────
    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-2.0-flash",
      temperature: 0.2,
    });

    const prompt = `You are an expert academic research advisor and scientific writer.
A researcher is building a formal hypothesis for their study. Use ALL of the following context to craft a precise, rigorous hypothesis.

--- PHASE 1: RESEARCH FOUNDATION ---
${phase1Context || "Not available — infer from the variables provided."}

--- PHASE 2: RELEVANT LITERATURE (retrieved via semantic search) ---
${literatureContext}

--- USER-PROVIDED VARIABLES ---
Independent Variable (IV): "${iv}"
Dependent Variable (DV): "${dv}"
Expected Relationship: "${relationship}"

Your task:
1. Formulate a formal Alternative Hypothesis (H1) grounded in the literature above.
2. Formulate the corresponding Null Hypothesis (H0).
3. Provide a rationale explaining why this hypothesis is scientifically valid and testable.
4. Suggest 3-5 relevant academic keywords for this hypothesis.
5. Briefly name the most appropriate conceptual framework for this study.

Respond STRICTLY as a raw JSON object with this exact structure:
{
  "h1": "The formal alternative hypothesis statement.",
  "h0": "The formal null hypothesis statement.",
  "rationale": "2-3 sentence scientific rationale grounded in the literature.",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "conceptual_framework": "Name of the most appropriate theory or framework (e.g., Social Cognitive Theory)"
}
Return ONLY the raw JSON. No markdown. No preamble.`;

    const aiResponse = await model.invoke(prompt);

    let parsed: any;
    try {
      const contentStr = aiResponse.content.toString().trim();
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentStr);
    } catch (e) {
      console.error("Gemini parse error:", aiResponse.content.toString());
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // ─── Step 4: Validate required fields ────────────────────────────────────
    if (!parsed.h1 || !parsed.h0) {
      return NextResponse.json(
        { error: "AI returned incomplete hypothesis structure" },
        { status: 500 }
      );
    }

    // ─── Step 5: Embed and store hypothesis in Supabase for Phase 4 RAG ──────
    const hypothesisText = `H1: ${parsed.h1} | H0: ${parsed.h0} | Rationale: ${parsed.rationale}`;
    const vector = await embeddings.embedQuery(hypothesisText);

    const { error: insertError } = await supabase.from("Documents").insert({
      content: JSON.stringify({
        h1: parsed.h1,
        h0: parsed.h0,
        rationale: parsed.rationale,
        keywords: parsed.keywords,
        conceptual_framework: parsed.conceptual_framework,
        iv,
        dv,
        relationship,
      }),
      embedding: vector,
      metadata: {
        project_id,
        phase: 3,
        type: "hypothesis",
        iv,
        dv,
        relationship,
      },
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError.message);
      // Non-fatal: return result even if storage fails
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("generate-hypothesis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate hypothesis" },
      { status: 500 }
    );
  }
}
