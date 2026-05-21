"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Target, ExternalLink, BookmarkPlus, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function JournalRecommender({ projectId }: { projectId: string }) {
  const [oaPreference, setOaPreference] = useState("Any");
  const [speed, setSpeed] = useState("Standard");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setIsSearching(true);
    setError(null);
    setResults(null);
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

      const res = await fetch("/api/phase9/recommend-journals", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId, oaPreference, speed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch recommendations");
      setResults(data.journals || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Preferences Panel */}
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Target size={20} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">AI Journal Recommender</h2>
            <p className="text-xs text-[#888]">Powered by OpenAlex live journal data + Gemini AI ranking based on your full project context.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Open Access Preference</label>
            <select value={oaPreference} onChange={e => setOaPreference(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500">
              <option>Any</option>
              <option>OA Only</option>
              <option>Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Review Speed</label>
            <select value={speed} onChange={e => setSpeed(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500">
              <option>Standard</option>
              <option>Fast Track</option>
            </select>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={isSearching} className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 mt-2">
          {isSearching ? <><Loader2 size={16} className="mr-2 animate-spin" />Scanning OpenAlex & Ranking with AI...</> : <><Sparkles size={16} className="mr-2" />Find Journals from Full Project Context</>}
        </Button>
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <Loader2 size={36} className="animate-spin text-teal-500 mb-4" />
          <p className="text-white font-medium animate-pulse">Scanning OpenAlex database for real journals...</p>
          <p className="text-[#888] text-xs mt-2">Matching your hypothesis, design, and keywords from Phases 1–8</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">{error}</div>
      )}

      {/* Empty State */}
      {!results && !isSearching && !error && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
          <Target size={48} className="text-[#333] mb-4" />
          <p className="text-white font-medium mb-2">Ready to Find Your Journals</p>
          <p className="text-[#888] text-sm">Click the button above. Plotoris will read your full project context from Phases 1–8 and search real journal databases.</p>
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {results.map((j, i) => (
              <div key={i} className="bg-[#1a1a1a] border border-[#333] hover:border-teal-500/50 transition-colors rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 bg-teal-500/10 text-teal-400 px-3 py-1 text-xs font-bold rounded-bl-xl border-b border-l border-teal-500/20">
                  {j.matchScore}% Match
                </div>

                <div className="pr-24 mb-3">
                  <h3 className="text-lg font-bold text-white mb-1">{j.name}</h3>
                  <p className="text-xs text-[#888]">{j.publisher} {j.isOpenAccess && <span className="ml-2 text-emerald-400 font-semibold">• Open Access</span>}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Impact Factor", value: j.impactFactor },
                    { label: "Quartile", value: j.quartile },
                    { label: "Acceptance Rate", value: j.acceptanceRate },
                    { label: "Time to Decision", value: j.reviewTime },
                  ].map((m) => (
                    <div key={m.label} className="bg-[#0d0d0d] border border-[#333] rounded-lg p-2 text-center">
                      <p className="text-[9px] text-[#888] uppercase font-bold">{m.label}</p>
                      <p className="text-sm font-black text-white">{m.value || "N/A"}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-3 mb-3 text-xs text-[#d4d4d4] leading-relaxed">
                  <span className="font-bold text-teal-400">Why it fits: </span>{j.rationale}
                </div>

                {j.submissionTips && (
                  <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-3 mb-3 text-xs text-teal-300 leading-relaxed">
                    <span className="font-bold">Tip: </span>{j.submissionTips}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {(j.tags || []).map((t: string) => (
                      <Badge key={t} variant="outline" className="text-[10px] border-[#444] text-[#aaa]">{t}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {j.homepage && (
                      <a href={j.homepage} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="border-[#444] text-white hover:bg-[#222] h-8 text-xs">
                          <ExternalLink size={12} className="mr-1" /> Visit
                        </Button>
                      </a>
                    )}
                    <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs">
                      <CheckCircle2 size={12} className="mr-1" /> Select
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
