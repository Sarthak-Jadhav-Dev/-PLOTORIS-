"use client";

import { useState } from "react";
import { Activity, Loader2, Target, AlertTriangle, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GapDetector({ projectId }: { projectId: string }) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDetectGaps = async () => {
    setIsDetecting(true);
    setError(null);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase2/gap-detector", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to detect gaps.");
      
      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl shadow-xl w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Activity size={20} className="text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gap Detector</h2>
            <p className="text-sm text-[#888]">Cross-reference your Bucket to find contradictions and white-space.</p>
          </div>
        </div>
        <Button 
          onClick={handleDetectGaps} 
          disabled={isDetecting}
          className="bg-rose-600 hover:bg-rose-700 text-white rounded-lg"
        >
          {isDetecting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Activity size={16} className="mr-2" />}
          Run Analysis
        </Button>
      </div>

      {isDetecting && (
        <div className="flex flex-col items-center py-16 text-[#888]">
          <Loader2 size={48} className="animate-spin mb-6 text-rose-500" />
          <p className="text-lg animate-pulse">Synthesizing papers and detecting contradictions...</p>
        </div>
      )}

      {error && !isDetecting && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-center">
          <AlertTriangle size={24} className="mx-auto mb-2" />
          <p>{error}</p>
        </div>
      )}

      {analysis && !isDetecting && (
        <div className="space-y-6">
          {/* Contradictions */}
          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <h3 className="text-rose-400 font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle size={18} /> Contradictions
            </h3>
            {analysis.contradictions?.length === 0 ? (
              <p className="text-[#666] text-sm">No major contradictions detected.</p>
            ) : (
              <div className="space-y-4">
                {analysis.contradictions.map((c: any, i: number) => (
                  <div key={i} className="border-l-2 border-rose-500 pl-4">
                    <h4 className="text-white font-medium">{c.topic}</h4>
                    <p className="text-sm text-[#888] mt-1">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Consensus */}
          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <h3 className="text-emerald-400 font-semibold flex items-center gap-2 mb-4">
              <Layers size={18} /> Consensus
            </h3>
            {analysis.consensus?.length === 0 ? (
              <p className="text-[#666] text-sm">No consensus detected.</p>
            ) : (
              <div className="space-y-4">
                {analysis.consensus.map((c: any, i: number) => (
                  <div key={i} className="border-l-2 border-emerald-500 pl-4">
                    <h4 className="text-white font-medium">{c.topic}</h4>
                    <p className="text-sm text-[#888] mt-1">{c.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gaps (White-space) */}
          <div className="bg-[#111] border border-[#222] p-5 rounded-xl">
            <h3 className="text-indigo-400 font-semibold flex items-center gap-2 mb-4">
              <Target size={18} /> Missing White-Space
            </h3>
            {analysis.gaps?.length === 0 ? (
              <p className="text-[#666] text-sm">No clear gaps detected.</p>
            ) : (
              <div className="space-y-4">
                {analysis.gaps.map((g: any, i: number) => (
                  <div key={i} className="border-l-2 border-indigo-500 pl-4">
                    <h4 className="text-white font-medium">{g.gap_identified}</h4>
                    <p className="text-sm text-[#888] mt-1">{g.why_it_matters}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
