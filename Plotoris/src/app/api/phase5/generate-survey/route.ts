import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await new Promise(r => setTimeout(r, 1800));

    // In production: use LangChain ChatOpenAI to generate structured survey
    // const model = new ChatOpenAI({ temperature: 0.7 });
    // const response = await model.invoke([...])

    return NextResponse.json({
      title: "AI-Generated Research Survey: Social Media & Academic Performance",
      questions: [
        { id: "q1", type: "short_text", text: "What is your current year of study?", required: true },
        { id: "q2", type: "numeric", text: "On average, how many hours per day do you spend on social media?", required: true },
        { id: "q3", type: "multiple_choice", text: "Which social media platform do you use most frequently?", required: true, options: ["Instagram", "TikTok", "X (Twitter)", "Facebook", "YouTube", "Other"] },
        { id: "q4", type: "likert", text: "Social media negatively impacts my ability to concentrate during study sessions.", required: true },
        { id: "q5", type: "likert", text: "I feel anxious or stressed when I cannot access social media.", required: true },
        { id: "q6", type: "numeric", text: "What was your GPA in the most recent academic term? (0.0 – 4.0)", required: true },
        { id: "q7", type: "long_text", text: "Describe how social media usage affects your daily academic routine.", required: false },
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
