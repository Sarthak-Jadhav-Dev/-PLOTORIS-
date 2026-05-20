"use client";

import { useEffect, useState } from "react";
import { SearchCode, CheckCircle, XCircle, FileText, Loader2, BookOpen } from "lucide-react";

interface ValidationPanelProps {
  hypothesis: any;
}

export default function ValidationPanel({ hypothesis }: ValidationPanelProps) {
  const [validationData, setValidationData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchValidation = async () => {
    if (!hypothesis) return;
    setIsValidating(true);
    
    try {
      const res = await fetch("/api/phase3/validate-literature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hypothesis: hypothesis.h1 })
      });
      const data = await res.json();
      setValidationData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (hypothesis && !validationData && !isValidating) {
      fetchValidation();
    }
  }, [hypothesis]);

  if (!hypothesis) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] p-12 rounded-2xl text-center flex flex-col items-center">
        <SearchCode size={48} className="text-[#333] mb-4" />
        <h3 className="text-white font-medium mb-2">No Hypothesis Drafted</h3>
        <p className="text-[#888] text-sm max-w-md">Generate a hypothesis first to validate it against the literature corpus.</p>
      </div>
    );
  }

  if (isValidating || !validationData) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] p-12 rounded-2xl flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
        <p className="text-white font-medium animate-pulse">Running RAG Validation against literature corpus...</p>
      </div>
    );
  }

  const isSupported = validationData.verdict === "Supported";
  const VerdictIcon = isSupported ? CheckCircle : XCircle;
  const verdictColor = isSupported ? "text-emerald-400" : "text-rose-400";
  const verdictBg = isSupported ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30";

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <SearchCode size={20} className="text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Literature Validation AI</h2>
          <p className="text-sm text-[#888]">Cross-checking hypothesis against your uploaded Phase 2 papers.</p>
        </div>
      </div>

      <div className={`p-6 rounded-xl border ${verdictBg} flex items-center justify-between mb-8`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#888] mb-1">AI Verdict</p>
          <h3 className={`text-3xl font-bold ${verdictColor}`}>{validationData.verdict}</h3>
          <p className="text-white text-sm mt-2">{validationData.explanation}</p>
        </div>
        <VerdictIcon size={64} className={`${verdictColor} opacity-50`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-5">
          <h4 className="text-emerald-400 font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={16} /> Supporting Literature
          </h4>
          {validationData.supporting_papers?.length > 0 ? (
            <div className="space-y-3">
              {validationData.supporting_papers.map((p: any, i: number) => (
                <div key={i} className="p-3 bg-[#111] rounded border border-[#222]">
                  <p className="text-sm text-white font-medium">{p.title}</p>
                  <p className="text-xs text-[#888] mt-1 italic">"{p.quote}"</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#666] text-sm">No directly supporting papers found in your corpus.</p>
          )}
        </div>

        <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-5">
          <h4 className="text-rose-400 font-semibold mb-4 flex items-center gap-2">
            <BookOpen size={16} /> Contradicting Literature
          </h4>
          {validationData.contradicting_papers?.length > 0 ? (
            <div className="space-y-3">
              {validationData.contradicting_papers.map((p: any, i: number) => (
                <div key={i} className="p-3 bg-[#111] rounded border border-[#222]">
                  <p className="text-sm text-white font-medium">{p.title}</p>
                  <p className="text-xs text-[#888] mt-1 italic">"{p.quote}"</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#666] text-sm">No contradicting papers found in your corpus.</p>
          )}
        </div>
      </div>
    </div>
  );
}
