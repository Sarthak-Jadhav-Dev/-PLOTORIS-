import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { embedAndStore, fetchProjectContext } from "@/lib/rag";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const maxDuration = 120;

const IEEE_RULES = `
CRITICAL FORMATTING RULES:
1. Maintain a highly professional, humanized academic tone. Do NOT sound robotic or AI-generated.
2. Do NOT use Markdown asterisks (**bold**) or underscores (_italic_). Use plain prose.
3. Include inline IEEE citations strictly as [1], [2], [3-5] where appropriate.
4. Output ONLY the section paragraph text — NO heading, NO JSON, NO markdown wrappers.
5. Every claim must be supported or at minimum framed in the context provided.
`;

const SECTION_CONFIGS: Record<string, { heading: string; wordCount: string; instructions: string }> = {
  Abstract: {
    heading: "Abstract",
    wordCount: "200-250",
    instructions: "Summarize the research problem, methodology, key findings, and implications. Must be self-contained.",
  },
  Introduction: {
    heading: "I. INTRODUCTION",
    wordCount: "450-550",
    instructions: "Establish the research problem with real-world significance. Review the gap in knowledge. State the paper's contribution and outline the structure.",
  },
  "Literature Review": {
    heading: "II. LITERATURE REVIEW",
    wordCount: "550-700",
    instructions: "Synthesize prior work thematically. Cite using [1], [2] format. Identify gaps that this study addresses. Group by theme, not chronology.",
  },
  Methodology: {
    heading: "III. METHODOLOGY",
    wordCount: "450-550",
    instructions: "Describe the research design, sampling strategy, data collection instruments, and analysis techniques. Justify each choice with academic rationale.",
  },
  Results: {
    heading: "IV. RESULTS AND DISCUSSION",
    wordCount: "700-900",
    instructions: "Present findings in detail. Reference verified claims and statistical results from the context. Include at least one specific statistic (β, p-value, CI). Discuss implications of each finding. Suggest a table or figure where appropriate by writing [TABLE: description] or [FIGURE: description] inline.",
  },
  Conclusion: {
    heading: "V. CONCLUSION",
    wordCount: "280-350",
    instructions: "Summarize contributions, acknowledge limitations honestly, and suggest specific future research directions. Do not introduce new findings.",
  },
};

export async function POST(req: Request) {
  try {
    const { section, tone, project_id } = await req.json();

    if (!section) {
      return NextResponse.json({ error: "section is required" }, { status: 400 });
    }

    const config = SECTION_CONFIGS[section];
    if (!config) {
      return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 });
    }

    // Fetch the full cross-phase project context
    let projectContext = "No project context available — generating from general academic knowledge.";
    if (project_id) {
      try {
        projectContext = await fetchProjectContext(project_id);
      } catch (e) {
        console.warn("Context fetch failed:", e);
      }
    }

    const model = getLLM(req, 0.55, "gemini-2.0-flash");

    const systemPrompt = `You are an expert academic researcher and scientific writer.
You are drafting the "${section}" section for a research paper in IEEE format.
${IEEE_RULES}
Section-specific instructions: ${config.instructions}
Target word count: ~${config.wordCount} words.`;

    const userMessage = `Using the project context below, draft the "${section}" section of the research paper.
Be specific — reference the actual hypotheses, variables, results, and literature mentioned in the context.
Do NOT be generic. Ground every sentence in the data provided.

PROJECT CONTEXT:
${projectContext}`;

    const aiResponse = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    let content = typeof aiResponse.content === "string" ? aiResponse.content : "";
    content = content.replace(/\*\*/g, "").replace(/```/g, "").trim();

    // Wrap in the section HTML
    const htmlContent = `<h2>${config.heading}</h2>\n<p>${content.replace(/\n\n+/g, "</p><p>").replace(/\n/g, " ")}</p>`;

    // Embed and store this draft section
    if (project_id) {
      const typeKey = `draft_section_${section.toLowerCase().replace(/\s+/g, "_")}`;
      await embedAndStore(
        `${section} Section Draft: ${content.substring(0, 800)}`,
        {
          project_id,
          phase: 8,
          type: typeKey,
          section,
        },
        req
      );
    }

    return NextResponse.json({ content: htmlContent, section, tone });
  } catch (error: any) {
    console.error("generate-section error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate section" },
      { status: 500 }
    );
  }
}
