import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();
    const geminiKey = req.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY;

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    if (!geminiKey) {
      return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });
    }

    // Retrieve prior context (hypothesis, design, variables)
    const { data: docs, error: fetchError } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", ["hypothesis", "design_recommendation", "variable_map"]);

    if (fetchError) {
      throw new Error(`Failed to fetch project context: ${fetchError.message}`);
    }
    const contextStr = docs?.map(d => d.content).join("\n") || "No prior context available.";

    const model = new ChatGoogleGenerativeAI({
      apiKey: geminiKey,
      model: "gemini-2.0-flash",
      temperature: 0.1,
    });

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

    // Store embedding for future RAG
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: geminiKey,
      model: "text-embedding-004",
    });
    const vector = await embeddings.embedQuery(`Timeline milestones: ${JSON.stringify(parsed)}`);

    await supabase.from("Documents").insert({
      content: JSON.stringify(parsed),
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "timeline",
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
