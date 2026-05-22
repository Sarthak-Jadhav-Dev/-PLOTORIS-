"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Loader2, Network, FastForward, Wand2, Edit2, Save, X as CloseIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

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

interface PhaseOneViewProps {
  projectId?: string;
  onProceedToPhase2?: () => void;
}

export default function PhaseOneView({ projectId, onProceedToPhase2 }: PhaseOneViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);

  // Fast-Track State
  const [isBypassMode, setIsBypassMode] = useState(false);
  const [customIdea, setCustomIdea] = useState("");
  const [isSubmittingBypass, setIsSubmittingBypass] = useState(false);

  // State context
  const [problem, setProblem] = useState<any>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [scope, setScope] = useState<any>(null);
  const [objectives, setObjectives] = useState<any>(null);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isEditingData, setIsEditingData] = useState(false);
  const [editForm, setEditForm] = useState({
    problem: "",
    question: "",
    inclusions: "",
    exclusions: "",
    objectives: ""
  });

  useEffect(() => {
    async function loadData() {
      if (!projectId) {
        setIsLoadingData(false);
        return;
      }
      try {
        const res = await fetch(`/api/phase1/load?project_id=${projectId}`);
        const data = await res.json();
        if (data.found && data.data) {
          setProblem(data.data.problem);
          setQuestionData(data.data.question);
          setScope(data.data.scope);
          setObjectives(data.data.objectives);
          setFinalResult({
            ai_summary: data.data.summary,
            knowledge_graph_nodes: []
          });
          setCurrentStep(4);
        }
      } catch (err) {
        console.error("Failed to load phase 1 data", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [projectId]);

  const handleFinalize = async (finalObjectives: any) => {
    setObjectives(finalObjectives);
    setIsFinalizing(true);

    try {
      const activeTextProvider = projectId ? localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini" : "gemini";
      const activeEmbeddingProvider = projectId ? localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini" : "gemini";
      const textKey = projectId ? localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "" : "";
      const embeddingKey = projectId ? localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "" : "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase1/finalize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: projectId,
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

  const handleBypassSubmit = async () => {
    if (!customIdea.trim()) return;
    setIsSubmittingBypass(true);
    setIsFinalizing(true);

    try {
      const activeTextProvider = projectId ? localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini" : "gemini";
      const activeEmbeddingProvider = projectId ? localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini" : "gemini";
      const textKey = projectId ? localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "" : "";
      const embeddingKey = projectId ? localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "" : "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase1/direct-entry", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: projectId,
          custom_idea: customIdea
        })
      });
      const data = await res.json();
      setFinalResult(data);
      setCurrentStep(4); // Move to completion view
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingBypass(false);
      setIsFinalizing(false);
    }
  };

  const handleEditClick = () => {
    setEditForm({
      problem: problem?.statement || problem || "",
      question: questionData?.version || questionData?.question || questionData || "",
      inclusions: (scope?.inclusions || []).map((i: any) => i.item || i).join("\n"),
      exclusions: (scope?.exclusions || []).map((i: any) => i.item || i).join("\n"),
      objectives: Array.isArray(objectives)
        ? objectives.map((o: any) => o.objective || o.smart_objective || o).join("\n\n")
        : (objectives?.smart_objective || objectives?.objective || (typeof objectives === "string" ? objectives : ""))
    });
    setIsEditingData(true);
  };

  const handleSaveChanges = async () => {
    setIsFinalizing(true);
    setIsEditingData(false);

    const newProblem = { statement: editForm.problem };
    const newQuestion = { version: editForm.question };
    const newScope = {
      inclusions: editForm.inclusions.split("\n").filter(i => i.trim()).map(i => ({ item: i })),
      exclusions: editForm.exclusions.split("\n").filter(i => i.trim()).map(i => ({ item: i }))
    };
    const newObjectives = editForm.objectives.split("\n\n").filter(o => o.trim()).map(o => ({ objective: o }));

    setProblem(newProblem);
    setQuestionData(newQuestion);
    setScope(newScope);
    setObjectives(newObjectives);

    try {
      const activeTextProvider = projectId ? localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini" : "gemini";
      const activeEmbeddingProvider = projectId ? localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini" : "gemini";
      const textKey = projectId ? localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "" : "";
      const embeddingKey = projectId ? localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "" : "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase1/finalize", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: projectId,
          problem: newProblem,
          question: newQuestion,
          scope: newScope,
          objectives: newObjectives
        })
      });
      const data = await res.json();
      setFinalResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] relative flex flex-col">
      {isLoadingData && (
        <div className="absolute inset-0 z-50 bg-[#050505] flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      )}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? "border-orange-500 bg-orange-500/20 text-orange-400" :
                    isPast ? "border-green-500 bg-green-500 text-black" :
                      "border-[#333] bg-[#1a1a1a] text-[#666]"
                    }`}>
                    {isPast ? <Check size={14} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider font-semibold hidden md:block ${isActive ? "text-orange-400" : isPast ? "text-green-500" : "text-[#555]"
                    }`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mode Toggle (Only show if not finalized) */}
      {currentStep < 4 && !isFinalizing && (
        <div className="flex justify-center mt-6">
          <div className="bg-[#1a1a1a] p-1 rounded-lg flex gap-1 border border-[#333]">
            <button
              onClick={() => setIsBypassMode(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${!isBypassMode ? 'bg-[#333] text-white' : 'text-[#888] hover:text-white hover:bg-[#222]'}`}
            >
              <Wand2 size={16} /> Guided AI Process
            </button>
            <button
              onClick={() => setIsBypassMode(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${isBypassMode ? 'bg-[#333] text-white' : 'text-[#888] hover:text-white hover:bg-[#222]'}`}
            >
              <FastForward size={16} /> Fast-Track (Direct Entry)
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-10">
        <AnimatePresence mode="wait">

          {isBypassMode && currentStep < 4 && (
            <motion.div key="bypass-mode" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-3xl mx-auto w-full">
              <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-2">Fast-Track Your Project</h2>
                <p className="text-[#888] mb-6 leading-relaxed">
                  Already have a clear research topic, problem statement, or instructions? Paste it below. The AI will parse your input, structure it into the Phase 1 format, and seed your project's knowledge graph automatically.
                </p>
                <Textarea
                  placeholder="Paste your abstract, assignment instructions, or raw research idea here..."
                  className="bg-[#0d0d0d] border-[#333] text-white min-h-[250px] mb-6 focus:border-orange-500/50 p-4"
                  value={customIdea}
                  onChange={(e) => setCustomIdea(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleBypassSubmit}
                    disabled={!customIdea.trim() || isSubmittingBypass}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-xl"
                  >
                    {isSubmittingBypass ? <Loader2 size={20} className="animate-spin mr-2" /> : <FastForward size={20} className="mr-2" />}
                    Initialize Project
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {!isBypassMode && currentStep === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ProblemGenerator projectId={projectId} onProblemSelected={(p) => { setProblem(p); setCurrentStep(1); }} />
            </motion.div>
          )}

          {!isBypassMode && currentStep === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <QuestionValidator
                projectId={projectId}
                problemContext={problem}
                onQuestionValidated={(q) => { setQuestionData(q); setCurrentStep(2); }}
              />
            </motion.div>
          )}

          {!isBypassMode && currentStep === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ScopeBuilder
                projectId={projectId}
                problemContext={problem}
                questionContext={questionData}
                onScopeFinalized={(s) => { setScope(s); setCurrentStep(3); }}
              />
            </motion.div>
          )}

          {!isBypassMode && currentStep === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <SmartBuilder
                projectId={projectId}
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
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto text-center py-10 w-full">
              <div className="w-20 h-20 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Network size={32} className="text-green-400" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Phase 1 Complete!</h1>
              <p className="text-lg text-[#a0aec0] mb-8 leading-relaxed max-w-2xl mx-auto">
                {finalResult.ai_summary}
              </p>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 md:p-8 flex flex-col gap-6 text-left mb-8 w-full shadow-xl">
                <div className="flex items-center justify-between border-b border-[#333] pb-3">
                  <h3 className="text-white font-semibold text-xl flex items-center gap-2">
                    <Check size={20} className="text-green-500" />
                    Saved Phase 1 Data
                  </h3>
                  {!isEditingData ? (
                    <Button onClick={handleEditClick} variant="outline" size="sm" className="bg-transparent border-[#333] text-white hover:bg-[#222]">
                      <Edit2 size={14} className="mr-2" /> Edit Details
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => setIsEditingData(false)} variant="outline" size="sm" className="bg-transparent border-[#333] text-white hover:bg-[#222]">
                        <CloseIcon size={14} className="mr-2" /> Cancel
                      </Button>
                      <Button onClick={handleSaveChanges} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Save size={14} className="mr-2" /> Save Changes
                      </Button>
                    </div>
                  )}
                </div>

                {problem && (
                  <div>
                    <h4 className="text-orange-400 font-medium mb-2 text-sm uppercase tracking-wider">Problem Statement</h4>
                    {isEditingData ? (
                      <Textarea value={editForm.problem} onChange={e => setEditForm({ ...editForm, problem: e.target.value })} className="bg-[#0d0d0d] border-[#333] text-white min-h-[100px]" />
                    ) : (
                      <p className="text-[#d4d4d4] text-sm leading-relaxed bg-[#0d0d0d] p-4 rounded-xl border border-[#222]">
                        {problem.statement || problem}
                      </p>
                    )}
                  </div>
                )}

                {questionData && (
                  <div>
                    <h4 className="text-blue-400 font-medium mb-2 text-sm uppercase tracking-wider">Research Question</h4>
                    {isEditingData ? (
                      <Textarea value={editForm.question} onChange={e => setEditForm({ ...editForm, question: e.target.value })} className="bg-[#0d0d0d] border-[#333] text-white" />
                    ) : (
                      <p className="text-[#d4d4d4] text-sm leading-relaxed bg-[#0d0d0d] p-4 rounded-xl border border-[#222]">
                        {questionData.version || questionData.question || questionData}
                      </p>
                    )}
                  </div>
                )}

                {scope && (
                  <div>
                    <h4 className="text-purple-400 font-medium mb-2 text-sm uppercase tracking-wider">Scope Boundaries</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#222] flex flex-col">
                        <strong className="text-white text-sm block mb-2">Inclusions (one per line)</strong>
                        {isEditingData ? (
                          <Textarea value={editForm.inclusions} onChange={e => setEditForm({ ...editForm, inclusions: e.target.value })} className="bg-[#1a1a1a] border-[#333] text-white flex-1 min-h-[100px]" />
                        ) : (
                          <ul className="list-disc pl-4 text-sm text-[#a0aec0] space-y-1">
                            {scope.inclusions?.map((inc: any, i: number) => (
                              <li key={i}>{inc.item || inc}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#222] flex flex-col">
                        <strong className="text-white text-sm block mb-2">Exclusions (one per line)</strong>
                        {isEditingData ? (
                          <Textarea value={editForm.exclusions} onChange={e => setEditForm({ ...editForm, exclusions: e.target.value })} className="bg-[#1a1a1a] border-[#333] text-white flex-1 min-h-[100px]" />
                        ) : (
                          <ul className="list-disc pl-4 text-sm text-[#a0aec0] space-y-1">
                            {scope.exclusions?.map((exc: any, i: number) => (
                              <li key={i}>{exc.item || exc}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {objectives && (
                  <div>
                    <h4 className="text-emerald-400 font-medium mb-2 text-sm uppercase tracking-wider">SMART Objectives</h4>
                    {isEditingData ? (
                      <Textarea value={editForm.objectives} onChange={e => setEditForm({ ...editForm, objectives: e.target.value })} className="bg-[#0d0d0d] border-[#333] text-white min-h-[150px]" placeholder="Separate objectives with a blank line" />
                    ) : (
                      <ul className="space-y-3">
                        {Array.isArray(objectives) ? objectives.map((obj: any, i: number) => (
                          <li key={i} className="bg-[#0d0d0d] p-4 rounded-xl border border-[#222] text-sm text-[#d4d4d4]">
                            <strong className="text-white block mb-1">Objective {i + 1}</strong>
                            {obj.objective || obj.smart_objective || obj}
                          </li>
                        )) : (
                          <li className="bg-[#0d0d0d] p-4 rounded-xl border border-[#222] text-sm text-[#d4d4d4]">
                            <strong className="text-white block mb-1">Objective 1</strong>
                            {objectives.smart_objective || objectives.objective || (typeof objectives === "string" ? objectives : JSON.stringify(objectives))}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {!isEditingData && (
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => {
                      setCurrentStep(0);
                      setFinalResult(null);
                    }}
                    variant="outline"
                    className="bg-transparent border-[#333] hover:bg-[#1a1a1a] text-white px-8 py-6 text-lg rounded-xl"
                  >
                    Start AI Wizard Again
                  </Button>
                  <Button
                    onClick={onProceedToPhase2}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-xl"
                  >
                    Proceed to Phase 2: Literature Review <ChevronRight className="ml-2" />
                  </Button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
