import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    

    // Fetch hypothesis + design context
    const { data: docs, error: fetchError } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", ["hypothesis", "design_recommendation", "variable_map"]);

    if (fetchError) {
      throw new Error(`Failed to fetch project context: ${fetchError.message}`);
    }

    const contextStr = docs?.map(d => d.content).join("\n") || "No previous context found.";

    const model = getLLM(req, 0.1, "gemini-2.0-flash");

    const prompt = `
You are an ethics review board expert. Review the following research project context (hypothesis, variables, and design):
${contextStr}

Generate a tailored ethics and IRB compliance checklist for this specific research project.
Provide a JSON object with this exact structure:
{
  "risk_level": "Minimal" | "Moderate" | "High",
  "consent_requirements": [
    "Specific consent requirement 1 tailored to this study",
    "Specific consent requirement 2"
  ],
  "data_privacy_measures": [
    "Specific data privacy measure 1",
    "Specific data privacy measure 2"
  ],
  "vulnerable_populations_flag": true | false,
  "additional_considerations": [
    "Any other ethical consideration specific to this research"
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
    const vector = await embeddings.embedQuery(`Ethics checklist for project. Risk level: ${parsed.risk_level}`);

    await supabase.from("Documents").insert({
      content: JSON.stringify(parsed),
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "ethics_checklist",
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
