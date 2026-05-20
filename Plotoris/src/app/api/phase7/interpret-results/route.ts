import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testName, iv, dv, pValue, effectSize, ci, sampleSize, tone } = body;

    await new Promise(r => setTimeout(r, 2500));

    const isSignificant = parseFloat(pValue) < 0.05;
    const effectNum = parseFloat(effectSize);
    const effectStrength = effectNum >= 0.5 ? "large" : effectNum >= 0.3 ? "moderate" : "small";

    const paragraph = tone === "beginner"
      ? `The study found that ${iv} has a ${isSignificant ? "statistically significant" : "non-significant"} effect on ${dv} (p = ${pValue}). In plain terms, this means that as ${iv} increases, ${dv} tends to ${effectNum < 0 ? "decrease" : "increase"} by a ${effectStrength} amount. This was found using a ${testName} on a sample of ${sampleSize} participants.`
      : `The results of the ${testName} revealed a ${isSignificant ? "statistically significant" : "non-significant"} relationship between ${iv} and ${dv} (β = ${effectSize}, p = ${pValue}, 95% CI [${ci}], n = ${sampleSize}). The ${effectStrength} effect size indicates that variations in ${iv} account for a meaningful proportion of the variance observed in ${dv}, consistent with the theoretical framework proposed in the literature review.`;

    return NextResponse.json({
      is_significant: isSignificant,
      paragraph,
      practical_significance: `The ${effectStrength} effect size (β = ${effectSize}) suggests that the relationship between ${iv} and ${dv} is not merely a statistical artifact but carries practical implications for the research domain. Even small changes in ${iv} may produce observable shifts in ${dv} outcomes in real-world contexts.`,
      suggested_conclusion: `Based on these findings, there is ${isSignificant ? "sufficient" : "insufficient"} statistical evidence to ${isSignificant ? "reject the null hypothesis in favour of" : "support"} the alternative hypothesis. Future research should replicate these findings with larger, randomly-selected samples to confirm the robustness of the ${effectStrength} effect.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
