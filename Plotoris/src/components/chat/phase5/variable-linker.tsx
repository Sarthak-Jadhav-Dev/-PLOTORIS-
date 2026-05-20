"use client";

import { useState } from "react";
import { Link2, Loader2, Sparkles, CheckCircle2, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function VariableLinker() {
  const [isLinking, setIsLinking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleLink = async () => {
    setIsLinking(true);
    setResult(null);
    try {
      const res = await fetch("/api/phase5/link-variables", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch { } finally {
      setIsLinking(false);
    }
  };

  const confidenceColor = (score: number) => {
    if (score >= 85) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-rose-400";
  };

  const confidenceBg = (score: number) => {
    if (score >= 85) return "bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/20";
    return "bg-rose-500/10 border-rose-500/20";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {!result && !isLinking && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center text-center">
          <Link2 size={52} className="text-[#333] mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Dataset → Variable Linker</h2>
          <p className="text-[#888] text-sm max-w-lg mb-4">
            Uses <strong className="text-fuchsia-400">Supabase pgvector embeddings</strong> and <strong className="text-white">LangChain</strong> to auto-match your dataset columns to the conceptual variables defined in Phase 3.
          </p>
          <p className="text-xs text-[#666] mb-8">
            Embedding similarity scores ensure each column is matched to its most semantically relevant variable with a confidence percentage.
          </p>
          <Button onClick={handleLink} className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-10 h-12">
            <Sparkles size={16} className="mr-2" /> Auto-Link Variables
          </Button>
        </div>
      )}

      {isLinking && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-16 flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-fuchsia-500 mb-4" />
          <p className="text-white font-medium animate-pulse">Querying Supabase pgvector for semantic matches...</p>
          <p className="text-[#888] text-xs mt-2">LangChain is embedding column names and matching against Phase 3 variable definitions.</p>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Auto-Matched", value: result.mappings.filter((m: any) => m.confidence >= 85).length, color: "text-emerald-400" },
                { label: "Low Confidence", value: result.mappings.filter((m: any) => m.confidence < 85 && m.confidence >= 60).length, color: "text-amber-400" },
                { label: "Unmapped", value: result.unmapped?.length || 0, color: "text-rose-400" },
              ].map((s, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 text-center">
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-[#888] mt-1 font-semibold uppercase tracking-wider">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Mapping Table */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#333] flex items-center gap-2">
                <Link2 size={16} className="text-fuchsia-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Column → Variable Mappings</h3>
                <span className="text-xs text-[#888] ml-auto">Powered by Supabase pgvector + LangChain</span>
              </div>
              <div className="divide-y divide-[#222]">
                {result.mappings.map((mapping: any, i: number) => (
                  <div key={i} className="p-5 flex items-center gap-4 hover:bg-[#111] transition-colors">
                    {/* Column */}
                    <div className="bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 min-w-[160px]">
                      <p className="text-xs text-[#888] mb-0.5">Dataset Column</p>
                      <p className="text-sm font-mono font-bold text-white">{mapping.column}</p>
                    </div>

                    <ArrowRight size={18} className="text-[#555] shrink-0" />

                    {/* Variable */}
                    <div className={`border rounded-lg px-3 py-2 flex-1 ${confidenceBg(mapping.confidence)}`}>
                      <p className="text-xs text-[#888] mb-0.5">Matched Variable (Phase 3)</p>
                      <p className="text-sm font-semibold text-white">{mapping.variable}</p>
                    </div>

                    {/* Confidence */}
                    <div className="text-right shrink-0 w-24">
                      <div className={`text-2xl font-black ${confidenceColor(mapping.confidence)}`}>{mapping.confidence}%</div>
                      <div className="text-[10px] text-[#888] uppercase">Confidence</div>
                    </div>

                    {/* Status Icon */}
                    <div className="shrink-0">
                      {mapping.confidence >= 85 ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : mapping.confidence >= 60 ? (
                        <AlertCircle size={20} className="text-amber-500" />
                      ) : (
                        <XCircle size={20} className="text-rose-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unmapped variables */}
            {result.unmapped && result.unmapped.length > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-5">
                <h4 className="text-rose-400 font-semibold text-sm mb-3 flex items-center gap-2">
                  <XCircle size={16} /> Unmapped Variables (No dataset column found)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.unmapped.map((v: string, i: number) => (
                    <span key={i} className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-3 py-1 rounded-lg text-xs font-medium">{v}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                Lock Mappings & Proceed to Analysis
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
