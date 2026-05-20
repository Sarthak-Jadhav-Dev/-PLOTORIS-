"use client";

import { useState } from "react";
import { ShieldAlert, Loader2, AlertTriangle, XCircle, CheckCircle2, Wrench, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

export default function DataQualityChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/phase5/quality-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setResult(data);
    } catch { } finally {
      setIsChecking(false);
    }
  };

  const verdictColors: Record<string, string> = {
    "Excellent": "text-emerald-400",
    "Good": "text-blue-400",
    "Needs Attention": "text-amber-400",
    "Poor": "text-rose-400",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {!result && !isChecking && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center text-center">
          <ShieldAlert size={52} className="text-[#333] mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Data Quality Checker</h2>
          <p className="text-[#888] text-sm max-w-lg mb-8">
            A <strong className="text-white">LangGraph multi-agent</strong> pipeline will scan your dataset for missing values, duplicates, outliers, type mismatches, and suspicious patterns — then generate a scored report.
          </p>
          <Button onClick={handleCheck} className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 h-12">
            <Sparkles size={16} className="mr-2" /> Run Quality Check
          </Button>
        </div>
      )}

      {isChecking && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-16 flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-emerald-500 mb-4" />
          <p className="text-white font-medium animate-pulse">LangGraph agents running quality checks...</p>
          <div className="mt-6 space-y-2 text-xs text-[#666] text-center">
            {["Agent 1: Scanning for missing values...", "Agent 2: Detecting duplicates and outliers...", "Agent 3: Checking type consistency...", "Agent 4: Generating quality score..."].map((s, i) => (
              <p key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.5}s` }}>{s}</p>
            ))}
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
