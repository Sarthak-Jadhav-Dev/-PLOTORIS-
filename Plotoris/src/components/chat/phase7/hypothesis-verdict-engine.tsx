"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Loader2, Sparkles, CheckCircle2, XCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const VERDICT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  "Accepted": { label: "Accepted", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  "Rejected": { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", icon: XCircle },
  "Partially Supported": { label: "Partially Supported", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertCircle },
  "Inconclusive": { label: "Inconclusive", color: "text-[#888]", bg: "bg-[#333]/20 border-[#444]", icon: HelpCircle },
};

export default function HypothesisVerdictEngine() {
  const [form, setForm] = useState({
    h0: "There is no statistically significant relationship between social media usage and academic performance.",
    h1: "Increased social media usage is significantly associated with lower academic performance among undergraduate students.",
    pValue: "0.02",
    effectSize: "0.45",
    direction: "Negative",
    significant: "yes",
  });
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRunVerdict = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/phase7/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {}
    finally { setIsRunning(false); }
  };

  const verdict = result ? VERDICT_CONFIG[result.verdict] : null;
  const VerdictIcon = verdict?.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Inputs */}
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BarChart3 size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Hypothesis Verdict Engine</h2>
            <p className="text-xs text-[#888]">Compare your findings against the null and alternative hypotheses.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Null Hypothesis (H0)</label>
            <textarea value={form.h0} onChange={e => setForm({ ...form, h0: e.target.value })} rows={2}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors resize-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Alternative Hypothesis (H1)</label>
            <textarea value={form.h1} onChange={e => setForm({ ...form, h1: e.target.value })} rows={2}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors resize-none" />
          </div>

          {[
            { label: "p-value", key: "pValue" },
            { label: "Effect Size", key: "effectSize" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">{label}</label>
              <input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors" />
            </div>
          ))}

          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Effect Direction</label>
            <select value={form.direction} onChange={e => setForm({ ...form, direction: e.target.value })}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2">
              <option>Positive</option>
              <option>Negative</option>
              <option>No Direction</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Statistically Significant?</label>
            <div className="flex gap-2">
              {["yes", "no", "borderline"].map(v => (
                <button key={v} onClick={() => setForm({ ...form, significant: v })}
                  className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${form.significant === v ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-[#0d0d0d] border-[#333] text-[#888] hover:border-[#555]"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleRunVerdict} disabled={isRunning} className="w-full bg-amber-600 hover:bg-amber-700 text-white h-11">
          {isRunning ? <><Loader2 size={16} className="mr-2 animate-spin" />Running Verdict Engine...</> : <><Sparkles size={16} className="mr-2" />Issue Verdict</>}
        </Button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {isRunning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-amber-500 mb-4" />
            <p className="text-white font-medium animate-pulse">Comparing findings against hypothesis context...</p>
          </motion.div>
        )}
        {result && verdict && VerdictIcon && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Verdict Banner */}
            <div className={`border rounded-2xl p-8 flex items-center justify-between ${verdict.bg}`}>
              <div>
                <p className="text-xs text-[#888] font-bold uppercase tracking-wider mb-2">Hypothesis Verdict</p>
                <h2 className={`text-4xl font-black ${verdict.color}`}>{result.verdict}</h2>
                <p className="text-[#d4d4d4] text-sm mt-3 max-w-xl leading-relaxed">{result.rationale}</p>
              </div>
              <div className="text-center shrink-0 ml-6">
                <VerdictIcon size={64} className={`${verdict.color} opacity-60 mb-2`} />
                <div className={`text-3xl font-black ${verdict.color}`}>{result.confidence}%</div>
                <p className="text-[10px] text-[#888] uppercase tracking-wider">Confidence</p>
              </div>
            </div>

            {/* Confidence Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.confidence_factors.map((factor: any, i: number) => (
                <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                  <p className="text-xs text-[#888] uppercase font-bold tracking-wider mb-2">{factor.label}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-[#222] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${factor.score >= 80 ? "bg-emerald-500" : factor.score >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${factor.score}%` }} />
                    </div>
                    <span className={`text-sm font-bold ${factor.score >= 80 ? "text-emerald-400" : factor.score >= 60 ? "text-amber-400" : "text-rose-400"}`}>{factor.score}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Implications */}
            <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-5">
              <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-3">Research Implications</p>
              <ul className="space-y-2">
                {result.implications.map((imp: string, i: number) => (
                  <li key={i} className="text-sm text-[#d4d4d4] flex gap-2">
                    <span className={verdict.color}>→</span> {imp}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
