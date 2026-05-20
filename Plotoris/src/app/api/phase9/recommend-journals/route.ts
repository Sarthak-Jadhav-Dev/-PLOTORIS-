import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { abstract, keywords, oaPreference, speed } = await req.json();
    
    // Simulate API delay (e.g. calling OpenAlex / Crossref and running RAG match)
    await new Promise(r => setTimeout(r, 2500));

    return NextResponse.json({
      journals: [
        {
          name: "Journal of Educational Technology",
          publisher: "Elsevier",
          matchScore: 94,
          impactFactor: "4.2",
          quartile: "Q1",
          acceptanceRate: "18%",
          reviewTime: "8 weeks",
          rationale: "Perfect semantic match for 'digital wellness' and 'academic performance'. High affinity for quasi-experimental designs.",
          tags: ["High Impact", "Hybrid OA", "Education"]
        },
        {
          name: "Computers in Human Behavior",
          publisher: "Elsevier",
          matchScore: 88,
          impactFactor: "9.0",
          quartile: "Q1",
          acceptanceRate: "12%",
          reviewTime: "10 weeks",
          rationale: "Strong alignment with human-computer interaction and psychological impacts of social media. Very competitive.",
          tags: ["Top Tier", "Hybrid OA", "Psychology"]
        },
        {
          name: "Cyberpsychology, Behavior, and Social Networking",
          publisher: "Mary Ann Liebert, Inc.",
          matchScore: 82,
          impactFactor: "6.1",
          quartile: "Q1",
          acceptanceRate: "25%",
          reviewTime: "6 weeks",
          rationale: "Good fit for the 'social media' focus. Faster review times align with your 'Fast Track' preference.",
          tags: ["Fast Review", "Hybrid OA", "Behavioral"]
        }
      ]
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
