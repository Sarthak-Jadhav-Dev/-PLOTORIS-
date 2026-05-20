"use client";

import { useState } from "react";
import { Search, Loader2, FileText, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    // Simulate hitting the LangChain / Supabase vector search endpoint
    try {
      const res = await fetch("/api/phase2/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error(err);
      // Fallback mock data if API key fails
      setResults([
        { title: "Attention Is All You Need", content: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...", similarity: 0.92 },
        { title: "BERT: Pre-training of Deep Bidirectional Transformers", content: "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers...", similarity: 0.85 },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl shadow-xl w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Search size={20} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Semantic Paper Search</h2>
          <p className="text-sm text-[#888]">Search by concept or meaning, not just exact keywords.</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative mb-8">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'Studies about AI adoption in healthcare with qualitative methodology'"
          className="w-full bg-[#0d0d0d] border border-[#333] text-white rounded-xl py-4 pl-12 pr-32 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <Sparkles size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
        <Button 
          type="submit" 
          disabled={!query.trim() || isSearching}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 px-6"
        >
          {isSearching ? <Loader2 size={16} className="animate-spin" /> : "Search"}
        </Button>
      </form>

      {isSearching && (
        <div className="flex flex-col items-center py-12 text-[#888]">
          <Loader2 size={32} className="animate-spin mb-4 text-indigo-500" />
          <p>Performing vector similarity search...</p>
        </div>
      )}

      {results && !isSearching && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-white mb-4">Results ({results.length})</h3>
          {results.length === 0 ? (
            <p className="text-[#888] text-center py-8">No matching papers found in your corpus.</p>
          ) : (
            results.map((res, i) => (
              <div key={i} className="bg-[#111] border border-[#222] hover:border-[#444] p-4 rounded-xl flex gap-4 transition-colors group cursor-pointer">
                <div className="mt-1">
                  <FileText size={20} className="text-[#666] group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-medium">{res.title || "Untitled Paper Segment"}</h4>
                    <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded">
                      {(res.similarity * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-sm text-[#888] line-clamp-2">{res.content}</p>
                </div>
                <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight size={20} className="text-[#666]" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
