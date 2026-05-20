"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, RefreshCw, AlertTriangle, Info, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface QuestionValidatorProps {
  projectId?: string;
  problemContext: any;
  onQuestionValidated: (data: any) => void;
}

export default function QuestionValidator({ projectId, problemContext, onQuestionValidated }: QuestionValidatorProps) {
  const [question, setQuestion] = useState(problemContext?.suggested_question || "");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleValidate = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setResult(null);
    
    try {
      const geminiKey = projectId ? localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "" : "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase1/validate-question", {
        method: "POST",
        headers,
        body: JSON.stringify({ research_question: question, problem_context: problemContext?.statement, project_id: projectId })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400 bg-green-400/10 border-green-400/20";
    if (score >= 60) return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  const getBarColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 5) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Input Section */}
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <ShieldCheck size={16} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Validate Research Question</h2>
            <p className="text-sm text-[#888]">Evaluate your question for clarity, specificity, and testability.</p>
          </div>
        </div>

        {problemContext && (
          <div className="mb-4 p-3 bg-[#0d0d0d] rounded-lg border border-[#222]">
            <span className="text-[10px] text-[#666] uppercase font-bold tracking-wider mb-1 block">Selected Problem</span>
            <p className="text-xs text-[#a0aec0]">{problemContext.statement}</p>
          </div>
        )}

        <Textarea 
          placeholder="Enter your specific research question here..."
          className="bg-[#0d0d0d] border-[#333] text-white min-h-[100px] mb-4 focus:border-blue-500/50"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />

        <div className="flex justify-end">
          <Button 
            onClick={handleValidate} 
            disabled={!question.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Analyzing Question...
              </>
            ) : (
              <>
                <ShieldCheck size={16} className="mr-2" />
                Validate Question
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Score Card */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6 flex flex-col md:flex-row gap-8">
              <div className="flex flex-col items-center justify-center min-w-[150px]">
                <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-2 ${
                  result.overall_score >= 80 ? 'border-green-500' : result.overall_score >= 60 ? 'border-orange-500' : 'border-red-500'
                }`}>
                  <span className="text-4xl font-bold text-white">{result.overall_score}</span>
                </div>
                <Badge variant="outline" className={getScoreColor(result.overall_score)}>
                  Grade: {result.grade}
                </Badge>
              </div>
              
              <div className="flex-1 space-y-4 justify-center flex flex-col">
                {Object.entries(result.dimension_scores).map(([dim, score]: [string, any]) => (
                  <div key={dim} className="flex items-center gap-4">
                    <span className="w-24 text-sm text-[#888] capitalize">{dim}</span>
                    <div className="flex-1 h-2 bg-[#222] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score * 10}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full ${getBarColor(score)}`}
                      />
                    </div>
                    <span className="w-8 text-right text-sm text-white font-medium">{score}/10</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Issues Panel */}
            {result.issues.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />
                  Identified Issues ({result.issues.length})
                </h3>
                <div className="space-y-3">
                  {result.issues.map((issue: any) => (
                    <div key={issue.id} className="bg-[#0d0d0d] border border-[#222] p-4 rounded-xl flex gap-3">
                      <div className="mt-0.5">
                        {issue.severity === "high" ? <AlertTriangle size={16} className="text-red-500" /> : <Info size={16} className="text-blue-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] uppercase bg-[#222] border-[#333] text-[#888]">
                            {issue.dimension}
                          </Badge>
                          {issue.severity === "high" && <span className="text-[10px] text-red-500 font-bold uppercase">High Severity</span>}
                        </div>
                        <p className="text-sm text-[#d4d4d4] mb-2">{issue.issue}</p>
                        <p className="text-xs text-[#888] italic">Suggestion: {issue.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improved Versions */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Suggested Improvements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.improved_versions.map((ver: any, i: number) => (
                  <div key={i} className="bg-[#0d0d0d] border border-[#222] p-5 rounded-xl flex flex-col">
                    <p className="text-white font-medium text-sm leading-relaxed mb-4">"{ver.version}"</p>
                    <div className="mt-auto">
                      <p className="text-[10px] text-[#666] uppercase font-bold tracking-wider mb-1">Changes made</p>
                      <p className="text-xs text-[#a0aec0] mb-4">{ver.changes_made}</p>
                      <Button 
                        className="w-full bg-[#222] hover:bg-blue-600 hover:text-white text-[#d4d4d4] transition-colors"
                        onClick={() => {
                          setQuestion(ver.version);
                          setResult(null); // Clear to re-validate or proceed
                        }}
                      >
                        <CheckCircle2 size={16} className="mr-2" />
                        Use this version
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => onQuestionValidated({ question, validation_result: result })}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                Lock Question & Proceed <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
