import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { research_question } = body;

    if (!research_question) {
      return NextResponse.json({ error: "Research question is required" }, { status: 400 });
    }

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simple heuristic to mock different scores based on length
    const score = research_question.length > 50 ? 85 : 55;
    const grade = score > 80 ? "B+" : "C-";
    const verdict = score > 80 ? "acceptable" : "needs_work";

    const mockResponse = {
      overall_score: score,
      grade: grade,
      dimension_scores: {
        clarity: score > 80 ? 8 : 4,
        specificity: score > 80 ? 7 : 5,
        testability: score > 80 ? 9 : 6,
        novelty: 8
      },
      issues: score > 80 ? [
        {
          id: crypto.randomUUID(),
          severity: "low",
          dimension: "specificity",
          issue: "The timeline for the study is not explicitly stated.",
          suggestion: "Consider adding a bounding timeframe, e.g., 'over a 6-month period'."
        }
      ] : [
        {
          id: crypto.randomUUID(),
          severity: "high",
          dimension: "clarity",
          issue: "The terms used are too broad and open to multiple interpretations.",
          suggestion: "Define exactly what you mean by the core concepts."
        },
        {
          id: crypto.randomUUID(),
          severity: "medium",
          dimension: "testability",
          issue: "It is unclear what metrics will be used to measure the outcome.",
          suggestion: "Specify the exact dependent variables you will measure."
        }
      ],
      improved_versions: [
        {
          version: `${research_question} by measuring quantitative changes over 6 months in a controlled cohort.`,
          changes_made: "Added explicit measurement criteria and a timeframe.",
          addresses: ["uuid1"]
        },
        {
          version: `To what extent does ${research_question.toLowerCase()} when compared against traditional baseline models?`,
          changes_made: "Rephrased as a comparative question for better testability.",
          addresses: ["uuid1", "uuid2"]
        }
      ],
      clarifying_questions: score < 80 ? [
        "What specific demographic or subset are you focusing on?",
        "How do you plan to collect data for this?"
      ] : [],
      verdict: verdict,
      next_steps: score > 80 ? "Your question is strong. You can proceed to scoping." : "Please review the issues and try an improved version."
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json({ error: "Failed to validate question" }, { status: 500 });
  }
}
