import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";
import { createClient } from "@supabase/supabase-js";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_KEY || ""
);

const BASE_SYSTEM_PROMPT = `You are an expert research analyst AI for Plotoris, a research SaaS platform.
Your role in Phase 7 (Interpretation of Results) is to help researchers articulate, verify, and document their research findings and claims in a rigorous, publication-ready manner.

When a researcher presents a finding or claim:
1. Engage conversationally and deeply - ask clarifying follow-up questions about methodology, sample size, statistical significance
2. Cross-reference their claim against prior phase context (hypotheses, previously registered claims)
3. Provide nuanced, academically rigorous feedback
4. Reference relevant statistical concepts when appropriate (p-values, effect sizes, confidence intervals)

CLAIM EXTRACTION RULE:
When you clearly detect a research claim or finding being made by the user, you MUST append this block verbatim at the very end of your response:

<CLAIM_EXTRACT>
{"claim_text":"the claim","ai_verdict":"Supported|Partially Supported|Unsupported|Inconclusive","confidence_score":75,"evidence_summary":"Explanation of your reasoning in 2-3 sentences."}
</CLAIM_EXTRACT>

Only append this block for genuine claims. Skip it for greetings, questions, file uploads, or non-claim messages.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, projectId } = body;

    if (!messages || !projectId) {
      return NextResponse.json({ error: "Missing messages or projectId" }, { status: 400 });
    }

    const { data: hypotheses } = await supabase
      .from("Insights")
      .select("title, status, score")
      .eq("project_id", projectId)
      .eq("type", "hypothesis")
      .limit(10);

    const { data: existingClaims } = await supabase
      .from("research_claims")
      .select("claim_text, ai_verdict, confidence_score")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(5);

    const contextBlock = [
      "## Prior Hypotheses (Phase 3 context):",
      hypotheses && hypotheses.length > 0
        ? hypotheses.map((h: Record<string, unknown>) => `- ${h.title} | Status: ${h.status} | Score: ${h.score}`).join("\n")
        : "No hypotheses loaded yet.",
      "",
      "## Recently Registered Claims:",
      existingClaims && existingClaims.length > 0
        ? existingClaims.map((c: Record<string, unknown>) => `- "${c.claim_text}" ? Verdict: ${c.ai_verdict} (${c.confidence_score}% confidence)`).join("\n")
        : "No claims registered yet for this project.",
    ].join("\n");

    const fullSystemPrompt = BASE_SYSTEM_PROMPT + "\n\n" + contextBlock;

    const langchainMessages = [
      new SystemMessage(fullSystemPrompt),
      ...messages.slice(0, -1).map((m: { role: string; content: string }) =>
        m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
      new HumanMessage(messages[messages.length - 1].content),
    ];

    const model = getLLM(request, 0.65, "gemini-1.5-flash");

    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const geminiStream = await model.stream(langchainMessages);

          for await (const chunk of geminiStream) {
            const text = typeof chunk.content === "string" ? chunk.content : "";
            fullResponse += text;
            const visibleText = text.replace(/<CLAIM_EXTRACT>[\s\S]*?<\/CLAIM_EXTRACT>/g, "");
            if (visibleText) {
              // useChat expects the AI SDK Data Stream Protocol format
              const formattedChunk = `0:${JSON.stringify(visibleText)}\n`;
              controller.enqueue(encoder.encode(formattedChunk));
            }
          }

          const claimMatch = fullResponse.match(/<CLAIM_EXTRACT>([\s\S]*?)<\/CLAIM_EXTRACT>/);
          if (claimMatch) {
            try {
              const claimData = JSON.parse(claimMatch[1].trim());
              await supabase.from("Documents").insert({
                content: JSON.stringify(claimData),
                embedding: new Array(768).fill(0),
                metadata: { project_id: projectId, type: "verified_claim" }
              });
            } catch (e) {
              console.error("Claim parse error:", e);
            }
          }

          controller.close();
        } catch (err) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Phase7 chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
