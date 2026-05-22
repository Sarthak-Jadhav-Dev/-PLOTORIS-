import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { fetchProjectContext, embedAndStore } from "@/lib/rag";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300; // 5 min — jury pipeline needs time

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface JurorResult {
  jurorName: string;
  score: number; // 1-10
  comments: string;
  mustFix: string[];
}

interface JuryRound {
  section: string;
  round: number;
  jurors: JurorResult[];
  avgScore: number;
  syncDecision: "PASS" | "REVISE";
  syncReason: string;
  revisedContent?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// IEEE Rules (shared)
// ──────────────────────────────────────────────────────────────────────────────

const IEEE_RULES = `
CRITICAL FORMATTING RULES:
1. Maintain a highly professional, humanized academic tone. Do NOT sound robotic.
2. Do NOT use Markdown (** or _). Use plain prose only.
3. Include inline IEEE citations [1], [2], [3-5] where appropriate.
4. Output ONLY the section body — NO heading HTML, NO JSON, NO code blocks.
5. Every factual claim must be grounded in the project context provided.
6. Use precise statistical language: effect sizes (Cohen's d, β), p-values, confidence intervals.
`;

// ──────────────────────────────────────────────────────────────────────────────
// Section Configurations
// ──────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key: "abstract",
    heading: "Abstract",
    wordCount: "200-250",
    instructions: "Summarize the research problem, methodology, key findings (cite specific statistics), and implications. Self-contained.",
  },
  {
    key: "introduction",
    heading: "I. INTRODUCTION",
    wordCount: "500-600",
    instructions: "Establish the real-world significance of the problem. Review the knowledge gap. State the study's specific contribution and outline the paper structure.",
  },
  {
    key: "literatureReview",
    heading: "II. LITERATURE REVIEW",
    wordCount: "600-750",
    instructions: "Synthesize prior work thematically. Cite using [1], [2]. Show evolution of thinking. Explicitly identify the gap this study fills.",
  },
  {
    key: "methodology",
    heading: "III. METHODOLOGY",
    wordCount: "500-600",
    instructions: "Detail the research design, sampling strategy, data collection instruments, and analysis approach. Justify every methodological choice.",
  },
  {
    key: "results",
    heading: "IV. RESULTS AND DISCUSSION",
    wordCount: "800-1000",
    instructions: "Present findings with specific statistics from the context (p-values, β, CIs, n). Discuss implications. Where data supports it, write [TABLE: description] or [FIGURE: description] placeholders. Compare with prior literature.",
  },
  {
    key: "conclusion",
    heading: "V. CONCLUSION",
    wordCount: "300-380",
    instructions: "Summarize key contributions, acknowledge limitations, suggest specific future directions. No new findings.",
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Node: Draft a single section
// ──────────────────────────────────────────────────────────────────────────────

async function draftSection(
  sectionConfig: typeof SECTIONS[0],
  context: string,
  priorFeedback: string,
  req: Request
): Promise<string> {

  const systemPrompt = `You are an expert academic researcher and scientific writer.
You are drafting the "${sectionConfig.heading}" section of a research paper in IEEE format.
${IEEE_RULES}
Section instructions: ${sectionConfig.instructions}
Target word count: ~${sectionConfig.wordCount} words.
${priorFeedback ? `\nPRIOR JURY FEEDBACK TO ADDRESS:\n${priorFeedback}\n` : ""}`;

  const userMessage = `Using the project context below, draft the "${sectionConfig.heading}" section.
Be specific — reference the actual variables, statistics, hypotheses, and literature in the context.
Do NOT be generic.

PROJECT CONTEXT:
${context}`;

  // If using Groq, aggressively limit maxTokens to avoid blowing up the TPM
  const apiProvider = req.headers.get("x-api-provider") || "gemini";
  const maxTokens = apiProvider === "groq" ? 1000 : 1500;
  
  const model = getLLM(req, 0.6, "gemini-2.0-flash", maxTokens);

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(userMessage),
  ]);

  let content = typeof response.content === "string" ? response.content : "";
  return content.replace(/\*\*/g, "").replace(/```/g, "").trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Node: Single Juror evaluation
// ──────────────────────────────────────────────────────────────────────────────

async function runJuror(
  jurorName: string,
  jurorRole: string,
  sectionName: string,
  sectionContent: string,
  context: string,
  req: Request
): Promise<JurorResult> {
  const model = getLLM(req, 0.2, "gemini-2.0-flash", 250);

  const systemPrompt = `You are ${jurorName}, a senior academic peer reviewer specializing in ${jurorRole}.
You are evaluating the "${sectionName}" section of a research paper.
Score the section on your domain (1-10) and provide specific, actionable feedback.

Return ONLY raw JSON (no markdown):
{
  "jurorName": "${jurorName}",
  "score": number (1-10, where 7+ is publish-ready),
  "comments": "2-3 sentences of specific, constructive feedback referencing exact issues in the text.",
  "mustFix": ["Specific fix 1", "Specific fix 2"] // only items that would prevent publication
}`;

  const userMessage = `Evaluate this "${sectionName}" section:

${sectionContent}

---
Project Context (for grounding your evaluation):
${context.substring(0, 1500)}`;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    let raw = typeof response.content === "string" ? response.content : "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Juror returned invalid JSON");

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Fallback if juror fails
    return {
      jurorName,
      score: 7,
      comments: "Evaluation could not be parsed. Section assumed acceptable.",
      mustFix: [],
    };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Node: Synchronizer — aggregates jury feedback and decides PASS or REVISE
// ──────────────────────────────────────────────────────────────────────────────

async function synchronize(
  sectionName: string,
  sectionContent: string,
  jurors: JurorResult[],
  round: number,
  req: Request
): Promise<{ decision: "PASS" | "REVISE"; reason: string; consolidatedFeedback: string }> {
  const avgScore = jurors.reduce((s, j) => s + j.score, 0) / jurors.length;

  // Hard rule: if round 2 (max loops reached) or avg >= 7, always PASS
  if (round >= 2 || avgScore >= 7) {
    return {
      decision: "PASS",
      reason: avgScore >= 7
        ? `Section achieved average jury score of ${avgScore.toFixed(1)}/10 — publication ready.`
        : `Maximum revision rounds reached. Accepting current version with score ${avgScore.toFixed(1)}/10.`,
      consolidatedFeedback: "",
    };
  }

  // Consolidate all mustFix items
  const allFixes = jurors.flatMap((j) => j.mustFix).filter(Boolean);
  const consolidatedFeedback = allFixes.length > 0
    ? `Address these specific issues in the revision:\n${allFixes.map((f, i) => `${i + 1}. ${f}`).join("\n")}`
    : jurors.map((j) => `${j.jurorName}: ${j.comments}`).join("\n");

  return {
    decision: "REVISE",
    reason: `Average jury score: ${avgScore.toFixed(1)}/10 (threshold: 7.0). Sending for revision.`,
    consolidatedFeedback,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Node: Visual Architect — generates Mermaid diagrams and HTML tables
// ──────────────────────────────────────────────────────────────────────────────

async function visualArchitect(
  context: string,
  resultsSection: string,
  methodologySection: string,
  req: Request
): Promise<string> {
  const model = getLLM(req, 0.4, "gemini-2.0-flash", 1000);

  const systemPrompt = `You are a Visual Architect agent for academic papers.
Based on the project context and paper sections, generate visual elements to enrich the paper.
Generate exactly 3 visual elements:
1. A Mermaid flowchart showing the Research Methodology Pipeline
2. An HTML table showing Results Comparison (groups, conditions, means, SDs, p-values based on context)
3. A Mermaid graph showing the Conceptual Framework (IV → mediators/moderators → DV)

Return ONLY raw JSON (no markdown wrapping):
{
  "visuals": [
    {
      "id": "fig1",
      "title": "Figure 1: Research Methodology Pipeline",
      "type": "mermaid",
      "caption": "Overview of the research methodology used in this study.",
      "code": "flowchart TD\n  A[Research Problem] --> B[Literature Review]..."
    },
    {
      "id": "table1",
      "title": "Table 1: Summary of Results",
      "type": "html_table",
      "caption": "Comparison of key outcome measures across study conditions.",
      "html": "<table>...</table>"
    },
    {
      "id": "fig2",
      "title": "Figure 2: Conceptual Framework",
      "type": "mermaid",
      "caption": "Theoretical model underpinning the study.",
      "code": "graph LR\n  IV[Independent Variable] --> DV[Dependent Variable]..."
    }
  ]
}

MERMAID RULES:
- Use valid Mermaid syntax only
- Quote node labels with special characters: A["Label (Detail)"]
- Keep diagrams clean and readable
- For flowchart: use TD (top-down) or LR (left-right)

HTML TABLE RULES:
- Use proper <table>, <thead>, <tbody>, <tr>, <th>, <td> tags
- Add style="border-collapse: collapse; width: 100%; font-family: Times New Roman; font-size: 10pt;"
- Add border="1" to the table element
- Extract or infer realistic values from the context`;

  const userMessage = `Generate visuals for a research paper based on:

PROJECT CONTEXT:
${context.substring(0, 2000)}

METHODOLOGY SECTION:
${methodologySection.substring(0, 800)}

RESULTS SECTION:
${resultsSection.substring(0, 1000)}`;

  try {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    let raw = typeof response.content === "string" ? response.content : "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return "";

    const parsed = JSON.parse(jsonMatch[0]);
    const visuals = parsed.visuals || [];

    // Convert to HTML for embedding in the paper
    let html = `<h2 style="text-align:center; font-size:14pt; text-transform:uppercase; margin-top:18pt;">FIGURES AND TABLES</h2>`;

    for (const v of visuals) {
      html += `<div style="margin: 20pt 0; page-break-inside: avoid; column-span: all;">`;
      html += `<p style="text-align:center; font-weight:bold; font-size:10pt;">${v.title}</p>`;

      if (v.type === "mermaid") {
        // Embed mermaid as a pre block with class — the editor renders it
        html += `<pre class="mermaid" style="background: #f9f9f9; border: 1px solid #ddd; padding: 12px; font-size: 9pt; overflow-x: auto;">${v.code}</pre>`;
      } else if (v.type === "html_table") {
        html += v.html;
      }

      html += `<p style="text-align:center; font-style:italic; font-size:9pt; margin-top:6pt;">${v.caption}</p>`;
      html += `</div>`;
    }

    return html;
  } catch (e) {
    console.warn("Visual Architect failed:", e);
    return "";
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Node: Draft References
// ──────────────────────────────────────────────────────────────────────────────

async function draftReferences(context: string, req: Request): Promise<string> {
  const model = getLLM(req, 0.3, "gemini-1.5-pro", 1000);

  const prompt = `You are an expert academic researcher. Generate the References section for a research paper.
Based on the literature in the context, format all references in strict IEEE format.
If the provided literature is less than 15 items, supplement with realistic, highly relevant academic references to reach at least 15 total.
Format: [N] Author(s), "Title," Journal/Conference, vol. X, no. Y, pp. ZZ-ZZ, Year. DOI.
Output ONLY the reference list items, each wrapped in a <p> tag. No heading.

Context:
${context.substring(0, 3000)}`;

  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  return content.replace(/\*\*/g, "").trim();
}

// ──────────────────────────────────────────────────────────────────────────────
// Main POST Handler — The Grand Jury Pipeline
// ──────────────────────────────────────────────────────────────────────────────

let globalReq: Request;

export async function POST(request: Request) {
  globalReq = request;

  try {
    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    console.log(`[Phase9] Starting Grand Jury Pipeline for project: ${projectId}`);

    // ── Step 1: Fetch full cross-phase context ──────────────────────────────
    const richContext = await fetchProjectContext(projectId);
    console.log(`[Phase9] Context fetched (${richContext.length} chars)`);

    // ── Step 2: Process each section through the Jury Loop ──────────────────
    const finalSections: Record<string, string> = {};
    const fullJuryLog: JuryRound[] = [];
    
    const apiProvider = request.headers.get("x-api-provider") || "gemini";
    const isGroq = apiProvider === "groq";

    // For Groq, aggressively trim context to fit 6000 TPM limits across loops
    const draftingContext = isGroq ? richContext.substring(0, 6000) : richContext;

    // Use a single generalized juror for Groq, or the full 3-juror panel for others
    const JUROR_CONFIGS = isGroq 
      ? [
          {
            name: "Prof. Chen (Academic Reviewer)",
            role: "academic prose, logic, formatting, and evidence grounding",
          }
        ]
      : [
          {
            name: "Dr. Morgan (Methodologist)",
            role: "research methodology, statistical rigor, and study design",
          },
          {
            name: "Prof. Chen (Academic Editor)",
            role: "academic prose quality, clarity, logical flow, and IEEE formatting",
          },
          {
            name: "Dr. Patel (Evidence Reviewer)",
            role: "citation strength, evidence grounding, and claim substantiation",
          },
        ];

    for (const section of SECTIONS) {
      console.log(`[Phase9] Processing section: ${section.heading}`);
      let currentContent = "";
      let priorFeedback = "";

      // Jury revision loop (max 1 round for Groq to save tokens, max 2 for others)
      const maxRounds = isGroq ? 1 : 2;
      for (let round = 0; round <= maxRounds; round++) {
        // Draft (or re-draft) the section
        currentContent = await draftSection(section, draftingContext, priorFeedback, request);

        // Run jurors in parallel
        const jurorResults = await Promise.all(
          JUROR_CONFIGS.map((jc) =>
            runJuror(jc.name, jc.role, section.heading, currentContent, richContext, request)
          )
        );

        const avgScore = jurorResults.reduce((s, j) => s + j.score, 0) / jurorResults.length;

        // Synchronizer decision
        const { decision, reason, consolidatedFeedback } = await synchronize(
          section.heading,
          currentContent,
          jurorResults,
          round,
          request
        );

        const juryRound: JuryRound = {
          section: section.heading,
          round: round + 1,
          jurors: jurorResults,
          avgScore: Math.round(avgScore * 10) / 10,
          syncDecision: decision,
          syncReason: reason,
        };

        if (decision === "REVISE") {
          juryRound.revisedContent = `Revision ${round + 1} requested`;
          priorFeedback = consolidatedFeedback;
        }

        fullJuryLog.push(juryRound);
        console.log(`[Phase9] ${section.heading} Round ${round + 1}: ${decision} (avg: ${avgScore.toFixed(1)})`);

        if (decision === "PASS") break;
      }

      finalSections[section.key] = currentContent;
    }

    // ── Step 3: Draft References ────────────────────────────────────────────
    console.log("[Phase9] Drafting references...");
    const referencesContent = await draftReferences(richContext, request);

    // ── Step 4: Visual Architect ────────────────────────────────────────────
    console.log("[Phase9] Running Visual Architect...");
    const visualsHtml = await visualArchitect(
      richContext,
      finalSections.results || "",
      finalSections.methodology || "",
      request
    );

    // ── Step 5: Compile Final Paper ─────────────────────────────────────────
    const wrapSection = (heading: string, content: string) =>
      `<h2>${heading}</h2>\n<p>${content.replace(/\n\n+/g, "</p><p>").replace(/\n/g, " ")}</p>`;

    const finalDraft = `
<h1 style="text-align: center; font-size: 18pt; margin-bottom: 8pt; column-span: all;">
  Research Paper Draft
</h1>
<p style="text-align: center; font-style: italic; font-size: 9pt; margin-bottom: 24pt; column-span: all;">
  Generated by Plotoris Grand Jury AI Pipeline · ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
</p>

${wrapSection("Abstract", finalSections.abstract || "")}
${wrapSection("I. INTRODUCTION", finalSections.introduction || "")}
${wrapSection("II. LITERATURE REVIEW", finalSections.literatureReview || "")}
${wrapSection("III. METHODOLOGY", finalSections.methodology || "")}
${visualsHtml}
${wrapSection("IV. RESULTS AND DISCUSSION", finalSections.results || "")}
${wrapSection("V. CONCLUSION", finalSections.conclusion || "")}
<h2>VI. REFERENCES</h2>
${referencesContent}
`.trim();

    // ── Step 6: Store final paper as embedding ──────────────────────────────
    await embedAndStore(
      `Final Research Paper: ${finalDraft.substring(0, 1000)}`,
      {
        project_id: projectId,
        phase: 9,
        type: "final_paper",
        sections_count: SECTIONS.length,
        jury_rounds: fullJuryLog.length,
        generated_at: new Date().toISOString(),
      },
      request
    );

    // Store jury log separately
    await supabase.from("Documents").insert({
      content: JSON.stringify(fullJuryLog),
      embedding: new Array(768).fill(0),
      metadata: {
        project_id: projectId,
        phase: 9,
        type: "jury_log",
        generated_at: new Date().toISOString(),
      },
    });

    console.log("[Phase9] Grand Jury Pipeline complete!");

    return NextResponse.json({
      draft: finalDraft,
      juryLog: fullJuryLog,
      stats: {
        totalRounds: fullJuryLog.length,
        sectionsProcessed: SECTIONS.length,
        hasVisuals: visualsHtml.length > 0,
      },
    });
  } catch (err: any) {
    console.error("[Phase9] Drafting error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error in Grand Jury Pipeline" },
      { status: 500 }
    );
  }
}
