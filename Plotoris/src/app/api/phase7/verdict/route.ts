import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pValue, effectSize, significant, direction } = await req.json();
    await new Promise(r => setTimeout(r, 2000));

    const isSignificant = significant === "yes";
    const isBorderline = significant === "borderline";
    const effectNum = Math.abs(parseFloat(effectSize || "0"));

    let verdict = "Inconclusive";
    let confidence = 50;

    if (isSignificant && effectNum >= 0.3) {
      verdict = "Accepted";
      confidence = Math.min(98, 70 + effectNum * 30);
    } else if (isSignificant && effectNum < 0.3) {
      verdict = "Partially Supported";
      confidence = 65;
    } else if (isBorderline) {
      verdict = "Partially Supported";
      confidence = 55;
    } else {
      verdict = "Rejected";
      confidence = 85;
    }

    return NextResponse.json({
      verdict,
      confidence: Math.round(confidence),
      rationale: verdict === "Accepted"
        ? `The statistical evidence strongly supports the alternative hypothesis. The observed effect is both statistically significant (p = ${pValue}) and practically meaningful (β = ${effectSize}), satisfying both criteria for hypothesis acceptance.`
        : verdict === "Rejected"
        ? `The data do not provide sufficient statistical evidence to reject the null hypothesis (p = ${pValue}). The null hypothesis is retained, suggesting no significant relationship exists in the target population under the current study conditions.`
        : `The findings provide partial support for the alternative hypothesis. While statistical significance was ${isSignificant ? "achieved" : "not fully achieved"}, the effect size (β = ${effectSize}) ${effectNum >= 0.3 ? "is adequate" : "is too small"} to draw strong directional conclusions.`,
      confidence_factors: [
        { label: "Statistical Significance", score: isSignificant ? 92 : isBorderline ? 55 : 20 },
        { label: "Effect Size Adequacy", score: effectNum >= 0.5 ? 95 : effectNum >= 0.3 ? 75 : 45 },
        { label: "Sample Adequacy", score: 80 },
      ],
      implications: verdict === "Accepted" ? [
        `The positive relationship between the variables supports the theoretical model proposed in the hypothesis.`,
        `Interventions targeting the independent variable may produce measurable improvements in the dependent variable.`,
        `These findings can inform evidence-based policy and practice in the relevant domain.`,
      ] : [
        `The absence of a significant effect may reflect true null effects, insufficient power, or measurement limitations.`,
        `Future research with larger samples or alternative measurement approaches is warranted.`,
        `Theoretical frameworks supporting this relationship should be critically re-examined.`,
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
