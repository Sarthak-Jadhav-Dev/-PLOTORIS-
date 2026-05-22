import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Fetch previous hypothesis from Phase 3
    const { data: docs, error: fetchError } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>phase", "3")
      .in("metadata->>type", ["hypothesis", "variable_map"]);

    if (fetchError) {
      throw new Error(`Failed to fetch project context: ${fetchError.message}`);
    }

    const contextStr = docs?.map(d => d.content).join("\n") || "No previous hypothesis found.";
    const model = getLLM(req, 0.1, "gemini-2.0-flash");

    const prompt = `
You are an expert research methodologist. Review the following project context (hypothesis and variables) from previous phases:
${contextStr}

Recommend 3 distinct research designs suitable for testing this hypothesis, ranging from most to least rigorous. Provide a JSON array with this exact structure:
[
  {
    "design_type": "Name of Design (e.g. Randomized Controlled Trial)",
    "confidence": 92,
    "tag": "Most Rigorous",
    "rationale": "Detailed explanation of why this design fits.",
    "pros": ["Pro 1", "Pro 2", "Pro 3"],
    "cons": ["Con 1", "Con 2"]
  },
  {
    "design_type": "Second Design Name",
    "confidence": 78,
    "tag": "Balanced Approach",
    "rationale": "...",
    "pros": ["...", "..."],
    "cons": ["...", "..."]
  },
  {
    "design_type": "Third Design Name",
    "confidence": 65,
    "tag": "Exploratory",
    "rationale": "...",
    "pros": ["...", "..."],
    "cons": ["...", "..."]
  }
]
Return only the raw JSON array with no other text.
`;

    const aiResponse = await model.invoke(prompt);
    let parsed;
    try {
      const contentStr = aiResponse.content.toString().trim();
      const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentStr);
    } catch (e) {
      console.error("Parse error:", aiResponse.content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ options: parsed });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: fetch the previously saved design selection for this project
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "design_selection")
      .order("metadata->>created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ selection: null });

    return NextResponse.json({ selection: JSON.parse(data.content) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: save the user's selected design type
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { project_id, selected } = body;
    if (!project_id || !selected) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(`Selected Research Design: ${selected.design_type}. Rationale: ${selected.rationale}`);

    // Delete any previous selection first so only one stays
    await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "design_selection");

    const { error } = await supabase.from("Documents").insert({
      content: JSON.stringify(selected),
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "design_selection",
        design_type: selected.design_type,
        created_at: new Date().toISOString()
      }
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save design selection error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
