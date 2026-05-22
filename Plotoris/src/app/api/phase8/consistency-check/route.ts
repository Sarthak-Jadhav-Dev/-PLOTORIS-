import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { embedAndStore } from "@/lib/rag";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 90;

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, draft } = body;

    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Get the draft to check — from body or fetch latest from DB
    let draftToCheck = draft || "";

    if (!draftToCheck) {
      // Fetch the most recent final_paper or draft sections from DB
      const { data: paperDoc } = await supabase
        .from("Documents")
        .select("content")
        .eq("metadata->>project_id", project_id)
        .eq("metadata->>type", "final_paper")
        .limit(1)
        .maybeSingle();

      if (paperDoc) {
        draftToCheck = paperDoc.content;
      } else {
        // Fallback: collect all draft sections
        const { data: sections } = await supabase
          .from("Documents")
          .select("content, metadata")
          .eq("metadata->>project_id", project_id)
          .like("metadata->>type", "draft_section_%")
          .limit(10);

        if (sections && sections.length > 0) {
          draftToCheck = sections.map((s) => s.content).join("\n\n");
        }
      }
    }

    if (!draftToCheck || draftToCheck.trim().length < 100) {
      return NextResponse.json({
        issues: [{
          severity: "info",
          title: "No draft to check",
          description: "Please generate the paper draft first using Phase 9 before running a consistency check.",
          location: "N/A",
          fix: "Go to Phase 9 and generate the full draft first."
        }]
      });
    }

    const model = getLLM(req, 0.15, "gemini-2.0-flash");

    const systemPrompt = `You are a meticulous academic editor and peer reviewer.
Analyze the provided research paper draft for internal consistency, logical coherence, and academic rigor.
Look for:
1. Numerical inconsistencies (e.g., sample sizes that differ between sections)
2. Unsupported causal claims (quasi-experimental designs cannot prove causation)
3. Missing citations for factual claims
4. Terminology inconsistencies (using different words for the same concept)
5. Logical gaps between methodology and results
6. Missing limitations acknowledgment
7. Abstract-body mismatches

Return ONLY raw JSON (no markdown) with this structure:
{
  "issues": [
    {
      "severity": "critical" | "warning" | "minor",
      "title": "Short issue title",
      "description": "Specific description referencing the exact problem found in the text.",
      "location": "Section name where the issue was found",
      "fix": "Specific, actionable fix instruction"
    }
  ],
  "overall_score": number (0-100, higher = fewer issues),
  "summary": "1-2 sentence overall quality assessment"
}

Find between 3 and 8 real issues. If the draft is high quality, find only minor improvements.`;

    const userMessage = `Analyze this research paper draft for consistency issues:\n\n${draftToCheck.substring(0, 8000)}`;

    const aiResponse = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userMessage),
    ]);

    let raw = typeof aiResponse.content === "string" ? aiResponse.content : "";
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI returned invalid JSON");

    const result = JSON.parse(jsonMatch[0]);

    // Embed and store the consistency report
    const reportText = `Consistency Check: ${result.overall_score}/100. Issues: ${result.issues?.map((i: any) => i.title).join(", ")}. ${result.summary}`;
    await embedAndStore(
      reportText,
      {
        project_id,
        phase: 8,
        type: "consistency_report",
        score: result.overall_score,
      },
      req
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("consistency-check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run consistency check" },
      { status: 500 }
    );
  }
}
