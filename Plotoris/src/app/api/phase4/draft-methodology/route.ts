import { NextResponse } from "next/server";
import { getLLM, getEmbeddings } from "@/lib/ai-provider";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    // Fetch rich context from ALL phases (1, 2, 3, 4)
    const { data: docs, error: fetchError } = await supabase
      .from("Documents")
      .select("content, metadata")
      .eq("metadata->>project_id", project_id)
      .in("metadata->>type", [
        // Phase 1
        "project_context",
        "research_topic",
        "problem_statement",
        // Phase 2
        "literature_review",
        "paper_summary",
        "research_paper",
        // Phase 3
        "hypothesis",
        "saved_variable",
        "variable_map",
        // Phase 4
        "design_selection",
        "design_recommendation",
        "ethics_checklist",
        "timeline",
        "methodology_draft",
      ]);

    if (fetchError) {
      throw new Error(`Failed to fetch project context: ${fetchError.message}`);
    }

    // Build a labelled context string for the prompt, grouped by phase/type
    const grouped: Record<string, string[]> = {};
    docs?.forEach(d => {
      const type = (d.metadata as any)?.type ?? "context";
      const phase = (d.metadata as any)?.phase ?? "general";
      const key = `Phase ${phase} – ${type.replace(/_/g, " ").toUpperCase()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d.content);
    });

    const contextStr = Object.entries(grouped)
      .map(([key, vals]) => `### ${key}\n${vals.join("\n---\n")}`)
      .join("\n\n") || "No prior project context found.";

    const model = getLLM(req, 0.3, "gemini-2.0-flash");

    const prompt = `You are a senior academic researcher. Using ALL the project context gathered across all phases below, write a comprehensive, journal-quality **3. Research Methodology** section in academic prose. 

Structure the section EXACTLY as follows with these numbered sub-sections:

## 3. Research Methodology

### 3.1 Research Design
Describe and justify the chosen research design (e.g., quantitative, qualitative, or mixed-methods). Explain why this particular design is most appropriate for investigating the stated hypothesis.

### 3.2 Theoretical Framework
Briefly outline the theoretical or conceptual framework underpinning this study, linking it to the independent and dependent variables identified in Phase 3.

### 3.3 Population and Sampling Strategy
Describe the target population, the sampling technique (e.g., purposive, stratified, random), expected sample size, and inclusion/exclusion criteria.

### 3.4 Instruments and Data Collection Procedures
Detail the specific data collection instruments (surveys, interviews, tests, system logs, etc.) and the step-by-step procedure for collecting data. Mention validity and reliability considerations.

### 3.5 Variables and Measurements
Identify each Independent Variable (IV) and Dependent Variable (DV). Explain how each will be operationalized and measured (scales, rubrics, metrics).

### 3.6 Intervention / System Design (if applicable)
If the study involves an intervention (e.g., a software system, curriculum module, or treatment), describe its design, development process, and implementation plan.

### 3.7 Data Analysis Plan
Specify the statistical or qualitative analysis techniques that will be applied (e.g., t-test, ANOVA, regression, thematic analysis). Justify why each technique is appropriate for the research questions.

### 3.8 Ethical Considerations
Describe measures to ensure informed consent, data privacy, voluntary participation, and any relevant IRB/ethics committee approvals.

### 3.9 Validity and Reliability
Address internal validity, external validity (generalizability), construct validity, and reliability of the proposed methodology.

### 3.10 Limitations
Acknowledge the methodological limitations of the study and how they will be mitigated.

---

Project context from all phases:
${contextStr}

Write the full detailed methodology section now using ALL available context above to fill in specifics. DO NOT use placeholder text — derive real content from the context. Use proper academic language. Output only the methodology text in markdown format.`;

    const aiResponse = await model.invoke(prompt);
    const methodology = aiResponse.content.toString().trim();

    // Embed and store (replace previous draft)
    const embeddings = getEmbeddings(req);
    const vector = await embeddings.embedQuery(methodology.slice(0, 2000));

    // Delete old methodology draft before inserting new one
    await supabase
      .from("Documents")
      .delete()
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "methodology_draft");

    await supabase.from("Documents").insert({
      content: methodology,
      embedding: vector,
      metadata: {
        project_id,
        phase: 4,
        type: "methodology_draft",
        created_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ methodology });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET: fetch previously saved methodology draft
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const project_id = searchParams.get("project_id");
    if (!project_id) return NextResponse.json({ error: "project_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("Documents")
      .select("content")
      .eq("metadata->>project_id", project_id)
      .eq("metadata->>type", "methodology_draft")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return NextResponse.json({ methodology: data?.content || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

