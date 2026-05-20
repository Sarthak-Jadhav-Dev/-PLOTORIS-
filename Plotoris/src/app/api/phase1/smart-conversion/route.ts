import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { goal, problem, question } = body;

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResponse = {
      smart_analysis: {
        specific: { score: 7, issue: "The outcome is vaguely stated." },
        measurable: { score: 4, issue: "No explicit metrics are defined." },
        achievable: { score: 8, issue: null },
        relevant: { score: 9, issue: null },
        timebound: { score: 2, issue: "Missing a clear deadline." }
      },
      smart_objective: `To increase [Key Metric] by 15% among [Target Population] within the next 6 months through the implementation of [Methodology/Intervention].`,
      success_criteria: [
        "A statistically significant (p < 0.05) increase in [Key Metric] compared to the control group.",
        "Successful recruitment of at least 100 participants matching criteria.",
        "Completion of data analysis by Month 5."
      ],
      breakdown: {
        specific: "Clearly defined the target population and intervention.",
        measurable: "Added the 15% target and statistical significance threshold.",
        achievable: "15% is a realistic target based on similar prior studies.",
        relevant: "Directly addresses the formulated research problem.",
        timebound: "Explicitly set a 6-month deadline with a Month 5 analysis milestone."
      },
      milestones: [
        { milestone: "Complete Literature Review & IRB Approval", timeline: "Month 1" },
        { milestone: "Participant Recruitment & Data Collection", timeline: "Month 2-3" },
        { milestone: "Data Analysis", timeline: "Month 4-5" },
        { milestone: "Drafting & Submission", timeline: "Month 6" }
      ]
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json({ error: "Failed to convert to SMART objective" }, { status: 500 });
  }
}
