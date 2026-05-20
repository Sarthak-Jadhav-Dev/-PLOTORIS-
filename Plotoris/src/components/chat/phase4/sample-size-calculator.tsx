"use client";

import { useState } from "react";
import { Calculator, Users, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SampleSizeCalculator({ projectId }: { projectId: string }) {
  const [population, setPopulation] = useState<number | "">("");
  const [confidence, setConfidence] = useState(95);
  const [margin, setMargin] = useState(5);
  const [dropout, setDropout] = useState(10);
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculateSize = async () => {
    setIsCalculating(true);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase4/calculate-sample", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: projectId,
          population: population || null,
          confidence,
          margin,
          dropout
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl flex flex-col md:flex-row gap-12">
        
        {/* Form Side */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Calculator size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sample Size Calculator</h2>
              <p className="text-sm text-[#888]">Compute statistically valid sample sizes.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Population Size (optional)</label>
            <input 
              type="number" 
              placeholder="e.g., 10000"
              value={population}
              onChange={(e) => setPopulation(e.target.value ? Number(e.target.value) : "")}
              className="w-full bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
               <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">Confidence Level</label>
               <span className="text-xs text-indigo-400 font-bold">{confidence}%</span>
            </div>
            <input 
              type="range" min="90" max="99" step="1"
              value={confidence} onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
               <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">Margin of Error</label>
               <span className="text-xs text-indigo-400 font-bold">{margin}%</span>
            </div>
            <input 
              type="range" min="1" max="10" step="1"
              value={margin} onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
               <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">Expected Dropout Rate</label>
               <span className="text-xs text-indigo-400 font-bold">{dropout}%</span>
            </div>
            <input 
              type="range" min="0" max="50" step="1"
              value={dropout} onChange={(e) => setDropout(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        {/* Results Side */}
        <div className="md:w-64 shrink-0 flex flex-col items-center justify-center bg-[#0d0d0d] rounded-2xl border border-[#333] p-6 text-center">
          <Users size={32} className="text-[#444] mb-4" />
          <p className="text-sm text-[#888] font-medium mb-1">Required Sample Size</p>
          <h3 className="text-5xl font-black text-white mb-2">
            {result ? result.recommended_size : "--"}
          </h3>
          
          <div className="w-full h-px bg-[#333] my-4" />
          
          <p className="text-xs text-[#888] font-medium mb-1 flex items-center justify-center gap-1">
            Statistical Power <HelpCircle size={12} />
          </p>
          <h3 className="text-3xl font-bold text-indigo-400 mb-2">
            {result ? `${result.power}%` : "--%"}
          </h3>
          <p className="text-[10px] text-[#666]">
            {result ? `Effect Size: ${result.effect_size}` : "Adjusted for dropouts"}
          </p>

          <Button 
            onClick={calculateSize} 
            disabled={isCalculating}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isCalculating ? <Loader2 size={16} className="animate-spin" /> : "Calculate Size"}
          </Button>
        </div>
      </div>
    </div>
  );
}
