import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Retrieve prior context (hypothesis, design, variables)
    const { data: docs, error: fetchError } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", ["hypothesis", "design_selection", "variable_map"]);

    if (fetchError) {
      throw new Error(`Failed to fetch project context: ${fetchError.message}`);
    }
    const contextStr = docs?.map(d => d.content).join("\n") || "No prior context available.";

    const model = getLLM(req, 0.1, "gemini-2.0-flash");

    const prompt = `You are an expert research planner. Based on the following project context (hypothesis, variables, and recommended design), produce a concise 12-month Gantt-style timeline outlining major milestones.
Return a JSON object with this exact structure:
{
  "milestones": [
    {
      "phase": "Phase name or milestone",
      "description": "Brief description of the activity",
      "startMonth": 0,
      "duration": 2
    }
  ]
}
startMonth is 0-indexed (0 = January). duration is in months. Only return raw JSON.
Context:\n${contextStr}`;

    const aiResponse = await model.invoke(prompt);
    let parsed;
    try {
      const contentStr = aiResponse.content.toString().trim();
      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(contentStr);
    } catch (e) {
      console.error("Parse error from Gemini:", aiResponse.content);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Return the generated timeline but do NOT save it automatically
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: fetch the previously saved timeline
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "timeline")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ timeline: null });

    return NextResponse.json({ timeline: JSON.parse(data.content) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: save the user's edited timeline
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { project_id, tasks } = body;
    if (!project_id || !tasks) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(`Project timeline tasks: ${JSON.stringify(tasks)}`);

    // Delete existing timeline
    await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "timeline");

    const { error } = await supabase.from("Documents").insert({
      content: JSON.stringify({ milestones: tasks }),
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "timeline",
        created_at: new Date().toISOString()
      }
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Save timeline error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
