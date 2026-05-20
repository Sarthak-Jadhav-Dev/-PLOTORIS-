import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await new Promise(r => setTimeout(r, 3000));

    return NextResponse.json({
      issues: [
        {
          severity: "critical",
          title: "Sample size inconsistency",
          description: "Abstract states n=385 but Results section mentions n=357 without explaining attrition.",
          location: "Abstract → Results",
          fix: "Add an attrition statement in Results: 'A total of 357 participants (92.7%) completed all phases.'"
        },
        {
          severity: "warning",
          title: "Unsupported causal claim",
          description: "Discussion states 'social media causes lower GPA' — quasi-experimental design only supports directional association, not strict causation.",
          location: "Discussion, paragraph 2",
          fix: "Replace 'causes' with 'is associated with' or 'provides preliminary causal evidence for'."
        },
        {
          severity: "warning",
          title: "Missing citation",
          description: "The claim about 6.5 hours of daily social media usage (Introduction) lacks a citation.",
          location: "Introduction, paragraph 1",
          fix: "Add: (DataReportal, 2024) after the usage statistic."
        },
        {
          severity: "minor",
          title: "Terminology inconsistency",
          description: "'Social media restriction' and 'social media limitation' are used interchangeably. Use one consistent term throughout.",
          location: "Methodology & Discussion",
          fix: "Standardise to 'social media restriction' across all sections."
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
