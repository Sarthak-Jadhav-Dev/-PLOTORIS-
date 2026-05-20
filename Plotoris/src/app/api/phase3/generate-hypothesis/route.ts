import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { iv, dv, relationship } = body;

    if (!iv || !dv) {
      return NextResponse.json({ error: "IV and DV are required" }, { status: 400 });
    }

    // Check for OpenAI API key to use real LangChain generation
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "your_openai_api_key_here") {
      // Real LangChain logic would go here
      // const model = new ChatOpenAI({ temperature: 0 });
      // const response = await model.invoke(...)
    } else {
       console.warn("No valid OPENAI_API_KEY. Returning mock generated hypothesis.");
    }

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 1500));

    let h1 = "";
    if (relationship.toLowerCase() === "positive") {
      h1 = `An increase in ${iv} is significantly associated with higher levels of ${dv} in the target population.`;
    } else if (relationship.toLowerCase() === "negative") {
      h1 = `Higher levels of ${iv} are significantly associated with decreased ${dv}.`;
    } else {
      h1 = `There is a statistically significant relationship between ${iv} and ${dv}.`;
    }

    const h0 = `There is no statistically significant relationship between ${iv} and ${dv}.`;

    return NextResponse.json({ h1, h0 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
