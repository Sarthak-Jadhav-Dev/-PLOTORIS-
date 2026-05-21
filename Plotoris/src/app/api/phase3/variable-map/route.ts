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
You are an expert academic researcher designing a variable conceptual map based on the following hypothesis:
"${JSON.stringify(hypothesis)}"

Your task is to identify the Independent Variable (IV), Dependent Variable (DV), and any relevant Control, Moderator, or Mediator variables implied or suitable for this research.
Generate a set of nodes and edges compatible with React Flow to visualize these variables and their relationships.

Provide a JSON object with this exact structure:
{
  "nodes": [
    {
      "id": "1",
      "type": "input", // use "input" for IV, "output" for DV, omit type for others
      "data": { "label": "IV: Variable Name" },
      "position": { "x": 100, "y": 200 }, // approximate a good layout
      "style": { "background": "#1a1a1a", "color": "#60a5fa", "border": "1px solid #3b82f6", "borderRadius": "8px", "padding": "10px" } // Use different colors (e.g. blue for IV, green for DV, yellow for Moderator, gray for Control)
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "1",
      "target": "2",
      "animated": true,
      "label": "Relationship",
      "style": { "stroke": "#ef4444" }
    }
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

    // Embed variable map result for later retrieval
    const embeddings = getEmbeddings(req);
    
    // Convert hypothesis to string if it's an object
    const hypothesisStr = typeof hypothesis === 'string' ? hypothesis : JSON.stringify(hypothesis);
    const vector = await embeddings.embedQuery(`Variable map for hypothesis: ${hypothesisStr}`);

    await supabase.from("Documents").insert({
      content: JSON.stringify(parsed),
      embedding: vector,
      metadata: {
        project_id,
        phase: 3,
        type: "variable_map",
      },
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
