import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, limit } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const maxResults = limit || 5;
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || req.headers.get("x-semantic-scholar-key");

    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=title,authors,abstract,url,year`;
    
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Semantic Scholar API Error:", errorText);
      return NextResponse.json({ error: "Failed to fetch papers from Semantic Scholar." }, { status: response.status });
    }

    const data = await response.json();
    
    // Filter out papers without abstracts for better quality RAG
    const validPapers = (data.data || []).filter((paper: any) => paper.abstract);

    return NextResponse.json({
      papers: validPapers.map((p: any) => ({
        id: p.paperId,
        title: p.title,
        abstract: p.abstract,
        authors: p.authors?.map((a: any) => a.name).join(", "),
        year: p.year,
        url: p.url
      }))
    });
  } catch (error: any) {
    console.error("Fetch papers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
