"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Problem {
  id: string;
  statement: string;
  novelty_score: number;
  feasibility_score: number;
  rationale: string;
  suggested_question: string;
  domain_tags: string[];
}

interface ProblemGeneratorProps {
  onProblemSelected: (problem: Problem) => void;
}

export default function ProblemGenerator({ onProblemSelected }: ProblemGeneratorProps) {
  const [domain, setDomain] = useState("");
  const [context, setContext] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setProblems([]);
    
    try {
      const res = await fetch("/api/phase1/generate-problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, context })
      });
      const data = await res.json();
      if (data.problems) {
        setProblems(data.problems);
        setAnalysis(data.domain_analysis);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400 bg-green-400/10 border-green-400/20";
    if (score >= 5) return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto w-full">
      {/* Input Section */}
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Sparkles size={16} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Define Research Domain</h2>
            <p className="text-sm text-[#888]">Describe your area of interest to generate novel problem statements.</p>
          </div>
        </div>

        <Textarea 
          placeholder="e.g., Application of machine learning in adolescent psychology..."
          className="bg-[#0d0d0d] border-[#333] text-white min-h-[100px] mb-4 focus:border-orange-500/50"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />

        <div className="mb-4">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs text-[#666] hover:text-[#888] transition-colors font-medium"
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Advanced Options
          </button>
          
          <AnimatePresence>
            {showAdvanced && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="space-y-3 p-4 bg-[#0d0d0d] rounded-xl border border-[#222]">
                  <div>
                    <label className="text-xs text-[#888] mb-1.5 block">Additional Context or Constraints</label>
                    <Input 
                      placeholder="e.g., Must rely on open-source datasets, focused on clinical settings..."
                      className="bg-[#1a1a1a] border-[#333] text-sm text-white h-9"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-[#888] mb-1.5 block">Research Level</label>
                      <select className="w-full bg-[#1a1a1a] border border-[#333] rounded-md h-9 text-sm text-white px-3 focus:outline-none focus:border-orange-500/50">
                        <option>PhD / Postdoc</option>
                        <option>Masters</option>
                        <option>Industry Applied</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-[#888] mb-1.5 block">Time Horizon</label>
                      <select className="w-full bg-[#1a1a1a] border border-[#333] rounded-md h-9 text-sm text-white px-3 focus:outline-none focus:border-orange-500/50">
                        <option>6-12 Months</option>
                        <option>1-2 Years</option>
                        <option>2+ Years</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleGenerate} 
            disabled={!domain.trim() || isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Analyzing Landscape...
              </>
            ) : (
              <>
                <Beaker size={16} className="mr-2" />
                Generate Problems
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      <AnimatePresence>
        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4"
          >
            <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-2">Domain Analysis</h4>
            <p className="text-[#a0aec0] text-sm leading-relaxed">{analysis}</p>
          </motion.div>
        )}

        {problems.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {problems.map((prob, i) => (
              <motion.div 
                key={prob.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 hover:border-orange-500/30 transition-colors flex flex-col"
              >
                <div className="flex gap-2 mb-3">
                  <Badge variant="outline" className={getScoreColor(prob.novelty_score)}>
                    Novelty: {prob.novelty_score}/10
                  </Badge>
                  <Badge variant="outline" className={getScoreColor(prob.feasibility_score)}>
                    Feasibility: {prob.feasibility_score}/10
                  </Badge>
                </div>
                
                <h3 className="text-white font-semibold text-lg leading-snug mb-3">
                  {prob.statement}
                </h3>

                <div className="mt-auto pt-4 space-y-4">
                  <div>
                    <button 
                      onClick={() => setExpandedId(expandedId === prob.id ? null : prob.id)}
                      className="text-xs text-[#888] hover:text-white transition-colors flex items-center gap-1"
                    >
                      {expandedId === prob.id ? "Hide rationale" : "Show rationale"}
                      {expandedId === prob.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    
                    <AnimatePresence>
                      {expandedId === prob.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-[#a0aec0] mt-2 mb-3 leading-relaxed">
                            {prob.rationale}
                          </p>
                          <div className="bg-[#0d0d0d] rounded-lg p-3 border border-[#222]">
                            <span className="text-[10px] text-[#666] uppercase font-bold tracking-wider mb-1 block">Suggested Question</span>
                            <p className="text-xs text-[#d4d4d4] italic">{prob.suggested_question}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button 
                    className="w-full bg-[#222] hover:bg-orange-500 hover:text-white text-[#d4d4d4] transition-colors"
                    onClick={() => onProblemSelected(prob)}
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Select this problem
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
