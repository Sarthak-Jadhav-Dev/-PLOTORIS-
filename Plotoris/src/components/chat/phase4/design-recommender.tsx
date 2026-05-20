"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, FlaskConical, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DesignRecommender({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleRecommend = async () => {
    setIsGenerating(true);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase4/recommend-design", { 
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {!result ? (
        <div className="bg-[#1a1a1a] border border-[#333] p-12 rounded-2xl text-center flex flex-col items-center">
          <FlaskConical size={48} className="text-[#333] mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">AI Design Recommender</h2>
          <p className="text-[#888] text-sm max-w-lg mb-8">
            The AI will analyze your approved hypothesis, variables, and literature context to recommend the most scientifically rigorous research design.
          </p>
          <Button 
            onClick={handleRecommend} 
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12"
          >
            {isGenerating ? (
              <><Loader2 size={18} className="mr-2 animate-spin" /> Analyzing Variables...</>
            ) : (
              <><FlaskConical size={18} className="mr-2" /> Generate Recommendation</>
            )}
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            <div className="bg-gradient-to-br from-blue-900/30 to-[#1a1a1a] border border-blue-500/30 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <FlaskConical size={120} />
              </div>
              <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-2">Recommended Design</p>
              <h3 className="text-3xl font-bold text-white mb-4 relative z-10">
                {result.design_type}
              </h3>
              <p className="text-[#a0aec0] leading-relaxed max-w-2xl">
                {result.rationale}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" /> Key Advantages
                </h4>
                <ul className="space-y-3">
                  {result.advantages.map((adv: string, i: number) => (
                    <li key={i} className="text-sm text-[#888] flex gap-2">
                      <span className="text-emerald-500 mt-0.5">•</span> {adv}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" /> Trade-offs & Limitations
                </h4>
                <ul className="space-y-3">
                  {result.limitations.map((lim: string, i: number) => (
                    <li key={i} className="text-sm text-[#888] flex gap-2">
                      <span className="text-amber-500 mt-0.5">•</span> {lim}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-4">
               <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                 Lock Design Decision <ArrowRight size={16} className="ml-2" />
               </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
