"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Target, ExternalLink, BookmarkPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function JournalRecommender() {
  const [form, setForm] = useState({
    abstract: "This study examines the relationship between social media usage and academic performance among undergraduate students using a quasi-experimental design...",
    keywords: "Social Media, Academic Performance, Quasi-Experimental, Digital Wellness",
    oaPreference: "Any",
    speed: "Standard"
  });

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch("/api/phase9/recommend-journals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setResults(data.journals);
    } catch {}
    finally { setIsSearching(false); }
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Input Panel */}
      <div className="lg:col-span-1 bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl space-y-4 h-fit">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
            <Target size={20} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Journal Recommender</h2>
            <p className="text-xs text-[#888]">Find the perfect home for your paper.</p>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Abstract</label>
          <textarea
            value={form.abstract}
            onChange={e => setForm({...form, abstract: e.target.value})}
            rows={5}
            className="w-full bg-[#0d0d0d] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Keywords</label>
          <input
            value={form.keywords}
            onChange={e => setForm({...form, keywords: e.target.value})}
            className="w-full bg-[#0d0d0d] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Open Access</label>
            <select value={form.oaPreference} onChange={e => setForm({...form, oaPreference: e.target.value})} className="w-full bg-[#0d0d0d] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-2 py-2 focus:outline-none">
              <option>Any</option><option>OA Only</option><option>Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Speed</label>
            <select value={form.speed} onChange={e => setForm({...form, speed: e.target.value})} className="w-full bg-[#0d0d0d] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-2 py-2 focus:outline-none">
              <option>Standard</option><option>Fast Track</option>
            </select>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={isSearching} className="w-full bg-teal-600 hover:bg-teal-700 text-white h-11 mt-2">
          {isSearching ? <><Loader2 size={16} className="mr-2 animate-spin" />Analyzing Fit...</> : <><Search size={16} className="mr-2" />Find Journals</>}
        </Button>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-2 space-y-4">
        {!results && !isSearching && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <Target size={48} className="text-[#333] mb-4" />
            <p className="text-[#888] text-sm">Enter your abstract to get AI-ranked journal recommendations.</p>
          </div>
        )}

        {isSearching && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <Loader2 size={36} className="animate-spin text-teal-500 mb-4" />
            <p className="text-white font-medium animate-pulse">Scanning OpenAlex & Crossref databases...</p>
            <p className="text-[#888] text-xs mt-2">Matching scope, methodology, and keywords</p>
          </div>
        )}

        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              {results.map((j, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-[#333] hover:border-teal-500/50 transition-colors rounded-2xl p-5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-teal-500/10 text-teal-400 px-3 py-1 text-xs font-bold rounded-bl-xl border-b border-l border-teal-500/20">
                    {j.matchScore}% Match
                  </div>
                  
                  <div className="pr-20 mb-3">
                    <h3 className="text-lg font-bold text-white mb-1">{j.name}</h3>
                    <p className="text-xs text-[#888]">{j.publisher}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-2 text-center">
                      <p className="text-[9px] text-[#888] uppercase font-bold">Impact Factor</p>
                      <p className="text-sm font-black text-white">{j.impactFactor}</p>
                    </div>
                    <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-2 text-center">
                      <p className="text-[9px] text-[#888] uppercase font-bold">Quartile</p>
                      <p className="text-sm font-black text-white">{j.quartile}</p>
                    </div>
                    <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-2 text-center">
                      <p className="text-[9px] text-[#888] uppercase font-bold">Acceptance Rate</p>
                      <p className="text-sm font-black text-white">{j.acceptanceRate}</p>
                    </div>
                    <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-2 text-center">
                      <p className="text-[9px] text-[#888] uppercase font-bold">Time to First Decision</p>
                      <p className="text-sm font-black text-white">{j.reviewTime}</p>
                    </div>
                  </div>

                  <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-3 mb-4 text-xs text-[#d4d4d4] leading-relaxed">
                    <span className="font-bold text-teal-400">Why it fits: </span>{j.rationale}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {j.tags.map((t: string) => (
                        <Badge key={t} variant="outline" className="text-[10px] border-[#444] text-[#aaa]">{t}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-[#444] text-white hover:bg-[#222] h-8 text-xs">
                        <BookmarkPlus size={14} className="mr-1" /> Save
                      </Button>
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white h-8 text-xs">
                        Select for Export <CheckCircle2 size={14} className="ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
