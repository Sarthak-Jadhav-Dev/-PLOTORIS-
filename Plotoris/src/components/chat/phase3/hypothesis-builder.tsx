"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lightbulb, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HypothesisBuilderProps {
  onHypothesisGenerated: (data: any) => void;
}

export default function HypothesisBuilder({ onHypothesisGenerated }: HypothesisBuilderProps) {
  const [iv, setIv] = useState("");
  const [dv, setDv] = useState("");
  const [relationship, setRelationship] = useState("Positive");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleGenerate = async () => {
    if (!iv || !dv) return;
    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch("/api/phase3/generate-hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iv, dv, relationship })
      });
      const data = await res.json();
      setResult(data);
      onHypothesisGenerated(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lightbulb size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Hypothesis Builder</h2>
            <p className="text-sm text-[#888]">Define your core variables to generate formal academic statements.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Independent Variable (IV)</label>
            <input 
              type="text" 
              placeholder="e.g., Social Media Usage"
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Dependent Variable (DV)</label>
            <input 
              type="text" 
              placeholder="e.g., Academic Performance"
              value={dv}
              onChange={(e) => setDv(e.target.value)}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Expected Relationship</label>
            <div className="flex gap-4">
              {['Positive', 'Negative', 'Non-directional'].map((rel) => (
                <button
                  key={rel}
                  onClick={() => setRelationship(rel)}
                  className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${
                    relationship === rel 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                      : 'bg-[#0d0d0d] border-[#333] text-[#888] hover:border-[#555]'
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleGenerate} 
            disabled={!iv || !dv || isGenerating}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Engineering Hypothesis...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-gradient-to-br from-amber-900/30 to-[#1a1a1a] border border-amber-500/30 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Lightbulb size={120} />
              </div>
              <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 size={14} /> Alternative Hypothesis (H1)
              </p>
              <h3 className="text-2xl font-medium text-white leading-relaxed relative z-10 mb-4">
                "{result.h1}"
              </h3>
              
              <div className="border-t border-[#333] pt-4 mt-6">
                 <p className="text-[10px] text-[#888] uppercase font-bold tracking-wider mb-2">Null Hypothesis (H0)</p>
                 <p className="text-sm text-[#a0aec0] italic">"{result.h0}"</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
