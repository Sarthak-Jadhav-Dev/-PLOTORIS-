import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id, oaPreference, speed } = await req.json();
    const geminiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

    if (!project_id) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    if (!geminiKey) return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });

    // ── 1. Retrieve full project context from all phases ──────────────────────
    const { data: docs } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", [
        "phase_1_summary", "hypothesis", "variable_map",
        "design_recommendation", "methodology_draft", "literature_validation"
      ]);

    const contextStr = docs?.map(d => {
      const type = (d.metadata as any)?.type ?? "context";
      return `### ${type.toUpperCase()}\n${d.content}`;
    }).join("\n\n") || "No prior context.";

    // ── 2. Extract keywords from context for real API search ─────────────────
    const model = new ChatGoogleGenerativeAI({ apiKey: geminiKey, model: "gemini-2.0-flash", temperature: 0.1 });

    const kwPrompt = `Extract 3-5 concise academic search keywords from this project context. Return only a JSON array of strings: ["keyword1", "keyword2"]\n\n${contextStr.slice(0, 3000)}`;
    const kwResponse = await model.invoke(kwPrompt);
    let keywords: string[] = [];
    try {
      const match = kwResponse.content.toString().match(/\[[\s\S]*\]/);
      keywords = match ? JSON.parse(match[0]) : ["academic research"];
    } catch { keywords = ["academic research"]; }

    const query = keywords.join(" ");

    // ── 3. Real API: OpenAlex — search journals by topic ─────────────────────
    let openAlexJournals: any[] = [];
    try {
      const oaUrl = `https://api.openalex.org/sources?search=${encodeURIComponent(query)}&filter=type:journal&sort=cited_by_count:desc&per-page=8&mailto=plotoris@research.ai`;
      const oaRes = await fetch(oaUrl);
      const oaData = await oaRes.json();
      openAlexJournals = (oaData.results || []).slice(0, 8).map((j: any) => ({
        name: j.display_name,
        issn: j.issn_l,
        publisher: j.host_organization_name || "Unknown",
        isOA: j.is_fully_oa,
        h_index: j.summary_stats?.h_index,
        works_count: j.works_count,
        cited_by_count: j.cited_by_count,
        homepage: j.homepage_url,
        openalex_id: j.id,
      }));
    } catch (e) { console.warn("OpenAlex fetch failed:", e); }

    // ── 4. Gemini AI: rank & enrich journals with match scores ────────────────
    const rankPrompt = `You are a publication strategy expert. Given this research project context and a list of real journals from OpenAlex, rank and recommend the top 4 journals with match scores and rationale.

PROJECT CONTEXT:
${contextStr.slice(0, 4000)}

USER PREFERENCES:
- Open Access preference: ${oaPreference || "Any"}
- Review speed preference: ${speed || "Standard"}

REAL JOURNALS FROM OPENALEX:
${JSON.stringify(openAlexJournals, null, 2)}

For each recommended journal, provide this exact JSON structure:
{
  "journals": [
    {
      "name": "Journal Name",
      "publisher": "Publisher Name",
      "matchScore": 92,
      "impactFactor": "4.2",
      "quartile": "Q1",
      "acceptanceRate": "18%",
      "reviewTime": "8 weeks",
      "isOpenAccess": true,
      "homepage": "https://...",
      "rationale": "2-3 sentence explanation of why this journal fits the project.",
      "tags": ["High Impact", "Open Access", "Education"],
      "submissionTips": "One specific tip for submitting to this journal."
    }
  ]
}
Return ONLY raw JSON.`;

    const rankResponse = await model.invoke(rankPrompt);
    let result: any;
    try {
      const content = rankResponse.content.toString().trim();
      const match = content.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : JSON.parse(content);
    } catch (e) {
      console.error("Gemini rank parse error:", rankResponse.content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // ── 5. Embed and store recommendation for project history ─────────────────
    const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey: geminiKey, model: "text-embedding-004" });
    const vector = await embeddings.embedQuery(`Journal recommendations: ${result.journals?.map((j: any) => j.name).join(", ")}`);
    await supabase.from("Documents").insert({
      content: JSON.stringify(result),
      embedding: vector,
      metadata: { project_id, phase: 9, type: "journal_recommendations" },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("recommend-journals error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
