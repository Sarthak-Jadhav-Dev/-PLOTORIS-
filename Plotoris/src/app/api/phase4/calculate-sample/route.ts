import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id, population, confidence, margin, dropout } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    

    // Fetch previous hypothesis & design from Phase 3/4
    const { data: docs, error: fetchError } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", ["hypothesis", "design_recommendation"]);

    if (fetchError) {
      throw new Error(`Failed to fetch project context: ${fetchError.message}`);
    }

    const contextStr = docs?.map(d => d.content).join("\n") || "No previous context found.";

    const model = getLLM(req, 0.1, "gemini-2.0-flash");

    const prompt = `
You are an expert statistician. Review the following project context (hypothesis and research design):
${contextStr}

The user has provided the following parameters for sample size calculation:
- Population Size: ${population || 'Unknown (assume infinite/large)'}
- Confidence Level: ${confidence}%
- Margin of Error: ${margin}%
- Expected Dropout Rate: ${dropout}%

Calculate or recommend an appropriate sample size, taking into account statistical power and effect size appropriate for the design. 
Provide a JSON object with this exact structure:
{
  "recommended_size": 150, // The final target enrollment adjusted for dropout
  "power": 80, // Statistical power percentage
  "effect_size": "Medium (Cohen's d = 0.5)", // The assumed effect size
  "rationale": "Brief rationale for this calculation."
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
    const vector = await embeddings.embedQuery(`Sample size calculation: ${parsed.recommended_size}. Power: ${parsed.power}`);

    await supabase.from("Documents").insert({
      content: JSON.stringify(parsed),
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "sample_size",
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
