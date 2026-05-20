"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, Sparkles, Copy, CheckCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultInterpreter() {
  const [form, setForm] = useState({
    testName: "Linear Regression",
    iv: "Social Media Usage (hrs/day)",
    dv: "Academic Performance (GPA)",
    pValue: "0.02",
    effectSize: "0.45",
    ci: "0.12 – 0.78",
    sampleSize: "385",
    tone: "academic",
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/phase7/interpret-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {}
    finally { setIsGenerating(false); }
  };

  const handleCopy = () => {
    if (result?.paragraph) {
      navigator.clipboard.writeText(result.paragraph);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const significanceColor = result?.is_significant ? "text-emerald-400" : "text-rose-400";
  const significanceBg = result?.is_significant ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30";

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Panel */}
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Brain size={20} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Result Interpreter</h2>
            <p className="text-xs text-[#888]">Enter your statistical outputs for AI interpretation.</p>
          </div>
        </div>

        {[
          { label: "Test Name", key: "testName", placeholder: "e.g., Linear Regression" },
          { label: "Independent Variable", key: "iv", placeholder: "e.g., Social Media Usage" },
          { label: "Dependent Variable", key: "dv", placeholder: "e.g., Academic Performance" },
          { label: "p-value", key: "pValue", placeholder: "e.g., 0.02" },
          { label: "Effect Size (β / r / η²)", key: "effectSize", placeholder: "e.g., 0.45" },
          { label: "95% Confidence Interval", key: "ci", placeholder: "e.g., 0.12 – 0.78" },
          { label: "Sample Size (n)", key: "sampleSize", placeholder: "e.g., 385" },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">{label}</label>
            <input
              value={(form as any)[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
        ))}

        <div>
          <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Output Tone</label>
          <div className="flex gap-2">
            {["academic", "technical", "beginner"].map(t => (
              <button key={t} onClick={() => setForm({ ...form, tone: t })}
                className={`flex-1 py-2 rounded-lg border text-xs font-semibold capitalize transition-all ${form.tone === t ? "bg-violet-500/20 border-violet-500 text-violet-400" : "bg-[#0d0d0d] border-[#333] text-[#888] hover:border-[#555]"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700 text-white h-11">
          {isGenerating ? <><Loader2 size={16} className="mr-2 animate-spin" /> Generating...</> : <><Sparkles size={16} className="mr-2" /> Interpret Results</>}
        </Button>
      </div>

      {/* Output Panel */}
      <div className="space-y-4">
        {!result && !isGenerating && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full">
            <Brain size={48} className="text-[#333] mb-4" />
            <p className="text-[#888] text-sm">Fill in your statistical outputs and click "Interpret Results"</p>
          </div>
        )}

        {isGenerating && (
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-12 flex flex-col items-center justify-center h-full">
            <Loader2 size={36} className="animate-spin text-violet-500 mb-4" />
            <p className="text-white font-medium animate-pulse">RAG agent synthesizing interpretation...</p>
            <p className="text-[#888] text-xs mt-2">Cross-referencing with literature and hypothesis context</p>
          </div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Significance Badge */}
              <div className={`border rounded-xl p-4 flex items-center justify-between ${significanceBg}`}>
                <div>
                  <p className="text-xs text-[#888] font-bold uppercase tracking-wider mb-1">Statistical Significance</p>
                  <p className={`text-xl font-black ${significanceColor}`}>
                    {result.is_significant ? "Statistically Significant" : "Not Significant"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#888]">p-value</p>
                  <p className={`text-2xl font-black ${significanceColor}`}>{form.pValue}</p>
                </div>
              </div>

              {/* Academic Paragraph */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#333]">
                  <p className="text-xs font-bold text-white uppercase tracking-wider">Academic Interpretation</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy} className="border-[#444] text-white h-7 px-3 text-xs hover:bg-[#222]">
                      {copied ? <><CheckCheck size={12} className="mr-1 text-emerald-400" />Copied</> : <><Copy size={12} className="mr-1" />Copy</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleGenerate} className="border-[#444] text-white h-7 px-3 text-xs hover:bg-[#222]">
                      <RefreshCw size={12} className="mr-1" />Regen
                    </Button>
                  </div>
                </div>
                <div className="p-5 font-serif text-[#d4d4d4] leading-relaxed text-sm" contentEditable suppressContentEditableWarning>
                  {result.paragraph}
                </div>
              </div>

              {/* Practical Significance */}
              <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-4">
                <p className="text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Practical Significance</p>
                <p className="text-sm text-[#d4d4d4] leading-relaxed">{result.practical_significance}</p>
              </div>

              {/* Suggested Conclusion */}
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4">
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-2">Suggested Conclusion</p>
                <p className="text-sm text-[#d4d4d4] leading-relaxed">{result.suggested_conclusion}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
