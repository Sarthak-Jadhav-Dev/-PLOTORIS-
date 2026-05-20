"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, RefreshCw, XCircle, Target, ArrowRight, ListChecks, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SmartBuilderProps {
  problemContext: any;
  questionContext: any;
  onObjectivesFinalized: (data: any) => void;
}

export default function SmartBuilder({ problemContext, questionContext, onObjectivesFinalized }: SmartBuilderProps) {
  const [goal, setGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleConvert = async () => {
    if (!goal.trim()) return;
    setIsLoading(true);
    setResult(null);
    
    try {
      const res = await fetch("/api/phase1/smart-conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal, 
          problem: problemContext?.statement, 
          question: questionContext?.question 
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Target size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Build SMART Objectives</h2>
            <p className="text-sm text-[#888]">Convert vague research goals into Specific, Measurable, Achievable, Relevant, and Time-bound objectives.</p>
          </div>
        </div>

        <Textarea 
          placeholder="What is your broad goal for this research? (e.g., 'I want to see if the new model is better')"
          className="bg-[#0d0d0d] border-[#333] text-white min-h-[100px] mb-4 focus:border-emerald-500/50"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />

        <div className="flex justify-end">
          <Button 
            onClick={handleConvert} 
            disabled={!goal.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Converting to SMART...
              </>
            ) : (
              <>
                <Target size={16} className="mr-2" />
                Convert Goal
              </>
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* The Improved Objective */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-[#1a1a1a] border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target size={100} />
              </div>
              <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider mb-2">Final SMART Objective</p>
              <h3 className="text-xl font-medium text-white leading-relaxed relative z-10">
                "{result.smart_objective}"
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SMART Analysis Breakdown */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                <h4 className="text-white font-semibold mb-4 text-sm">SMART Criterion Analysis</h4>
                <div className="space-y-4">
                  {['specific', 'measurable', 'achievable', 'relevant', 'timebound'].map((criterion) => {
                    const data = result.smart_analysis[criterion];
                    const isGood = data.score >= 7;
                    return (
                      <div key={criterion} className="flex gap-3">
                        <div className="mt-0.5 shrink-0">
                          {isGood ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white uppercase tracking-wider">{criterion}</span>
                            <span className="text-xs text-[#888]">{data.score}/10</span>
                          </div>
                          {data.issue ? (
                            <p className="text-xs text-red-400 mb-1">Issue: {data.issue}</p>
                          ) : null}
                          <p className="text-xs text-[#a0aec0]">{result.breakdown[criterion]}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-6">
                {/* Success Criteria */}
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
                    <ListChecks size={16} className="text-emerald-500" />
                    Success Criteria
                  </h4>
                  <ul className="space-y-3">
                    {result.success_criteria.map((c: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-[#d4d4d4] bg-[#0d0d0d] p-3 rounded-lg border border-[#222]">
                        <span className="text-emerald-500 font-bold">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestones */}
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                  <h4 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
                    <Calendar size={16} className="text-emerald-500" />
                    Suggested Timeline
                  </h4>
                  <div className="space-y-3">
                    {result.milestones.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-[#0d0d0d] p-3 rounded-lg border border-[#222]">
                        <span className="text-white">{m.milestone}</span>
                        <span className="text-[#888] text-xs font-medium bg-[#222] px-2 py-1 rounded">{m.timeline}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => onObjectivesFinalized(result)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                Lock Objectives & Finish Phase 1 <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
