"use client";

import { useState, useEffect } from "react";
import { Link2, Loader2, Sparkles, CheckCircle2, AlertCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function VariableLinker({ projectId }: { projectId: string }) {
  const [isLinking, setIsLinking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [datasetMetadata, setDatasetMetadata] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchResultAndDataset = async () => {
      try {
        const [res, dsRes] = await Promise.all([
          fetch(`/api/phase5/link-variables?project_id=${projectId}`),
          fetch(`/api/phase5/dataset?project_id=${projectId}`)
        ]);
        
        const data = await res.json();
        if (data.result) setResult(data.result);

        const dsData = await dsRes.json();
        if (dsData.metadata) setDatasetMetadata(dsData.metadata);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    if (projectId) fetchResultAndDataset();
  }, [projectId]);

  const getHeaders = () => {
    const activeProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
    const apiKey = localStorage.getItem(`plotoris_${activeProvider}_key_${projectId}`) || "";
    const headers: any = { "Content-Type": "application/json" };
    if (apiKey) {
      headers["x-api-key"] = apiKey;
      headers["x-api-provider"] = activeProvider;
    }
    return headers;
  };

  const handleLink = async () => {
    setIsLinking(true);
    setProgress(0);
    setResult(null);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + (Math.random() * 5 + 2), 90));
    }, 800);

    try {
      const res = await fetch("/api/phase5/link-variables", { 
        method: "POST", 
        headers: getHeaders(),
        body: JSON.stringify({ project_id: projectId, hasDataset: !!datasetMetadata })
      });
      const data = await res.json();
      setResult(data);
    } catch { } finally {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setIsLinking(false);
      }, 500);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {!result && !isLinking && (
        <div className="border border-[#222] bg-[#111] rounded-2xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Link2 size={32} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Variable Auto-Linker</h2>
          <p className="text-[#888] text-sm mb-8 leading-relaxed">
            Connect the raw columns from your dataset to the formal variables you defined in Phase 3. 
            This semantic mapping enables the AI to perform accurate statistical analysis in Phase 7.
          </p>

          {!datasetMetadata ? (
            <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-xl mb-6 flex flex-col items-center">
              <AlertCircle className="w-6 h-6 text-amber-500 mb-2" />
              <p className="text-sm text-amber-400">Please upload a dataset in the Active Dataset section above first.</p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6 flex flex-col items-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
              <p className="text-sm text-emerald-400 font-medium">Dataset Ready: {datasetMetadata.filename}</p>
              <p className="text-xs text-emerald-500/70">{datasetMetadata.columns?.length} columns detected</p>
            </div>
          )}

          <Button 
            onClick={handleLink} 
            className="bg-amber-600 hover:bg-amber-700 text-white w-full max-w-sm rounded-xl py-6 text-base font-medium transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-600/20"
            disabled={!datasetMetadata}
          >
            Run Auto-Linker
          </Button>
        </div>
      )}

      {isLinking && !result && (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-12 text-center max-w-2xl mx-auto mt-10">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={20} className="text-amber-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Mapping Variables...</h2>
          <p className="text-[#888] text-sm mb-6">Using LLM to semantically link your dataset columns to research variables.</p>
          
          <div className="w-full bg-[#1a1a1a] rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-amber-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
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
