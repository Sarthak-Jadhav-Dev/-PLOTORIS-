import { NextResponse } from "next/server";
import { getLLM } from "@/lib/ai-provider";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, limit, project_id } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required." }, { status: 400 });
    }

    const maxResults = limit || 5;

    // 1. Generate search keywords using LLM
    let searchKeywords = query;
    let model = null;
    
    try {
      model = getLLM(req, 0.1, "gemini-2.0-flash");
      const kwPrompt = `Extract 2 to 4 highly specific academic search keywords from this research query. Return ONLY the keywords separated by spaces. Query: "${query}"`;
      const kwResponse = await model.invoke(kwPrompt);
      const generatedKw = kwResponse.content.toString().trim();
      if (generatedKw.length > 0 && generatedKw.length < 100) {
        searchKeywords = generatedKw;
      }
    } catch (e) {
      console.log("Could not generate keywords via LLM, falling back to raw query.", e);
    }

    // Fetch double the maxResults from OpenAlex to filter them down
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(searchKeywords)}&per-page=${maxResults * 3}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAlex API Error:", errorText);
      return NextResponse.json({ error: "Failed to fetch papers." }, { status: response.status });
    }

    const data = await response.json();
    
    // Filter out papers without abstracts
    let validPapers = (data.results || []).filter((paper: any) => paper.abstract_inverted_index);

    let mappedPapers = validPapers.map((p: any) => {
        let abstract = "";
        if (p.abstract_inverted_index) {
          const wordIndex: string[] = [];
          for (const [word, positions] of Object.entries(p.abstract_inverted_index)) {
            for (const pos of positions as number[]) {
              wordIndex[pos] = word;
            }
          }
          abstract = wordIndex.join(" ").trim();
        }

        return {
          id: p.id.replace("https://openalex.org/", ""),
          title: p.title,
          abstract: abstract,
          authors: p.authorships?.map((a: any) => a.author.display_name).join(", "),
          year: p.publication_year,
          url: p.doi || p.id
        };
    });

    // 2. Use LLM to filter for relevance
    if (model && mappedPapers.length > 0) {
      try {
        const filterPrompt = `
          You are an expert research assistant. The user's core research query is: "${query}"
          
          I will provide a JSON array of papers. Return a JSON array containing ONLY the IDs of papers that are highly relevant to the query and answer the question effectively.
          DO NOT include any explanation, just the raw JSON array of string IDs.
          
          Papers:
          ${JSON.stringify(mappedPapers.map((p: any) => ({ id: p.id, title: p.title, abstract: p.abstract.substring(0, 400) + "..." })), null, 2)}
        `;
        
        const filterResponse = await model.invoke(filterPrompt);
        let contentStr = filterResponse.content.toString().trim();
        contentStr = contentStr.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        
        const startIndex = contentStr.indexOf('[');
        const endIndex = contentStr.lastIndexOf(']');
        if (startIndex !== -1 && endIndex !== -1) {
            contentStr = contentStr.substring(startIndex, endIndex + 1);
            const relevantIds = JSON.parse(contentStr);
            if (Array.isArray(relevantIds)) {
                // Prioritize relevant ones
                const highlyRelevant = mappedPapers.filter((p: any) => relevantIds.includes(p.id));
                if (highlyRelevant.length > 0) {
                    mappedPapers = highlyRelevant;
                }
            }
        }
      } catch (e) {
          console.log("Could not filter via LLM, returning raw results.", e);
      }
    }
    
    mappedPapers = mappedPapers.slice(0, maxResults);

    return NextResponse.json({ papers: mappedPapers });
  } catch (error: any) {
    console.error("Fetch papers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
