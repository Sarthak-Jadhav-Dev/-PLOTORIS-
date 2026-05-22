import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { createClient } from "@supabase/supabase-js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

// Define the State
interface DraftState {
  projectId: string;
  context: string;
  abstract: string;
  introduction: string;
  literatureReview: string;
  methodology: string;
  results: string;
  conclusion: string;
  references: string;
  finalDraft: string;
}

let globalReq: Request;
const getModel = () => {
  return getLLM(globalReq, 0.7, "gemini-1.5-pro");
};

const IEEE_RULES = `
CRITICAL RULES FOR OUTPUT:
1. Maintain a highly professional, humanized academic tone. Do not sound robotic.
2. DO NOT use Markdown asterisks (**bold**) or underscores (_italic_) for formatting. Return plain HTML tags for emphasis if absolutely necessary, but generally avoid inline text formatting.
3. Include inline citations strictly in IEEE format: e.g., [1], [2], [3-5].
4. Strictly follow the section title structure exactly as requested (e.g. "I. INTRODUCTION").
`;

async function fetchContext(state: DraftState): Promise<Partial<DraftState>> {
  const { data: claimsData } = await supabase
    .from("Documents")
    .select("content")
    .eq("metadata->>project_id", state.projectId)
    .eq("metadata->>type", "verified_claim");

  const claims = claimsData?.map(c => JSON.parse(c.content)) || [];

  const { data: insights } = await supabase
    .from("Insights")
    .select("title, description, type")
    .eq("project_id", state.projectId);
    
  const { data: literatureData } = await supabase
    .from("Documents")
    .select("content, metadata")
    .eq("metadata->>project_id", state.projectId)
    .eq("metadata->>type", "fetched_paper");

  let contextBuilder = "=== PROJECT CONTEXT ===\n\n";
  if (insights) {
    contextBuilder += "RESEARCH FOCUS / HYPOTHESES:\n";
    insights.forEach((i: any) => contextBuilder += `- ${i.title}: ${i.description}\n`);
  }
  if (claims) {
    contextBuilder += "\nVERIFIED CLAIMS / RESULTS:\n";
    claims.forEach((c: any) => contextBuilder += `- [${c.ai_verdict}] ${c.claim_text}\n`);
  }
  if (literatureData && literatureData.length > 0) {
    contextBuilder += "\nAVAILABLE LITERATURE / REFERENCES:\n";
    literatureData.forEach((p: any, index: number) => {
      contextBuilder += `[${index + 1}] ${p.content}\n`;
    });
  }

  return { context: contextBuilder };
}

async function draftAbstract(state: DraftState): Promise<Partial<DraftState>> {
  const model = getModel();
  const prompt = `You are an expert academic researcher. Based on the following project context, draft a concise and compelling Abstract for a research paper.\n
Target Word Count: ~200-250 words.
${IEEE_RULES}
Output ONLY the abstract paragraph text, do NOT wrap it in HTML tags like <p>, I will add the heading.

Context:\n${state.context}`;
  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  content = content.replace(/\*\*/g, "").trim();
  return { abstract: `<h2>Abstract</h2>\n<p>${content}</p>` };
}

async function draftIntroduction(state: DraftState): Promise<Partial<DraftState>> {
  const model = getModel();
  const prompt = `You are an expert academic researcher. Draft the Introduction section for a research paper based on the project context. Establish the problem, context, and outline the paper's contribution.\n
Target Word Count: ~500 words.
Heading MUST be: I. INTRODUCTION
${IEEE_RULES}
Output ONLY the paragraph text, do NOT wrap it in HTML tags, I will add the heading.

Context:\n${state.context}`;
  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  content = content.replace(/\*\*/g, "").trim();
  return { introduction: `<h2>I. INTRODUCTION</h2>\n<p>${content}</p>` };
}

async function draftLiteratureReview(state: DraftState): Promise<Partial<DraftState>> {
  const model = getModel();
  const prompt = `You are an expert academic researcher. Draft the Literature Review section summarizing the theoretical background based on the hypotheses/context and available literature provided. Cite heavily using [1], [2] format.\n
Target Word Count: ~600 words.
Heading MUST be: II. LITERATURE REVIEW
${IEEE_RULES}
Output ONLY the paragraph text, do NOT wrap it in HTML tags, I will add the heading.

Context:\n${state.context}`;
  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  content = content.replace(/\*\*/g, "").trim();
  return { literatureReview: `<h2>II. LITERATURE REVIEW</h2>\n<p>${content}</p>` };
}

async function draftMethodology(state: DraftState): Promise<Partial<DraftState>> {
  const model = getModel();
  const prompt = `You are an expert academic researcher. Draft the Methodology section outlining the research design implied by the context.\n
Target Word Count: ~500 words.
Heading MUST be: III. METHODOLOGY
${IEEE_RULES}
Output ONLY the paragraph text, do NOT wrap it in HTML tags, I will add the heading.

Context:\n${state.context}`;
  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  content = content.replace(/\*\*/g, "").trim();
  return { methodology: `<h2>III. METHODOLOGY</h2>\n<p>${content}</p>` };
}

async function draftResults(state: DraftState): Promise<Partial<DraftState>> {
  const model = getModel();
  const prompt = `You are an expert academic researcher. Draft the Results & Discussion section. Heavily rely on the VERIFIED CLAIMS provided in the context.\n
Target Word Count: ~800 words.
Heading MUST be: IV. RESULTS AND DISCUSSIONS
${IEEE_RULES}
Output ONLY the paragraph text, do NOT wrap it in HTML tags, I will add the heading.

Context:\n${state.context}`;
  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  content = content.replace(/\*\*/g, "").trim();
  return { results: `<h2>IV. RESULTS AND DISCUSSIONS</h2>\n<p>${content}</p>` };
}

async function draftConclusion(state: DraftState): Promise<Partial<DraftState>> {
  const model = getModel();
  const prompt = `You are an expert academic researcher. Draft a concise Conclusion section summarizing the findings, limitations, and future work.\n
Target Word Count: ~300 words.
Heading MUST be: V. CONCLUSION
${IEEE_RULES}
Output ONLY the paragraph text, do NOT wrap it in HTML tags, I will add the heading.

Context:\n${state.context}`;
  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  content = content.replace(/\*\*/g, "").trim();
  return { conclusion: `<h2>V. CONCLUSION</h2>\n<p>${content}</p>` };
}

async function draftReferences(state: DraftState): Promise<Partial<DraftState>> {
  const model = getModel();
  const prompt = `You are an expert academic researcher. Generate the References section in strict IEEE format based on the literature in the context. 
If the provided literature is less than 20 items, you MUST supplement it with realistic, highly relevant plausible academic references to ensure a MINIMUM of 20 references.
Strictly format each reference as: [1] Author(s), "Title," Journal/Conference, Year.
Format the output as simple paragraphs or line breaks for each reference (e.g. <p>[1] ...</p>).
Heading MUST be: VI. REFERENCES
${IEEE_RULES}
Do NOT output the heading text itself, I will add it. Just output the list of references wrapped in <p> tags.

Context:\n${state.context}`;
  const response = await model.invoke([new SystemMessage(prompt)]);
  let content = typeof response.content === "string" ? response.content : "";
  content = content.replace(/\*\*/g, "").trim();
  return { references: `<h2>VI. REFERENCES</h2>\n${content}` };
}

function compileDraft(state: DraftState): Partial<DraftState> {
  const finalDraft = `
    <h1 style="text-align: center;">Draft Research Paper</h1>
    ${state.abstract || ""}
    ${state.introduction || ""}
    ${state.literatureReview || ""}
    ${state.methodology || ""}
    ${state.results || ""}
    ${state.conclusion || ""}
    ${state.references || ""}
  `;
  return { finalDraft };
}

export async function POST(request: Request) {
  globalReq = request;
  try {
    const { projectId } = await request.json();
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

    const stateChannels = {
      projectId: null,
      context: null,
      abstract: null,
      introduction: null,
      literatureReview: null,
      methodology: null,
      results: null,
      conclusion: null,
      references: null,
      finalDraft: null,
    };

    const graphBuilder = new StateGraph<DraftState>({ channels: stateChannels as any })
      .addNode("fetchContext", fetchContext)
      .addNode("draftAbstract", draftAbstract)
      .addNode("draftIntroduction", draftIntroduction)
      .addNode("draftLiteratureReview", draftLiteratureReview)
      .addNode("draftMethodology", draftMethodology)
      .addNode("draftResults", draftResults)
      .addNode("draftConclusion", draftConclusion)
      .addNode("draftReferences", draftReferences)
      .addNode("compile", compileDraft)

      .addEdge(START, "fetchContext")
      .addEdge("fetchContext", "draftAbstract")
      .addEdge("draftAbstract", "draftIntroduction")
      .addEdge("draftIntroduction", "draftLiteratureReview")
      .addEdge("draftLiteratureReview", "draftMethodology")
      .addEdge("draftMethodology", "draftResults")
      .addEdge("draftResults", "draftConclusion")
      .addEdge("draftConclusion", "draftReferences")
      .addEdge("draftReferences", "compile")
      .addEdge("compile", END);

    const graph = graphBuilder.compile();

    const initialState: Partial<DraftState> = { projectId };
    
    // Run the graph
    const result = await graph.invoke(initialState, { recursionLimit: 12 });

    return NextResponse.json({ draft: result.finalDraft });
  } catch (err) {
    console.error("Drafting error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

