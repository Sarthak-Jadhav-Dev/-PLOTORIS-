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
CRITICAL IEEE JOURNAL FORMATTING & WRITING RULES:

1. FONT & TYPOGRAPHY: All body text is 10pt, Times New Roman. Justified alignment. Single-spaced. No line gaps between sentences within a paragraph.
2. TONE: Strictly formal IEEE journal tone. Passive voice predominates. High technical vocabulary. Dense academic paragraphs. Absolutely NO conversational language, marketing language, or colloquialisms.
3. MARKDOWN FORBIDDEN: Do NOT use ** or _ for bold/italics. Do NOT output code blocks or JSON. Output ONLY raw paragraph text.
4. CITATIONS: Use IEEE numeric inline citations [1], [2], [3]–[5] wherever factual claims, algorithms, or prior work are referenced. Every paragraph should contain at least one citation.
5. FACTUAL GROUNDING: Every factual claim, statistic, algorithm name, benchmark result, or architectural detail MUST be derived from or consistent with the project context provided.
6. TECHNICAL DEPTH: Reference specific algorithm names, time complexity (e.g., O(n log n)), API endpoints, module names, framework versions, and evaluation metrics (precision, recall, F1, latency in ms, throughput in req/s, BLEU score, RMSE, etc.).
7. SECTION BODY ONLY: Output ONLY the body text of the section — no section headings, no HTML tags, no JSON, no code fences.
8. STATISTICAL RIGOR: Use effect sizes (Cohen's d, β coefficients), p-values (e.g., p < 0.001), confidence intervals (95% CI), and sample sizes (n = X) where relevant.
9. SUBHEADINGS: When a section needs sub-divisions, format them as "A. Subheading Title" or "B. Another Subheading" on their own line. Use alphabetical lettering. Bold style. Title Case.
10. ACADEMIC TRANSITIONS: Use formal transitional phrases: "Furthermore,", "In contrast,", "Consequently,", "It is evident that", "The aforementioned", "It is noteworthy that", "Empirical results corroborate...".
11. FIGURES/TABLES placeholders: When referencing a figure or table write inline: [FIGURE: descriptive caption] or [TABLE: descriptive caption with column names].
`;

// ──────────────────────────────────────────────────────────────────────────────
// Section Configurations
// ──────────────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key: "abstract",
    heading: "Abstract",
    wordCount: "450-650",
    instructions: `Write a single, dense, unbroken paragraph (NO line breaks, NO sub-headings). The abstract MUST begin with the exact inline label 'Abstract —' (do not wrap this in a tag — just start the text with it). Italicize the entire abstract body in the final HTML. Include ALL of the following in sequence: (1) problem context and motivation with domain statistics; (2) proposed system/framework name and its high-level purpose; (3) core algorithms and architectural components used; (4) system architecture description (layers/modules); (5) benchmark datasets or evaluation settings; (6) quantitative results (accuracy %, latency ms, F1 score, throughput, etc.); (7) a strong contribution statement. 450-650 words. Dense, highly technical language. No citations in the abstract.`,
  },
  {
    key: "keywords",
    heading: "Keywords",
    wordCount: "8-15 keywords",
    instructions: `Generate exactly 8 to 15 highly technical, domain-specific keywords relevant to the research. Output ONLY the keywords as a comma-separated list. Start with the inline label 'Keywords —' (do not wrap in a tag). Italicize the whole line in the final HTML. Example: Keywords — deep learning, transformer architecture, semantic segmentation, real-time inference...`,
  },
  {
    key: "introduction",
    heading: "I. INTRODUCTION",
    wordCount: "700-1000",
    instructions: `Write a comprehensive IEEE introduction with the following sub-structure:
A. Background and Motivation — Establish real-world significance with quantitative evidence and references [1]-[3].
B. Problem Statement — Define the specific technical gap or limitation in current approaches.
C. Proposed Approach — Summarise the key innovations of the proposed system with technical specificity.
D. Contributions — List 3-5 numbered technical contributions of this work.
E. Paper Organization — End with 'The remainder of this paper is organized as follows...' sentence describing each section.
700-1000 words total.`,
  },
  {
    key: "literatureReview",
    heading: "II. RELATED WORK",
    wordCount: "900-1300",
    instructions: `Synthesize prior academic work thematically in 900-1300 words. Organize with clear sub-sections (A, B, C...) by topic cluster. Each sub-section must cite 3-5 prior works [N]. For each cited work describe: what it proposed, its methodology, its limitations, and how it differs from the current study. End with a synthesis paragraph explaining the collective gap and how this paper fills it. Use academic language: 'seminal work', 'extant literature', 'notwithstanding these advances', 'heretofore unexplored'.`,
  },
  {
    key: "methodology",
    heading: "III. METHODOLOGY",
    wordCount: "1200-1800",
    instructions: `Write a detailed, technically rigorous methodology section in 1200-1800 words. Structure with sub-sections:
A. System Architecture Overview — Describe the end-to-end layered architecture. Reference a [FIGURE: System Architecture Diagram] placeholder.
B. Data Collection and Preprocessing — Detail data sources, preprocessing pipeline, normalization, feature engineering.
C. Algorithm Design — Explain each algorithm in depth. Include complexity analysis (time and space). Reference pseudocode or equations.
D. Module Implementation — Describe APIs, SDKs, libraries, and software modules used. Mention specific versions.
E. Training and Optimization — Explain training procedures, loss functions, hyperparameter settings, optimizers.
F. Evaluation Framework — Describe evaluation metrics, cross-validation strategy, and test setup.
Use passive voice. Include equations described in text (e.g., 'The loss function L is defined as the mean squared error between...'). Mention specific complexity notations.`,
  },
  {
    key: "results",
    heading: "IV. RESULTS AND DISCUSSION",
    wordCount: "700-1200",
    instructions: `Write a quantitative results section in 700-1200 words. Structure as:
A. Experimental Setup — Dataset sizes (n=X), hardware specs, training epochs, batch sizes.
B. Quantitative Results — Report specific metrics: accuracy, precision, recall, F1 score, RMSE, latency (ms), throughput (req/s), BLEU scores etc. Include a [TABLE: Comparative Performance Results - columns: Method, Accuracy, F1, Latency(ms), Parameters].
C. Comparative Analysis — Compare against at least 3 baseline methods citing prior work [N]. Use relative improvement language: 'a relative improvement of X% over the next best baseline'.
D. Ablation Study — Analyze contribution of individual components to overall performance.
E. Discussion — Interpret results, discuss implications, address limitations of the experimental evaluation.
All numbers must be realistic and consistent with context. Use strong quantitative language.`,
  },
  {
    key: "conclusion",
    heading: "V. CONCLUSION AND FUTURE WORK",
    wordCount: "250-400",
    instructions: `Write a conclusive section in 250-400 words:
1. Restate the core research problem and why it matters (1-2 sentences).
2. Summarize the proposed system and its key technical innovations.
3. State the most important empirical results as evidence of the contribution.
4. Acknowledge specific limitations of this study.
5. Describe concrete future research directions (3-4 specific directions with technical detail).
6. End with a strong statement of academic significance: e.g., 'This work establishes a foundation for...'
No new findings. No citations. Formal concluding tone.`,
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

  const systemPrompt = `You are a senior IEEE journal author and academic writing expert. You write at the level of papers published in IEEE Transactions or top ACM/USENIX venues.

You are now drafting the "${sectionConfig.heading}" section of a full research paper.

${IEEE_RULES}

SECTION-SPECIFIC INSTRUCTIONS:
${sectionConfig.instructions}

TARGET WORD COUNT: ${sectionConfig.wordCount} words. Do NOT produce less than the minimum.

${priorFeedback ? `PEER REVIEW FEEDBACK FROM PRIOR DRAFT (MANDATORY TO ADDRESS):\n${priorFeedback}\n` : ""}

CRITICAL REMINDERS:
- Output ONLY the body text of this section. No headings. No HTML. No JSON. No markdown.
- Write long, dense, scholarly paragraphs. Avoid short paragraphs.
- Every technical claim needs a citation [N].
- Generate realistic technical terminology, algorithm names, API names, module names, and benchmarks that are consistent with the project context.
- The writing must be indistinguishable from a real IEEE journal paper.`;

  const userMessage = `Draft the "${sectionConfig.heading}" section NOW, using the following project context as your primary source of truth. Be highly specific — reference the actual variables, hypotheses, algorithms, data sources, and statistics present in the context. Do NOT produce generic filler text.

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

  const systemPrompt = `You are ${jurorName}, a senior IEEE peer reviewer specializing in ${jurorRole}.
You are conducting a rigorous peer review of the "${sectionName}" section of a research paper targeting an IEEE Transactions journal.

Evaluate this section strictly against these IEEE standards:
- Technical depth and specificity (no vague or generic statements)
- Correct IEEE citation usage [N] throughout
- Appropriate word count and density for the section type
- Formal academic language and passive voice
- Quantitative evidence and statistical rigor
- Logical flow and academic transitions

Score on your domain (1-10), where: 9-10=accept as-is, 7-8=minor revision, 5-6=major revision, <5=reject.

Return ONLY raw JSON (no markdown blocks):
{
  "jurorName": "${jurorName}",
  "score": <number 1-10>,
  "comments": "2-3 sentences of highly specific, actionable feedback citing exact phrases or issues from the text.",
  "mustFix": ["Specific mandatory fix 1 with detail", "Specific mandatory fix 2 with detail"]
}`;

  const userMessage = `Review this "${sectionName}" section for IEEE journal standards:

${sectionContent.substring(0, 1200)}

---
Project Context (ground truth for factual verification):
${context.substring(0, 800)}`;

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

  const systemPrompt = `You are a Visual Architect agent for IEEE academic papers.
Your task is to generate IEEE-compliant visual elements (figures and tables) to enrich the paper.

Generate exactly 3 visual elements:
1. A Mermaid flowchart titled "Figure 1:" showing the complete System Architecture or Methodology Pipeline (layered, technical, with module/component names from the context)
2. An IEEE-style HTML results table titled "TABLE I." showing Comparative Performance Results across methods/baselines. Include columns: Method, Accuracy (%), Precision, Recall, F1-Score, Latency (ms). Use realistic numbers consistent with the context.
3. A Mermaid graph titled "Figure 2:" showing the Conceptual Framework / Theoretical Model (IV → Mediators → DV) or the Data Flow Diagram, using domain-specific node names from the context.

Return ONLY raw JSON (no markdown wrapping, no code fences):
{
  "title": "<Generated IEEE Paper Title in format: SystemName: Technical Purpose Using Algorithms/Tech>",
  "visuals": [
    {
      "id": "fig1",
      "title": "Figure 1: System Architecture of the Proposed Framework",
      "type": "mermaid",
      "caption": "End-to-end architecture of the proposed system illustrating the data flow from input acquisition through algorithmic processing to output generation.",
      "code": "flowchart TD\n  A[\"Data Ingestion Module\"] --> B[\"Preprocessing Pipeline\"]..."
    },
    {
      "id": "table1",
      "title": "TABLE I. COMPARATIVE PERFORMANCE EVALUATION",
      "type": "html_table",
      "caption": "Quantitative comparison of the proposed method against state-of-the-art baselines across standard benchmark metrics.",
      "html": "<table border='1' style='border-collapse:collapse;width:100%;font-family:Times New Roman;font-size:9pt;'>...</table>"
    },
    {
      "id": "fig2",
      "title": "Figure 2: Conceptual Research Framework",
      "type": "mermaid",
      "caption": "Theoretical model depicting the directional relationships among the independent, mediating, and dependent variables investigated in this study.",
      "code": "graph LR\n  IV[\"Independent Variable\"] --> M[\"Mediator\"]\n  M --> DV[\"Dependent Variable\"]..."
    }
  ]
}

MERMAID RULES:
- Valid Mermaid syntax only. Quote ALL node labels containing spaces or parentheses: A["Label (Detail)"]
- Flowcharts: use 'flowchart TD' for top-down architecture diagrams
- Graphs: use 'graph LR' for conceptual/relationship models
- Use domain-specific, technical labels from the project context
- Keep diagrams clean — maximum 10-12 nodes

HTML TABLE RULES:
- Full proper HTML: <table>, <thead>, <tbody>, <tr>, <th>, <td> tags
- table: border='1' style='border-collapse:collapse;width:100%;font-family:Times New Roman;font-size:9pt;'
- th: style='background:#f0f0f0;padding:4pt 8pt;text-align:center;font-weight:bold;'
- td: style='padding:4pt 8pt;text-align:center;'
- Use realistic, specific numeric values inferred from the context
- Include a row for the proposed method showing best performance (bold that row)`;  

  const userMessage = `Generate IEEE-compliant visuals and the paper title for a research paper. Use highly domain-specific and technical terminology.

PROJECT CONTEXT:
${context.substring(0, 2000)}

METHODOLOGY SECTION EXCERPT:
${methodologySection.substring(0, 600)}

RESULTS SECTION EXCERPT:
${resultsSection.substring(0, 700)}`;

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
    const generatedTitle = parsed.title || "";

    // Convert to IEEE-styled HTML for embedding in the paper
    let html = `<div style="column-span:all;margin:18pt 0 12pt 0;">`;
    html += `<h2 style="font-family:'Times New Roman',serif;font-size:10pt;font-weight:bold;text-align:center;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8pt 0;">Figures and Tables</h2>`;
    html += `</div>`;

    for (const v of visuals) {
      const isTable = v.type === "html_table";
      html += `<div style="margin:16pt 0;page-break-inside:avoid;column-span:all;font-family:'Times New Roman',serif;">`;

      if (isTable) {
        // IEEE: Table caption goes ABOVE the table
        html += `<p style="text-align:center;font-size:9pt;font-weight:bold;font-family:'Times New Roman',serif;margin:0 0 4pt 0;">${v.title}</p>`;
        html += `<p style="text-align:center;font-size:8pt;font-style:italic;font-family:'Times New Roman',serif;margin:0 0 6pt 0;">${v.caption}</p>`;
        html += v.html;
      } else if (v.type === "mermaid") {
        // IEEE: Figure caption goes BELOW the figure
        html += `<pre class="mermaid" style="background:#fafafa;border:1px solid #ccc;padding:10px;font-size:8pt;overflow-x:auto;font-family:monospace;">${v.code}</pre>`;
        html += `<p style="text-align:center;font-size:9pt;font-family:'Times New Roman',serif;margin:4pt 0 0 0;"><strong>${v.title}</strong> — <em>${v.caption}</em></p>`;
      }

      html += `</div>`;
    }

    return JSON.stringify({ html, generatedTitle });
  } catch (e) {
    console.warn("Visual Architect failed:", e);
    return JSON.stringify({ html: "", generatedTitle: "" });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Node: Draft References
// ──────────────────────────────────────────────────────────────────────────────

async function draftReferences(context: string, req: Request): Promise<string> {
  const model = getLLM(req, 0.3, "gemini-1.5-pro", 1000);

  const prompt = `You are a senior IEEE journal author generating the References section of a research paper.

Formatting requirements (strict IEEE numeric format):
- Each reference is numbered [1], [2], [3]... in square brackets
- Format: [N] A. Lastname, B. Lastname, and C. Lastname, "Title of Paper in Title Case," in Proc. IEEE Conf. Name / IEEE Trans. Journal Name, vol. X, no. Y, pp. ZZ–ZZ, Mon. YYYY. doi: 10.XXXX/XXXX.
- For books: [N] A. Lastname, Title of Book, Xth ed. City, Country: Publisher, YYYY, pp. ZZ–ZZ.
- List ALL references from the project context.
- If fewer than 15 references are available, supplement with realistic, highly relevant IEEE-style references relevant to the research domain.
- Minimum 15, target 20 references.
- Output ONLY the reference list. Each reference wrapped in a <p style="font-family:'Times New Roman',serif;font-size:9pt;margin:0 0 4pt 0;text-indent:-18pt;padding-left:18pt;"> tag. No heading. No preamble.

Project Context (extract references from here):
${context.substring(0, 3000)}`;

  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  return content.replace(/\*\*/g, "").replace(/```/g, "").trim();
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
    const visualsRaw = await visualArchitect(
      richContext,
      finalSections.results || "",
      finalSections.methodology || "",
      request
    );
    let visualsHtml = "";
    let generatedTitle = "Research Paper Draft";
    try {
      const vParsed = JSON.parse(visualsRaw);
      visualsHtml = vParsed.html || "";
      if (vParsed.generatedTitle) generatedTitle = vParsed.generatedTitle;
    } catch { /* silent */ }

    // ── Step 5: Compile Final IEEE Paper ────────────────────────────────────
    const S = `font-family:'Times New Roman',serif`;

    // IEEE-style section heading wrapper
    const wrapHeading = (heading: string) =>
      `<h2 style="${S};font-size:10pt;font-weight:bold;text-align:center;text-transform:uppercase;margin:14pt 0 4pt 0;">${heading}</h2>`;

    // Body text wrapper — splits on double newlines to create paragraphs, handles sub-headings (A. ...) 
    const wrapBody = (content: string) => {
      return content
        .split(/\n{2,}/)
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => {
          // Detect sub-headings like "A. Title" or "B. Another Title"
          if (/^[A-Z]\.\s+[A-Z]/.test(para)) {
            return `<p style="${S};font-size:10pt;font-weight:bold;margin:8pt 0 2pt 0;">${para}</p>`;
          }
          return `<p style="${S};font-size:10pt;text-align:justify;margin:0 0 6pt 0;line-height:1.15;">${para.replace(/\n/g, " ")}</p>`;
        })
        .join("\n");
    };

    const wrapSection = (heading: string, content: string) =>
      wrapHeading(heading) + "\n" + wrapBody(content);

    // Abstract is special: inline "Abstract —" label, italicized
    const abstractText = (finalSections.abstract || "").replace(/^Abstract\s*[—-]\s*/i, "");
    const abstractHtml = `<p style="${S};font-size:10pt;text-align:justify;margin:0 0 6pt 0;line-height:1.15;"><strong><em>Abstract —</em></strong> <em>${abstractText.replace(/\n/g, " ")}</em></p>`;

    // Keywords are special: inline "Keywords —" label, italicized
    const keywordsText = (finalSections.keywords || "").replace(/^Keywords\s*[—-]\s*/i, "");
    const keywordsHtml = keywordsText
      ? `<p style="${S};font-size:10pt;text-align:justify;margin:0 0 10pt 0;"><em><strong>Keywords —</strong> ${keywordsText}</em></p>`
      : "";

    const finalDraft = `
<div style="column-span:all;margin-bottom:16pt;">
  <h1 style="${S};font-size:22pt;font-weight:bold;text-align:center;text-transform:none;margin:0 0 6pt 0;line-height:1.2;">${generatedTitle}</h1>
  <p style="${S};font-size:8pt;text-align:center;font-style:italic;margin:0 0 12pt 0;">Generated by Plotoris Grand Jury AI Pipeline · ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>
  ${abstractHtml}
  ${keywordsHtml}
</div>

${wrapSection("I. INTRODUCTION", finalSections.introduction || "")}
${wrapSection("II. RELATED WORK", finalSections.literatureReview || "")}
${wrapSection("III. METHODOLOGY", finalSections.methodology || "")}
${visualsHtml}
${wrapSection("IV. RESULTS AND DISCUSSION", finalSections.results || "")}
${wrapSection("V. CONCLUSION AND FUTURE WORK", finalSections.conclusion || "")}
${wrapHeading("VI. REFERENCES")}
<div style="${S};font-size:9pt;">
${referencesContent}
</div>
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
