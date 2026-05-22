"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Plus, X, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaperFetcher({ 
  projectId, 
  onPaperAdded 
}: { 
  projectId: string,
  onPaperAdded: (paper: any) => void
}) {
  const [topic, setTopic] = useState("");
  const [limit, setLimit] = useState(5);
  const [isFetching, setIsFetching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Auto-fill topic from Phase 1 data
  useEffect(() => {
    async function loadPhase1Data() {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/phase1/load?project_id=${projectId}`);
        const data = await res.json();
        if (data.found && data.data && data.data.question) {
          const q = data.data.question;
          const questionStr = q.version || q.question || (typeof q === "string" ? q : "");
          if (questionStr) {
            setTopic(questionStr);
          }
        }
      } catch (err) {
        console.error("Failed to load Phase 1 data", err);
      }
    }
    loadPhase1Data();
  }, [projectId]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsFetching(true);
    try {
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }

      const res = await fetch("/api/phase2/fetch-papers", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: topic, limit, project_id: projectId }),
      });
      const data = await res.json();
      setResults(data.papers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddToBucket = async (paper: any) => {
    setAddingIds(prev => new Set(prev).add(paper.id));
    
    try {
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase2/save-paper", {
        method: "POST",
        headers,
        body: JSON.stringify({ paper, project_id: projectId }),
      });
      
      if (res.ok) {
        setAddedIds(prev => new Set(prev).add(paper.id));
        onPaperAdded(paper);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paper.id);
        return newSet;
      });
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl shadow-xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Search size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Auto-Fetch Papers</h2>
            <p className="text-sm text-[#888]">Find relevant papers via Semantic Scholar to add to your Bucket.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleFetch} className="flex gap-4 mb-8">
        <input 
          type="text" 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Research Topic or Query..."
          className="flex-1 bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <select 
          value={limit} 
          onChange={(e) => setLimit(Number(e.target.value))}
          className="bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500"
        >
          <option value={5}>5 Papers</option>
          <option value={10}>10 Papers</option>
          <option value={20}>20 Papers</option>
        </select>
        <Button 
          type="submit" 
          disabled={!topic.trim() || isFetching}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6"
        >
          {isFetching ? <Loader2 size={16} className="animate-spin mr-2" /> : <Search size={16} className="mr-2" />}
          Fetch
        </Button>
      </form>

      {isFetching && (
        <div className="flex flex-col items-center py-12 text-[#888]">
          <Loader2 size={32} className="animate-spin mb-4 text-emerald-500" />
          <p>Scouring semantic scholar graph...</p>
        </div>
      )}

      {results && !isFetching && (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {results.length === 0 ? (
            <p className="text-[#888] text-center py-8">No papers found for this query.</p>
          ) : (
            results.map((res: any, i) => (
              <div key={i} className="bg-[#111] border border-[#222] p-4 rounded-xl flex gap-4 transition-colors">
                <div className="mt-1">
                  <FileText size={24} className="text-emerald-400/50" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-medium line-clamp-1">{res.title}</h4>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded whitespace-nowrap">
                      {res.year || "N/A"}
                    </span>
                  </div>
                  <p className="text-xs text-[#666] mb-2">{res.authors}</p>
                  <p className="text-sm text-[#888] line-clamp-2 mb-3">{res.abstract}</p>
                  <div className="flex justify-between items-center">
                    <a href={res.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">
                      View Source
                    </a>
                    <Button 
                      size="sm"
                      onClick={() => handleAddToBucket(res)}
                      disabled={addingIds.has(res.id) || addedIds.has(res.id)}
                      className={addedIds.has(res.id) ? "bg-green-600/20 text-green-400 hover:bg-green-600/20" : "bg-[#222] hover:bg-[#333] text-white"}
                    >
                      {addedIds.has(res.id) ? (
                        <><CheckCircle2 size={14} className="mr-2" /> In Bucket</>
                      ) : addingIds.has(res.id) ? (
                        <><Loader2 size={14} className="animate-spin mr-2" /> Embedding...</>
                      ) : (
                        <><Plus size={14} className="mr-2" /> Add to Bucket</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
