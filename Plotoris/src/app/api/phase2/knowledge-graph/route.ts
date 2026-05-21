import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }
    // Fetch the recent documents from this project to build the graph
    // We'll limit it to 20 recent chunks to avoid exceeding token limits
    const { data: documents, error: docError } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .limit(20);

    if (docError) {
      throw new Error("Failed to fetch project documents.");
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ 
        nodes: [
          { id: '1', position: { x: 250, y: 250 }, data: { label: 'Project Concept' } }
        ], 
        edges: [] 
      });
    }

    const context = documents.map(d => d.content).join("\n\n---\n\n");

    const llm = getLLM(req, 0.1, "gemini-1.5-flash");

    const prompt = `
    You are an expert researcher. Extract a knowledge graph from the provided research context.
    Identify the key entities (Concepts, Methods, Authors, Metrics) and their relationships.
    Format your response EXACTLY as a valid JSON object with 'nodes' and 'edges' arrays.
    
    Format requirements for Nodes:
    - id: string (unique identifier, e.g. "node1")
    - label: string (the entity name)
    - type: string (one of: 'concept', 'method', 'author', 'metric')
    
    Format requirements for Edges:
    - id: string (unique identifier, e.g. "edge1")
    - source: string (must match a node id)
    - target: string (must match a node id)
    - label: string (the relationship, e.g. "uses", "improves", "authored_by")

    Generate a maximum of 15 nodes and 20 edges.

    Context:
    ${context.substring(0, 30000)}

    JSON OUTPUT:
    `;

    const res = await llm.invoke(prompt);
    let rawJson = res.content.toString();
    
    // Clean up potential markdown formatting
    if (rawJson.startsWith("```json")) {
      rawJson = rawJson.replace(/```json\n/, "").replace(/\n```/g, "");
    }
    rawJson = rawJson.trim();

    const graphData = JSON.parse(rawJson);

    // Map output to React Flow compatible format
    const nodes = (graphData.nodes || []).map((n: any, i: number) => ({
      id: n.id,
      position: { x: Math.random() * 600, y: Math.random() * 400 }, // Random initial layout
      data: { label: n.label, type: n.type },
      type: "customNode"
    }));

    const edges = (graphData.edges || []).map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: true,
      style: { stroke: '#4f46e5', strokeWidth: 2 }
    }));

    return NextResponse.json({ nodes, edges });
  } catch (error: any) {
    console.error("Knowledge Graph Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate knowledge graph" }, { status: 500 });
  }
}
