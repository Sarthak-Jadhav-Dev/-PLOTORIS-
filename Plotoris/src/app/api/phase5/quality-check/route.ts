import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getLLM } from "@/lib/ai-provider";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

export const maxDuration = 60; // Allow enough time for LLM to respond

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "data_quality_result")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ result: null });

    return NextResponse.json({ result: JSON.parse(data.content) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project_id = body.project_id;
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    // 1. Fetch active dataset
    const { data: dsData, error: dsError } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "raw_dataset")
      .limit(1)
      .maybeSingle();

    if (dsError) throw dsError;
    if (!dsData) {
      return NextResponse.json({ error: "No dataset uploaded for this project." }, { status: 400 });
    }

    const datasetRows = JSON.parse(dsData.content);
    const metadata = dsData.metadata;

    // Build dataset summary to avoid sending 10MB of JSON to the LLM
    const sampleRows = datasetRows.slice(0, 10);
    const columnStats: Record<string, { nulls: number; sampleValues: any[] }> = {};
    
    metadata.columns.forEach((col: string) => {
      columnStats[col] = { nulls: 0, sampleValues: [] };
    });

    datasetRows.forEach((row: any) => {
      metadata.columns.forEach((col: string) => {
        if (row[col] === null || row[col] === undefined || row[col] === "") {
          columnStats[col].nulls += 1;
        }
      });
    });

    // Populate a few unique sample values per column
    metadata.columns.forEach((col: string) => {
      const values = Array.from(new Set(sampleRows.map((r: any) => r[col]))).filter(v => v !== null && v !== "");
      columnStats[col].sampleValues = values.slice(0, 3);
    });

    const datasetContext = JSON.stringify({
      filename: metadata.filename,
      rowCount: metadata.rowCount,
      columns: metadata.columns,
      columnStats,
      sampleRows
    });

    const systemPrompt = `You are a Data Quality Analysis AI for Plotoris, a research SaaS platform.
You will be provided with metadata, column statistics (including null counts), and a small sample of a dataset uploaded by a researcher.

Your task is to analyze this data and generate a JSON report.
Output ONLY raw JSON with the following exact structure, no markdown blocks:
{
  "score": number (0-100),
  "verdict": "Ready" | "Needs Attention" | "Critical Issues",
  "summary": "1-2 sentence summary of overall dataset health",
  "dimensions": [
    { "subject": "Completeness", "score": number, "fullMark": 100 },
    { "subject": "Uniqueness", "score": number, "fullMark": 100 },
    { "subject": "Validity", "score": number, "fullMark": 100 },
    { "subject": "Consistency", "score": number, "fullMark": 100 },
    { "subject": "Accuracy", "score": number, "fullMark": 100 },
    { "subject": "Timeliness", "score": number, "fullMark": 100 }
  ],
  "issues": [
    {
      "title": "Short title describing the issue (e.g. Missing Values in 'Age')",
      "severity": "error" | "warning" | "info",
      "description": "Clear explanation referencing exact column names and row counts.",
      "fix": "Actionable advice on how to handle it."
    }
  ]
}

- Be realistic. If a column has nulls, create an issue for it.
- If the dataset looks mostly clean, still provide a high score and maybe minor warnings.
- Base your analysis STRICTLY on the provided column names and stats.`;

    const model = getLLM(req, 0.2); // Low temperature for deterministic output
    
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Analyze this dataset: ${datasetContext}`)
    ];

    const aiResponse = await model.invoke(messages);
    let jsonOutput = typeof aiResponse.content === "string" ? aiResponse.content : "";
    
    // Clean markdown if present
    jsonOutput = jsonOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonOutput);

    // Save to DB
    await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "data_quality_result");

    await supabase.from("Documents").insert({
      content: JSON.stringify(result),
      embedding: new Array(768).fill(0),
      metadata: { project_id, type: "data_quality_result" }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Data Quality AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
