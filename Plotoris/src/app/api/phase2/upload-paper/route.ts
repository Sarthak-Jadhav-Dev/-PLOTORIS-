export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getEmbeddings } from "@/lib/ai-provider";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { supabase } from "@/lib/supabase";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { StateGraph, START, END } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// Define the state for the LangGraph workflow
interface AgentState {
  fileBuffer: Buffer;
  fileName: string;
  projectId: string;
  paperId: string;
  textContent: string;
  chunks: string[];
  recordsToInsert: any[];
  processedCount: number;
  error?: string;
}

const graphState = {
  fileBuffer: {
    value: (x: Buffer, y: Buffer) => y,
    default: () => Buffer.from(""),
  },
  fileName: {
    value: (x: string, y: string) => y,
    default: () => "",
  },
  projectId: {
    value: (x: string, y: string) => y,
    default: () => "",
  },
  paperId: {
    value: (x: string, y: string) => y,
    default: () => "",
  },
  textContent: {
    value: (x: string, y: string) => y,
    default: () => "",
  },
  chunks: {
    value: (x: string[], y: string[]) => y,
    default: () => [],
  },
  recordsToInsert: {
    value: (x: any[], y: any[]) => y,
    default: () => [],
  },
  processedCount: {
    value: (x: number, y: number) => y,
    default: () => 0,
  },
  error: {
    value: (x: string | undefined, y: string | undefined) => y,
    default: () => undefined,
  },
};

// Node: Parse PDF
async function parsePdfNode(state: AgentState): Promise<Partial<AgentState>> {
  try {
    const blob = new Blob([state.fileBuffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob, { splitPages: false });
    const docs = await loader.load();
    
    // Extract and sanitize text (PostgreSQL rejects \u0000 null characters)
    let textContent = docs.map(d => d.pageContent).join("\n\n");
    textContent = textContent.replace(/\0/g, '');
    
    if (!textContent || textContent.trim().length === 0) {
      return { error: "Could not extract text from PDF." };
    }
    return { textContent };
  } catch (err: any) {
    return { error: `PDF Parse Error: ${err.message}` };
  }
}

// Node: Chunk Text
async function chunkTextNode(state: AgentState): Promise<Partial<AgentState>> {
  if (state.error) return {};
  try {
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunkDocs = await textSplitter.createDocuments([state.textContent]);
    return { chunks: chunkDocs.map(c => c.pageContent) };
  } catch (err: any) {
    return { error: `Chunking Error: ${err.message}` };
  }
}

// Node: Embed and Prepare Records
async function embedNode(state: AgentState): Promise<Partial<AgentState>> {
  if (state.error) return {};
  try {
    const embeddings = getEmbeddings(globalReq);

    const records = [];
    const batchSize = 10;
    
    // We process synchronously for simplicity, but wait inside a loop for API limits if needed
    for (let i = 0; i < state.chunks.length; i += batchSize) {
      const batch = state.chunks.slice(i, i + batchSize);
      const batchPromises = batch.map(async (chunk, idx) => {
        const vector = await embeddings.embedQuery(chunk);
        return {
          content: chunk,
          embedding: vector,
          metadata: {
            project_id: state.projectId,
            phase: 2,
            role: "user",
            type: "paper_chunk",
            paper_id: state.paperId,
            title: state.fileName,
            source: "upload",
            chunk_index: i + idx
          }
        };
      });
      const resolvedBatch = await Promise.all(batchPromises);
      records.push(...resolvedBatch);
    }
    
    return { recordsToInsert: records };
  } catch (err: any) {
    return { error: `Embedding Error: ${err.message}` };
  }
}

// Node: Store in Supabase
async function storeNode(state: AgentState): Promise<Partial<AgentState>> {
  if (state.error) return {};
  try {
    let processedCount = 0;
    const batchSize = 50; // Insert in batches to avoid Supabase limits
    
    for (let i = 0; i < state.recordsToInsert.length; i += batchSize) {
      const batch = state.recordsToInsert.slice(i, i + batchSize);
      const { error } = await supabase.from("Documents").insert(batch);
      if (error) {
        return { error: `Supabase Insert Error: ${error.message}` };
      }
      processedCount += batch.length;
    }
    
    return { processedCount };
  } catch (err: any) {
    return { error: `Storage Error: ${err.message}` };
  }
}

// Build LangGraph
const workflow = new StateGraph<AgentState>({ channels: graphState as any })
  .addNode("parse", parsePdfNode)
  .addNode("chunk", chunkTextNode)
  .addNode("embed", embedNode)
  .addNode("store", storeNode)
  .addEdge(START, "parse")
  .addEdge("parse", "chunk")
  .addEdge("chunk", "embed")
  .addEdge("embed", "store")
  .addEdge("store", END);

const app = workflow.compile();

let globalReq: Request;
export async function POST(req: Request) {
  globalReq = req;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const project_id = formData.get("project_id") as string;
    
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!project_id) return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const paper_id = crypto.randomUUID();

    // Run LangGraph Workflow
    const initialState = {
      fileBuffer: buffer,
      fileName: file.name,
      projectId: project_id,
      paperId: paper_id,
      textContent: "",
      chunks: [],
      recordsToInsert: [],
      processedCount: 0,
    };

    const finalState = (await app.invoke(initialState)) as unknown as AgentState;

    if (finalState.error) {
      throw new Error(finalState.error);
    }

    return NextResponse.json({ 
      success: true, 
      chunksProcessed: finalState.processedCount,
      paper: {
        id: paper_id,
        title: file.name,
        abstract: finalState.textContent.substring(0, 500) + "...", // Fake abstract
        authors: "Uploaded PDF",
        year: new Date().getFullYear(),
        source: "upload"
      }
    });
  } catch (error: any) {
    console.error("Upload API Error (LangGraph):", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
  }
}
