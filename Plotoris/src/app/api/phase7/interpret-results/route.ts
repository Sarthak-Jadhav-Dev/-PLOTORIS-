import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { embedAndStore, fetchProjectContext } from "@/lib/rag";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testName, iv, dv, pValue, effectSize, ci, sampleSize, tone, project_id } = body;

    if (!iv || !dv || !pValue) {
      return NextResponse.json({ error: "iv, dv, and pValue are required" }, { status: 400 });
    }

    // Retrieve project context for richer interpretation
    let projectContext = "";
    if (project_id) {
      try {
        projectContext = await fetchProjectContext(project_id);
      } catch (e) {
        console.warn("Context fetch failed, proceeding without it:", e);
      }
    }

    const model = getLLM(req, 0.35, "gemini-2.0-flash");

    const isAcademic = tone !== "beginner";

    const systemPrompt = `You are an expert academic statistician and research analyst writing for a scholarly publication.
Given statistical results from an experiment, produce a rigorous, nuanced interpretation.
Return ONLY a raw JSON object with this exact structure (no markdown):
{
  "is_significant": boolean,
  "paragraph": "Full academic interpretation paragraph (150-200 words for academic, 80-100 for beginner). Include all given stats inline.",
  "practical_significance": "1-2 sentence commentary on practical/real-world importance of the effect size.",
  "suggested_conclusion": "1-2 sentence guidance on what conclusion to draw and what future research should do.",
  "limitations": "1 sentence on a key limitation to acknowledge."
}
${isAcademic ? "Use formal academic language. Reference effect size conventions (Cohen, 1988), p-value interpretation, and confidence intervals." : "Use plain language accessible to non-statisticians."}`;

    const userMessage = `
Statistical Test: ${testName || "Linear Regression"}
Independent Variable (IV): ${iv}
Dependent Variable (DV): ${dv}
p-value: ${pValue}
Effect Size (β / d): ${effectSize}
95% Confidence Interval: ${ci || "Not provided"}
Sample Size: ${sampleSize || "Not provided"}
Tone: ${tone || "academic"}

${projectContext ? `Project Context:\n${projectContext.substring(0, 1500)}` : ""}
`;

    const aiResponse = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    let raw = typeof aiResponse.content === "string" ? aiResponse.content : "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned invalid JSON");

    const result = JSON.parse(jsonMatch[0]);

    // Embed and store the interpretation
    if (project_id) {
      const textToEmbed = `Interpreted Result: IV=${iv}, DV=${dv}, p=${pValue}, β=${effectSize}. ${result.paragraph}`;
      await embedAndStore(
        textToEmbed,
        {
          project_id,
          phase: 7,
          type: "interpreted_result",
          iv,
          dv,
          p_value: pValue,
          effect_size: effectSize,
          is_significant: result.is_significant,
        },
        req
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("interpret-results error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to interpret results" },
      { status: 500 }
    );
  }
}
