import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { hypothesis, project_id } = await req.json();
    if (!hypothesis) {
      return NextResponse.json({ error: "Hypothesis is required" }, { status: 400 });
    }
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    

    const model = getLLM(req, 0.1, "gemini-2.0-flash");

    const prompt = `
You are a peer reviewer evaluating the scientific rigor and testability of the following hypothesis:
"${hypothesis}"

Evaluate the hypothesis across 6 dimensions: Clarity, Specificity, Falsifiability, Measurability, Novelty, and Feasibility.
Provide a JSON object with this exact structure:
{
  "overall_score": 85, // integer 0-100
  "dimensions": [
    { "subject": "Clarity", "score": 90, "fullMark": 100 },
    { "subject": "Specificity", "score": 80, "fullMark": 100 },
    { "subject": "Falsifiability", "score": 85, "fullMark": 100 },
    { "subject": "Measurability", "score": 75, "fullMark": 100 },
    { "subject": "Novelty", "score": 80, "fullMark": 100 },
    { "subject": "Feasibility", "score": 90, "fullMark": 100 }
  ],
  "strengths": [
    "Strength point 1",
    "Strength point 2"
  ],
  "weaknesses": [
    { "dimension": "Measurability", "suggestion": "Suggestion on how to improve this dimension" }
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

    // Embed score result for later retrieval
    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(`Testability score for hypothesis: ${hypothesis}. Score: ${parsed.overall_score}`);

    await supabase.from("Documents").insert({
      content: JSON.stringify(parsed),
      embedding: vector,
      metadata: {
        project_id,
        phase: 3,
        type: "testability_score",
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
