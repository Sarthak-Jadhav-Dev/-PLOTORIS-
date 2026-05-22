"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Loader2, AlertTriangle, XCircle, CheckCircle2, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export default function DataQualityChecker({ projectId }: { projectId: string }) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [datasetMetadata, setDatasetMetadata] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchResultAndDataset = async () => {
      try {
        const [res, dsRes] = await Promise.all([
          fetch(`/api/phase5/quality-check?project_id=${projectId}`),
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

  const handleCheck = async () => {
    setIsChecking(true);
    setProgress(0);
    setResult(null);

    // Simulate progress while waiting
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + (Math.random() * 5 + 2), 90));
    }, 800);

    try {
      const res = await fetch("/api/phase5/quality-check", { 
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
        setIsChecking(false);
      }, 500);
    }
  };

  const verdictColors: Record<string, string> = {
    "Excellent": "text-emerald-400",
    "Good": "text-blue-400",
    "Needs Attention": "text-amber-400",
    "Poor": "text-rose-400",
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
      {!result && !isChecking && (
        <div className="border border-[#222] bg-[#111] rounded-2xl p-8 text-center max-w-2xl mx-auto mt-10">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} className="text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-3">AI Data Quality Checker</h2>
          <p className="text-[#888] text-sm mb-8 leading-relaxed">
            Our multi-agent system will analyze your dataset for missing values, outliers, duplicate records, and type inconsistencies before you proceed to validation.
          </p>

          {!datasetMetadata ? (
            <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-xl mb-6">
              <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-amber-400">Please upload a dataset in the Active Dataset section above first.</p>
            </div>
          ) : (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6 flex flex-col items-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
              <p className="text-sm text-emerald-400 font-medium">Dataset Ready: {datasetMetadata.filename}</p>
              <p className="text-xs text-emerald-500/70">{datasetMetadata.rowCount} records • {datasetMetadata.columns?.length} columns</p>
            </div>
          )}

          <Button 
            onClick={handleCheck} 
            className="bg-violet-600 hover:bg-violet-700 text-white w-full max-w-sm rounded-xl py-6 text-base font-medium transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-600/20"
            disabled={!datasetMetadata}
          >
            Run Quality Check
          </Button>
        </div>
      )}

      {isChecking && !result && (
        <div className="bg-[#111] border border-[#222] rounded-2xl p-12 text-center max-w-2xl mx-auto mt-10">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={20} className="text-violet-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Analyzing Dataset Quality</h2>
          <p className="text-[#888] text-sm mb-6">Our multi-agent system is scanning the dataset for anomalies...</p>
          
          <div className="w-full bg-[#1a1a1a] rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-violet-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Score Header */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#888] uppercase font-bold tracking-wider mb-1">Overall Quality Verdict</p>
                <h2 className={`text-4xl font-black ${verdictColors[result.verdict] || "text-white"}`}>{result.verdict}</h2>
                <p className="text-[#888] text-sm mt-2">{result.summary}</p>
              </div>
              <div className="text-right">
                <div className={`text-6xl font-black ${verdictColors[result.verdict] || "text-white"}`}>{result.score}</div>
                <p className="text-xs text-[#888] uppercase tracking-wider">/ 100</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Radar Chart */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Quality Dimensions</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={result.dimensions}>
                      <PolarGrid stroke="#333" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#888", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#333" tick={{ fill: "#555", fontSize: 9 }} />
                      <Radar dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Issues List */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-[#333]">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Issues Detected ({result.issues.length})</h3>
                </div>
                <div className="divide-y divide-[#222] max-h-[340px] overflow-y-auto">
                  {result.issues.map((issue: any, i: number) => (
                    <div key={i} className="p-4 flex items-start gap-3">
                      {issue.severity === "error" ? <XCircle size={16} className="text-rose-500 mt-0.5 shrink-0" /> :
                       issue.severity === "warning" ? <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" /> :
                       <CheckCircle2 size={16} className="text-blue-500 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white">{issue.title}</p>
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            issue.severity === "error" ? "bg-rose-500/10 text-rose-400" :
                            issue.severity === "warning" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"
                          }`}>{issue.severity}</span>
                        </div>
                        <p className="text-xs text-[#888] mt-1">{issue.description}</p>
                        <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><Wrench size={10} /> {issue.fix}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
