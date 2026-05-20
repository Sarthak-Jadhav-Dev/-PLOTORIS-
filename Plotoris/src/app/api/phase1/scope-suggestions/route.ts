import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problem, question, domain } = body;

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const mockResponse = {
      inclusions: [
        { item: "Quantitative metrics of system performance", category: "methodology" },
        { item: "English-language datasets published after 2020", category: "data" },
        { item: "Primary user cohort within the target demographic", category: "population" },
        { item: "Analysis of baseline models for comparison", category: "methodology" }
      ],
      exclusions: [
        { item: "Qualitative sentiment analysis", reason: "Out of scope for this purely quantitative evaluation." },
        { item: "Legacy systems built before 2018", reason: "Architecture too fundamentally different to compare." },
        { item: "Real-time deployment latency", reason: "Focus is on accuracy, not production latency." }
      ],
      population: {
        target: "Undergraduate students in STEM fields",
        characteristics: ["Aged 18-24", "Currently enrolled", "Prior programming experience"],
        size_range: "N = 100-150",
        geographic: "North America"
      },
      constraints: {
        time_range: "6 months",
        budget: "$5,000 for participant compensation and cloud computing",
        resources: ["Access to university GPU cluster", "Survey distribution software"],
        ethical: ["IRB approval required for student data", "Anonymization of results"]
      },
      scope_warning: "Ensure your participant recruitment strategy is robust enough to hit the 100-150 target within the first 2 months to stay on schedule."
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate scope suggestions" }, { status: 500 });
  }
}
