import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { hypothesis } = await req.json();

    if (!hypothesis) {
      return NextResponse.json({ error: "Hypothesis is required" }, { status: 400 });
    }

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 2000));

    // Dynamic mock response based on length/keywords
    const baseScore = hypothesis.length > 50 ? 80 : 60;

    return NextResponse.json({
      overall_score: baseScore,
      dimensions: [
        { subject: "Clarity", score: baseScore + 5, fullMark: 100 },
        { subject: "Specificity", score: baseScore - 10, fullMark: 100 },
        { subject: "Falsifiability", score: baseScore + 10, fullMark: 100 },
        { subject: "Measurability", score: baseScore - 5, fullMark: 100 },
        { subject: "Novelty", score: 70, fullMark: 100 },
        { subject: "Feasibility", score: 85, fullMark: 100 },
      ],
      strengths: [
        "The directional relationship is clearly stated.",
        "The variables are easily identifiable."
      ],
      weaknesses: [
        {
          dimension: "Specificity",
          suggestion: "Define the specific population context or timeframe to improve testability."
        },
        {
          dimension: "Measurability",
          suggestion: "It is unclear how the dependent variable will be operationalized and measured."
        }
      ]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
