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

Recommend the most rigorous research design suitable for testing this hypothesis. Provide a JSON object with this exact structure:
{
  "design_type": "Name of the design (e.g. Quasi-Experimental Design)",
  "confidence": 88, // integer 0-100
  "rationale": "Detailed explanation of why this design is best.",
  "advantages": [
    "Advantage 1",
    "Advantage 2"
  ],
  "limitations": [
    "Limitation 1",
    "Limitation 2"
  ]
}
Return only the raw JSON.
`;

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

    // Embed and store
    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(`Research design recommendation: ${parsed.design_type}. Rationale: ${parsed.rationale}`);

    await supabase.from("Documents").insert({
      content: JSON.stringify(parsed),
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "design_recommendation",
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
