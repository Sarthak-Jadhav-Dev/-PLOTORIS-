import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

/**
 * POST /api/phase-helper/analyze
 * Body: { projectId: string, files: Array<{ name: string; type: string; size: string; path: string }> }
 * Returns: { analysis: { statisticalPower: string; powerTrend: string; dataVariance: string; varianceNote: string; hypotheses: Array<{ title: string; status: string; score: number }>; insights: string[] } }
 */
export async function POST(request: Request) {
  try {
    const { projectId, files } = await request.json();
    if (!projectId || !Array.isArray(files)) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    // Initialise Supabase client (server side)
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Pull hypotheses from earlier phases (assume stored in a table called "Insights" with type 'hypothesis')
    const { data: hypData, error: hypError } = await supabase
      .from('Insights')
      .select('title, status, score')
      .eq('project_id', projectId)
      .eq('type', 'hypothesis');
    const hypotheses = hypError ? [] : hypData;
    // Aggregate uploaded file contents (only CSV for simplicity)
    let aggregatedText = '';
    for (const f of files) {
      const { data, error } = await supabase.storage.from('research_files').download(f.path);
      if (error) continue;
      const text = Buffer.from(await data.arrayBuffer()).toString('utf-8');
      aggregatedText += `\n--- ${f.name} ---\n${text}`;
    }
    // Build prompt for LLM
    const prompt = `You are an AI analyst for the Plotoris project. Using the provided uploaded data (CSV/PNG descriptions) and the list of hypotheses, produce a concise analysis JSON with the following keys:
- statisticalPower (percentage string)
- powerTrend (short description)
- dataVariance (string)
- varianceNote (short note)
- hypotheses (array of objects: title, status (Supported/Partially Supported/Unsupported), score (0-100))
- insights (array of short bullet strings summarizing key findings)
Provide ONLY valid JSON.

Hypotheses:\n${JSON.stringify(hypotheses)}\n\nUploaded Data:\n${aggregatedText}`;
    const model = new ChatOpenAI({ temperature: 0 });
    const template = PromptTemplate.fromTemplate('{prompt}');
    const chain = template.pipe(model);
    const response = await chain.invoke({ prompt });
    let analysis;
    try {
      analysis = JSON.parse(response.content as string);
    } catch (e) {
      analysis = { error: 'Failed to parse LLM response' };
    }
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
