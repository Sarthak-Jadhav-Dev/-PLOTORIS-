"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2, Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import ProblemGenerator from "./phase1/problem-generator";
import QuestionValidator from "./phase1/question-validator";
import ScopeBuilder from "./phase1/scope-builder";
import SmartBuilder from "./phase1/smart-builder";
import { Button } from "../ui/button";

const STEPS = [
  "Problem Identification",
  "Question Validation",
  "Scope Boundaries",
  "SMART Objectives"
];

export default function PhaseOneView() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  // State context
  const [problem, setProblem] = useState<any>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [scope, setScope] = useState<any>(null);
  const [objectives, setObjectives] = useState<any>(null);

  const handleFinalize = async (finalObjectives: any) => {
    setObjectives(finalObjectives);
    setIsFinalizing(true);

    try {
      const res = await fetch("/api/phase1/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          question: questionData,
          scope,
          objectives: finalObjectives
        })
      });
      const data = await res.json();
      setFinalResult(data);
      setCurrentStep(4); // Move to completion view
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] relative flex flex-col">
      {/* Top Progress Bar */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-[#222] -z-10" />
            
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStep;
              const isPast = idx < currentStep;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 bg-[#0a0a0a] px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive ? "border-orange-500 bg-orange-500/20 text-orange-400" :
                    isPast ? "border-green-500 bg-green-500 text-black" :
                    "border-[#333] bg-[#1a1a1a] text-[#666]"
                  }`}>
                    {isPast ? <Check size={14} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold hidden md:block ${
                    isActive ? "text-orange-400" : isPast ? "text-green-500" : "text-[#555]"
                  }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-10">
        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ProblemGenerator onProblemSelected={(p) => { setProblem(p); setCurrentStep(1); }} />
            </motion.div>
          )}

          {currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <QuestionValidator 
                problemContext={problem} 
                onQuestionValidated={(q) => { setQuestionData(q); setCurrentStep(2); }} 
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ScopeBuilder 
                problemContext={problem}
                questionContext={questionData}
                onScopeFinalized={(s) => { setScope(s); setCurrentStep(3); }} 
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <SmartBuilder 
                problemContext={problem}
                questionContext={questionData}
                onObjectivesFinalized={handleFinalize} 
              />
            </motion.div>
          )}

          {/* Finalization overlay / Completion View */}
          {isFinalizing && (
            <div className="absolute inset-0 z-50 bg-[#050505]/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <Loader2 size={48} className="animate-spin text-orange-500 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">Seeding Knowledge Graph...</h2>
              <p className="text-[#888]">Finalizing Phase 1 and creating initial connections.</p>
            </div>
          )}

          {currentStep === 4 && finalResult && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center py-20">
              <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Network size={32} className="text-green-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Phase 1 Complete!</h1>
              <p className="text-lg text-[#a0aec0] mb-8 leading-relaxed">
                {finalResult.ai_summary}
              </p>
              
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col gap-4 text-left mb-8">
                <h3 className="text-white font-semibold border-b border-[#333] pb-2">Knowledge Graph Seeded Nodes</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20">Problem Statement</Badge>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Research Question</Badge>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">Scope Boundaries</Badge>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">SMART Objectives</Badge>
                </div>
                <p className="text-xs text-[#666] mt-2">UUIDs: {finalResult.knowledge_graph_nodes.join(", ")}</p>
              </div>

              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-xl">
                Proceed to Phase 2: Literature Review <ChevronRight className="ml-2" />
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
