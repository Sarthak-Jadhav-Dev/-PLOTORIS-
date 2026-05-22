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
      .eq("metadata->>type", "variable_linkage")
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

    // 1. Fetch active dataset columns
    const { data: dsData, error: dsError } = await supabase
      .from("Documents")
      .select("metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "raw_dataset")
      .limit(1)
      .maybeSingle();

    if (dsError) throw dsError;
    if (!dsData) {
      return NextResponse.json({ error: "No dataset uploaded for this project." }, { status: 400 });
    }
    const columns = dsData.metadata.columns || [];

    // 2. Fetch formal variables from Phase 3 (Documents table, type: saved_variable)
    const { data: variablesData, error: varError } = await supabase
      .from("Documents")
      .select("metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "saved_variable");

    if (varError) throw varError;
    
    // If no variables exist yet, we can't link
    if (!variablesData || variablesData.length === 0) {
      return NextResponse.json({ error: "No formal variables found. Please define variables in Phase 3 first." }, { status: 400 });
    }

    const variableSet = new Set<string>();
    const formalVariables: any[] = [];

    variablesData.forEach(d => {
      const meta = d.metadata;
      if (meta.iv && !variableSet.has(meta.iv)) {
        variableSet.add(meta.iv);
        formalVariables.push({ name: meta.iv, description: meta.validation || "Independent Variable" });
      }
      if (meta.dv && !variableSet.has(meta.dv)) {
        variableSet.add(meta.dv);
        formalVariables.push({ name: meta.dv, description: meta.validation || "Dependent Variable" });
      }
    });

    const systemPrompt = `You are an AI Variable Linker for Plotoris, a research SaaS platform.
You will be provided with a list of RAW COLUMNS extracted from a dataset, and a list of FORMAL VARIABLES defined by the researcher.

Your task is to semantically map the raw columns to the formal variables where applicable.
Not all columns will map to a variable (e.g., ID columns, timestamps might be unmapped).
Not all variables will have a corresponding column (they might be missing from the dataset).

Output ONLY raw JSON with the following exact structure, no markdown blocks:
{
  "mappings": [
    {
      "column": "exact string of the raw column name",
      "variable": "exact string of the matched formal variable name",
      "confidence": number (0-100, how confident are you in this semantic match)
    }
  ],
  "unmapped": ["array of strings of raw columns that did not map to any variable"],
  "coverage": number (0-100, percentage of formal variables that found a match)
}

Be strict with confidence scores. Only map a column if it logically represents the formal variable.`;

    const payload = JSON.stringify({
      raw_dataset_columns: columns,
      formal_research_variables: formalVariables
    });

    const model = getLLM(req, 0.1); // Extremely low temperature for accurate mapping
    
    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Map these variables: ${payload}`)
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
      .eq("metadata->>type", "variable_linkage");

    await supabase.from("Documents").insert({
      content: JSON.stringify(result),
      embedding: new Array(768).fill(0),
      metadata: { project_id, type: "variable_linkage" }
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Variable Linker AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
