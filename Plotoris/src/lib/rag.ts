import { createClient } from "@supabase/supabase-js";
import { getEmbeddings } from "@/lib/ai-provider";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

/**
 * Aggregates ALL phase data for a project into a single rich context string.
 * Used by Phase 8, Phase 9 draft, and any future cross-phase agent.
 */
export async function fetchProjectContext(projectId: string): Promise<string> {
  let ctx = `=== FULL PROJECT CONTEXT (${projectId}) ===\n\n`;

  // ── Phase 1: Research Foundation ─────────────────────────────────────────
  const { data: ph1 } = await supabase
    .from("Documents")
    .select("content")
    .eq("metadata->>project_id", projectId)
    .eq("metadata->>phase", "1")
    .in("metadata->>type", ["phase_1_summary", "problem_generation"])
    .limit(5);

  if (ph1 && ph1.length > 0) {
    ctx += "--- PHASE 1: RESEARCH FOUNDATION ---\n";
    ph1.forEach((d) => (ctx += d.content + "\n"));
    ctx += "\n";
  }

  // ── Phase 2: Literature ───────────────────────────────────────────────────
  const { data: ph2Papers } = await supabase
    .from("Documents")
    .select("content, metadata")
    .eq("metadata->>project_id", projectId)
    .in("metadata->>type", ["fetched_paper", "gap_analysis"])
    .limit(10);

  if (ph2Papers && ph2Papers.length > 0) {
    ctx += "--- PHASE 2: LITERATURE & RESEARCH GAPS ---\n";
    ph2Papers.forEach((d, i) => {
      const title = (d.metadata as any)?.title || `Paper ${i + 1}`;
      ctx += `[${i + 1}] ${title}: ${String(d.content).substring(0, 500)}\n`;
    });
    ctx += "\n";
  }

  // ── Phase 3: Hypothesis ───────────────────────────────────────────────────
  const { data: ph3 } = await supabase
    .from("Documents")
    .select("content")
    .eq("metadata->>project_id", projectId)
    .eq("metadata->>phase", "3")
    .in("metadata->>type", ["hypothesis", "variable_map"])
    .limit(5);

  if (ph3 && ph3.length > 0) {
    ctx += "--- PHASE 3: HYPOTHESES & VARIABLES ---\n";
    ph3.forEach((d) => {
      try {
        const parsed = JSON.parse(d.content);
        if (parsed.h1) ctx += `H1: ${parsed.h1}\nH0: ${parsed.h0}\nRationale: ${parsed.rationale}\n`;
        else ctx += d.content + "\n";
      } catch {
        ctx += d.content + "\n";
      }
    });
    ctx += "\n";
  }

  // ── Phase 4: Research Design ──────────────────────────────────────────────
  const { data: ph4 } = await supabase
    .from("Documents")
    .select("content")
    .eq("metadata->>project_id", projectId)
    .in("metadata->>type", ["design_selection", "methodology_draft"])
    .limit(3);

  if (ph4 && ph4.length > 0) {
    ctx += "--- PHASE 4: RESEARCH DESIGN & METHODOLOGY ---\n";
    ph4.forEach((d) => {
      try {
        const parsed = JSON.parse(d.content);
        ctx += `Design: ${parsed.design_type || d.content}\nRationale: ${parsed.rationale || ""}\n`;
      } catch {
        ctx += d.content + "\n";
      }
    });
    ctx += "\n";
  }

  // ── Phase 5: Experiment Data ──────────────────────────────────────────────
  const { data: ph5 } = await supabase
    .from("Documents")
    .select("content")
    .eq("metadata->>project_id", projectId)
    .in("metadata->>type", ["experiment_run", "data_quality_result"])
    .limit(10);

  if (ph5 && ph5.length > 0) {
    ctx += "--- PHASE 5: EXPERIMENTAL DATA & RESULTS ---\n";
    ph5.forEach((d) => {
      try {
        const parsed = JSON.parse(d.content);
        if (parsed.runId) {
          ctx += `Experiment Run [${parsed.runId}]: Condition=${parsed.condition}, Outcome=${parsed.outcome}, Observations=${parsed.observations}\n`;
        } else if (parsed.score) {
          ctx += `Data Quality Score: ${parsed.score}/100 — ${parsed.verdict}. ${parsed.summary}\n`;
        } else {
          ctx += d.content.substring(0, 300) + "\n";
        }
      } catch {
        ctx += d.content.substring(0, 300) + "\n";
      }
    });
    ctx += "\n";
  }

  // ── Phase 7: Results & Claims ─────────────────────────────────────────────
  const { data: ph7Claims } = await supabase
    .from("research_claims")
    .select("claim_text, ai_verdict, confidence_score, evidence_summary")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(15);

  const { data: ph7Docs } = await supabase
    .from("Documents")
    .select("content")
    .eq("metadata->>project_id", projectId)
    .in("metadata->>type", ["interpreted_result", "hypothesis_verdict"])
    .limit(5);

  if ((ph7Claims && ph7Claims.length > 0) || (ph7Docs && ph7Docs.length > 0)) {
    ctx += "--- PHASE 7: VERIFIED CLAIMS & RESULTS ---\n";
    if (ph7Claims) {
      ph7Claims.forEach((c) => {
        ctx += `[${c.ai_verdict} | ${c.confidence_score}% confidence] ${c.claim_text}\n`;
        if (c.evidence_summary) ctx += `  Evidence: ${c.evidence_summary}\n`;
      });
    }
    if (ph7Docs) {
      ph7Docs.forEach((d) => {
        try {
          const parsed = JSON.parse(d.content);
          ctx += `Result Interpretation: ${parsed.paragraph || d.content.substring(0, 400)}\n`;
        } catch {
          ctx += d.content.substring(0, 400) + "\n";
        }
      });
    }
    ctx += "\n";
  }

  // ── Insights Table (hypothesis scores) ───────────────────────────────────
  const { data: insights } = await supabase
    .from("Insights")
    .select("title, description, type, status, score")
    .eq("project_id", projectId)
    .limit(10);

  if (insights && insights.length > 0) {
    ctx += "--- RESEARCH INSIGHTS (Hypotheses / Findings) ---\n";
    insights.forEach((i: any) =>
      ctx += `[${i.type}] ${i.title}: ${i.description} (Status: ${i.status || "N/A"}, Score: ${i.score || "N/A"})\n`
    );
    ctx += "\n";
  }

  return ctx;
}

/**
 * Embeds text and stores it in the Documents table.
 * Returns true on success, false on failure (non-fatal).
 */
export async function embedAndStore(
  text: string,
  metadata: Record<string, any>,
  req: Request
): Promise<boolean> {
  try {
    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(text);

    // Delete any existing doc with same project_id + type to avoid duplicates
    if (metadata.project_id && metadata.type) {
      await supabase
        .from("Documents")
        .delete()
        .eq("metadata->>project_id", metadata.project_id)
        .eq("metadata->>type", metadata.type);
    }

    const { error } = await supabase.from("Documents").insert({
      content: text,
      embedding: vector,
      metadata,
    });

    if (error) {
      console.warn("embedAndStore insert error:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("embedAndStore failed:", err.message);
    return false;
  }
}
