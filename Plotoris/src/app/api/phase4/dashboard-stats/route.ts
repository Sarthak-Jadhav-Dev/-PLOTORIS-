import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    // Fetch all relevant documents for this project
    const { data: docs, error } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", [
        "saved_variable",
        "hypothesis",
        "design_selection",
        "timeline",
        "methodology_draft",
        "ethics_checklist",
      ]);

    if (error) throw error;

    // 1. Hypothesis — grab the first hypothesis text (truncate nicely)
    const hypothesisDoc = docs?.find(d => (d.metadata as any)?.type === "hypothesis");
    let hypothesis = "--";
    if (hypothesisDoc) {
      try {
        const parsed = JSON.parse(hypothesisDoc.content);
        // Handle all known formats the hypothesis builder might produce
        const rawText =
          parsed.formal_statement ||
          parsed.statement ||
          parsed.h1 ||           // common format: { h1: "..." }
          parsed.h0 ||
          parsed.hypothesis ||
          (typeof parsed === "string" ? parsed : null) ||
          Object.values(parsed).find(v => typeof v === "string" && (v as string).length > 10) ||
          hypothesisDoc.content;
        const text = String(rawText).trim();
        hypothesis = text.length > 32 ? text.slice(0, 30) + "…" : text;
      } catch {
        const text = hypothesisDoc.content.trim();
        hypothesis = text.length > 32 ? text.slice(0, 30) + "…" : text;
      }
    }

    // 2. Variable Count — count distinct saved_variable records
    const variableCount = docs?.filter(d => (d.metadata as any)?.type === "saved_variable").length ?? 0;

    // 3. Timeline Duration — calculate from timeline milestones
    let timelineDuration = "--";
    const timelineDoc = docs?.find(d => (d.metadata as any)?.type === "timeline");
    if (timelineDoc) {
      try {
        const parsed = JSON.parse(timelineDoc.content);
        const milestones = parsed.milestones || [];
        if (milestones.length > 0) {
          const lastMilestone = milestones.reduce((max: any, m: any) => {
            const end = (m.startMonth || 0) + (m.duration || 1);
            return end > ((max.startMonth || 0) + (max.duration || 1)) ? m : max;
          }, milestones[0]);
          const totalMonths = (lastMilestone.startMonth || 0) + (lastMilestone.duration || 1);
          timelineDuration = totalMonths >= 12
            ? `${Math.round(totalMonths / 12)} Yr${Math.round(totalMonths / 12) > 1 ? "s" : ""}`
            : `${totalMonths} Mo`;
        }
      } catch { /* ignore parse errors */ }
    }

    // 4. Methodology Readiness — score based on how many sections are complete
    const completedSections = [
      docs?.some(d => (d.metadata as any)?.type === "saved_variable"),    // Variables defined
      docs?.some(d => (d.metadata as any)?.type === "hypothesis"),          // Hypothesis set
      docs?.some(d => (d.metadata as any)?.type === "design_selection"),    // Design chosen
      docs?.some(d => (d.metadata as any)?.type === "timeline"),            // Timeline built
      docs?.some(d => (d.metadata as any)?.type === "ethics_checklist"),    // Ethics done
      docs?.some(d => (d.metadata as any)?.type === "methodology_draft"),   // Draft generated
    ].filter(Boolean).length;

    const methodologyReadiness = Math.round((completedSections / 6) * 100);

    return NextResponse.json({
      hypothesis,
      variableCount,
      timelineDuration,
      methodologyReadiness,
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
