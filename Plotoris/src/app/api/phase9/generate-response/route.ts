import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { comment } = await req.json();
    
    // Simulate API delay for AI generation
    await new Promise(r => setTimeout(r, 2000));

    return NextResponse.json({
      response: `We thank the reviewer for this insightful observation regarding the strength of our causal claims. We agree that while the quasi-experimental design improves upon cross-sectional data by establishing temporal precedence, it does not completely eliminate unobserved confounding variables, and therefore strict causal language should be avoided.

Action taken:
We have thoroughly revised the Discussion and Conclusion sections to soften the language. For example, the phrase "causes lower GPA" on page 14 has been changed to "is strongly associated with lower GPA," and we have added a dedicated paragraph in the Limitations section explicitly discussing the constraints of causal inference within our quasi-experimental framework.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
