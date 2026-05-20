import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await new Promise(r => setTimeout(r, 2000));

    return NextResponse.json({
      limitations: [
        {
          id: `ai-${Date.now()}-1`,
          title: "Cross-Sectional Design",
          category: "Generalizability",
          severity: "High",
          description: "The cross-sectional nature of this study prevents establishing the temporal precedence required for strong causal inference.",
          impact: "Cannot determine whether social media usage precedes academic decline or vice versa.",
          mitigation: "Longitudinal or experimental designs should be employed in follow-up research.",
        },
        {
          id: `ai-${Date.now()}-2`,
          title: "Instrument Reliability",
          category: "Instrument Reliability",
          severity: "Moderate",
          description: "The adapted Likert-scale instrument lacks published psychometric validation data in the specific undergraduate context.",
          impact: "Measurement unreliability may attenuate the observed effect sizes.",
          mitigation: "Pre-validate instruments using confirmatory factor analysis in a pilot study.",
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
