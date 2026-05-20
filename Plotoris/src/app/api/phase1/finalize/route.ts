import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { problem, question, scope, objectives } = body;

    // Simulate Database & KG creation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock KG Node IDs
    const nodes = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];

    const mockResponse = {
      knowledge_graph_nodes: nodes,
      phase1_complete: true,
      next_phase_unlocked: "p2",
      ai_summary: "Successfully formulated the core research problem, validated the driving research question, defined explicit scope boundaries, and established measurable SMART objectives. Knowledge graph nodes have been seeded."
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    return NextResponse.json({ error: "Failed to finalize Phase 1" }, { status: 500 });
  }
}
