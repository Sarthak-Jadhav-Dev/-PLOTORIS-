"use client";

import { useEffect, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Loader2, GitCompare, CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestabilityScorerProps {
  projectId: string;
  hypothesis: any;
}

export default function TestabilityScorer({ projectId, hypothesis }: TestabilityScorerProps) {
  const [scoreData, setScoreData] = useState<any>(null);
  const [isScoring, setIsScoring] = useState(false);

  const fetchScore = async () => {
    if (!hypothesis) return;
    setIsScoring(true);
    
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

      const res = await fetch("/api/phase3/score-hypothesis", {
        method: "POST",
        headers,
        body: JSON.stringify({ hypothesis: hypothesis.h1, project_id: projectId })
      });
      const data = await res.json();
      setScoreData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScoring(false);
    }
  };

  useEffect(() => {
    if (hypothesis && !scoreData && !isScoring) {
      fetchScore();
    }
  }, [hypothesis]);

  if (!hypothesis) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] p-12 rounded-2xl text-center flex flex-col items-center">
        <GitCompare size={48} className="text-[#333] mb-4" />
        <h3 className="text-white font-medium mb-2">No Hypothesis Drafted</h3>
        <p className="text-[#888] text-sm max-w-md">Use the Hypothesis Builder to construct your initial variables and hypothesis before scoring its scientific testability.</p>
      </div>
    );
  }

  if (isScoring || !scoreData) {
    return (
      <div className="bg-[#1a1a1a] border border-[#333] p-12 rounded-2xl flex flex-col items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500 mb-4" />
        <p className="text-white font-medium animate-pulse">Running AI Testability Analysis...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <GitCompare size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Testability Scorecard</h2>
            <p className="text-sm text-[#888]">Scientific rigor analysis for your current hypothesis.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-emerald-400">{scoreData.overall_score}</p>
          <p className="text-xs uppercase tracking-wider font-bold text-[#888]">Overall Score</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[350px] bg-[#0d0d0d] rounded-xl border border-[#333] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={scoreData.dimensions}>
              <PolarGrid stroke="#333" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#333" tick={{ fill: '#555', fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0d0d0d] rounded-xl border border-[#333] p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Strengths
            </h3>
            <ul className="space-y-2">
              {scoreData.strengths.map((s: string, i: number) => (
                <li key={i} className="text-sm text-[#d4d4d4] flex gap-2"><span className="text-emerald-500">•</span> {s}</li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0d0d0d] rounded-xl border border-[#333] p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Areas for Improvement
            </h3>
            <ul className="space-y-3">
              {scoreData.weaknesses.map((w: any, i: number) => (
                <li key={i} className="text-sm">
                  <div className="text-amber-400 font-medium mb-1">{w.dimension}:</div>
                  <div className="text-[#888]">{w.suggestion}</div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-end pt-2">
             <Button variant="outline" onClick={fetchScore} className="border-[#444] text-white hover:bg-[#222]">
                <RefreshCw size={14} className="mr-2" /> Recalculate Score
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
