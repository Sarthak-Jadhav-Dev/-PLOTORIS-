import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { embedAndStore, fetchProjectContext } from "@/lib/rag";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pValue, effectSize, significant, direction, project_id } = body;

    if (!pValue || !effectSize) {
      return NextResponse.json({ error: "pValue and effectSize are required" }, { status: 400 });
    }

    // Fetch project context to ground the verdict in actual hypothesis
    let projectContext = "";
    if (project_id) {
      try {
        projectContext = await fetchProjectContext(project_id);
      } catch (e) {
        console.warn("Context fetch warning:", e);
      }
    }

    const model = getLLM(req, 0.2, "gemini-2.0-flash");

    const systemPrompt = `You are an expert academic researcher and statistician providing the final hypothesis verdict for a research study.
Based on the statistical inputs and project context, generate a definitive, publication-quality verdict.

Return ONLY a raw JSON object with this exact structure (no markdown, no code blocks):
{
  "verdict": "Accepted" | "Partially Supported" | "Rejected" | "Inconclusive",
  "confidence": number (50-98),
  "rationale": "2-3 sentence academic rationale citing the statistical evidence provided. Reference p-value, effect size, and direction.",
  "confidence_factors": [
    { "label": "Statistical Significance", "score": number (0-100) },
    { "label": "Effect Size Adequacy", "score": number (0-100) },
    { "label": "Sample Adequacy", "score": number (0-100) },
    { "label": "Directional Consistency", "score": number (0-100) }
  ],
  "implications": [
    "Implication 1 (practical or theoretical)",
    "Implication 2",
    "Implication 3"
  ],
  "future_directions": "1-2 sentence suggestion for follow-up research."
}

Verdict rules:
- "Accepted": p < 0.05 AND |effectSize| >= 0.3
- "Partially Supported": p < 0.05 AND |effectSize| < 0.3, OR significant === "borderline"
- "Rejected": p >= 0.05 AND significant === "no"
- "Inconclusive": ambiguous evidence`;

    const userMessage = `
Statistical Inputs:
p-value: ${pValue}
Effect Size (β / Cohen's d): ${effectSize}
Significant: ${significant}
Direction of effect: ${direction || "Not specified"}

${projectContext ? `Project Context (for grounding the verdict):\n${projectContext.substring(0, 2000)}` : ""}
`;

    const aiResponse = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    let raw = typeof aiResponse.content === "string" ? aiResponse.content : "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned invalid JSON for verdict");

    const result = JSON.parse(jsonMatch[0]);

    // Embed and store verdict for Phase 9 context
    if (project_id) {
      const textToEmbed = `Hypothesis Verdict: ${result.verdict} (confidence: ${result.confidence}%). Rationale: ${result.rationale}`;
      await embedAndStore(
        textToEmbed,
        {
          project_id,
          phase: 7,
          type: "hypothesis_verdict",
          verdict: result.verdict,
          confidence: result.confidence,
          p_value: pValue,
          effect_size: effectSize,
        },
        req
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("verdict error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate verdict" },
      { status: 500 }
    );
  }
}
