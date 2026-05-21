import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { journal, project_id } = await req.json();
    if (!journal) return NextResponse.json({ error: "Journal name is required" }, { status: 400 });
    if (!project_id) return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    // ── 1. Fetch real journal metadata from OpenAlex ──────────────────────────
    let journalMeta: any = null;
    try {
      const searchUrl = `https://api.openalex.org/sources?search=${encodeURIComponent(journal)}&filter=type:journal&per-page=1&mailto=plotoris@research.ai`;
      const res = await fetch(searchUrl);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        journalMeta = data.results[0];
      }
    } catch (e) { console.warn("OpenAlex journal lookup failed:", e); }

    // ── 2. Fetch project methodology for compliance comparison ────────────────
    const { data: docs } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", ["methodology_draft", "hypothesis", "sample_size"]);

    const contextStr = docs?.map(d => d.content).join("\n\n").slice(0, 4000) || "";

    // ── 3. Gemini: generate compliance checklist against real journal guidelines ─
    const model = getLLM(req, 0.1, "gemini-2.0-flash");

    const journalInfo = journalMeta
      ? `Journal: ${journalMeta.display_name}, Publisher: ${journalMeta.host_organization_name}, ISSN: ${journalMeta.issn_l}, H-index: ${journalMeta.summary_stats?.h_index}`
      : `Journal: ${journal}`;

    const prompt = `You are a manuscript formatting expert. Review the following research project against the formatting guidelines typically required by "${journal}".

JOURNAL INFO (from OpenAlex): ${journalInfo}

MANUSCRIPT CONTEXT:
${contextStr || "Methodology draft not available — use standard academic norms."}

Generate a compliance check report. Include realistic checks for this specific journal type. Return a JSON object:
{
  "journal": "${journal}",
  "publisher": "Publisher name",
  "passedCount": 22,
  "score": 78,
  "issues": [
    {
      "title": "Issue title",
      "description": "Specific description",
      "severity": "critical" | "warning" | "info",
      "fix": "Specific actionable fix"
    }
  ],
  "passed": [
    "Description of a check that passed"
  ],
  "submissionLink": "https://journal-website.com/submit"
}
Return ONLY raw JSON.`;

    const aiResponse = await model.invoke(prompt);
    let result: any;
    try {
      const content = aiResponse.content.toString().trim();
      const match = content.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Enrich with real OpenAlex data if available
    if (journalMeta) {
      result.openalex_id = journalMeta.id;
      result.homepage = journalMeta.homepage_url;
      result.isOA = journalMeta.is_fully_oa;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("format-check error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
