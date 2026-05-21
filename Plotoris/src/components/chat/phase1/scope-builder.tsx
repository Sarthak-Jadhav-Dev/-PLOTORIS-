"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, X, ArrowRight, RefreshCw, Target, ShieldAlert, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ScopeBuilderProps {
  projectId?: string;
  problemContext: any;
  questionContext: any;
  onScopeFinalized: (data: any) => void;
}

export default function ScopeBuilder({ projectId, problemContext, questionContext, onScopeFinalized }: ScopeBuilderProps) {
  const [inclusions, setInclusions] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [population, setPopulation] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  
  const [inputs, setInputs] = useState({ inc: "", exc: "", pop: "", con: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setAiSuggestions(null);
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

      const res = await fetch("/api/phase1/scope-suggestions", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          project_id: projectId,
          problem: problemContext?.statement, 
          question: questionContext?.validation_result?.improved_versions?.[0]?.version || questionContext?.question,
          domain: "Computer Science" 
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiSuggestions({ error: data.error || "Failed to generate suggestions. Please check your API key configuration." });
      } else {
        setAiSuggestions(data);
      }
    } catch (err: any) {
      console.error(err);
      setAiSuggestions({ error: err.message || "Failed to connect to the server." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = (type: 'inc'|'exc'|'pop'|'con', value: string) => {
    if (!value.trim()) return;
    if (type === 'inc') setInclusions([...inclusions, value]);
    if (type === 'exc') setExclusions([...exclusions, value]);
    if (type === 'pop') setPopulation([...population, value]);
    if (type === 'con') setConstraints([...constraints, value]);
    setInputs({ ...inputs, [type]: "" });
  };

  const handleRemove = (type: 'inc'|'exc'|'pop'|'con', index: number) => {
    if (type === 'inc') setInclusions(inclusions.filter((_, i) => i !== index));
    if (type === 'exc') setExclusions(exclusions.filter((_, i) => i !== index));
    if (type === 'pop') setPopulation(population.filter((_, i) => i !== index));
    if (type === 'con') setConstraints(constraints.filter((_, i) => i !== index));
  };

  const Quadrant = ({ title, icon: Icon, colorClass, borderClass, bgClass, items, type, inputVal }: any) => (
    <div className={`flex flex-col bg-[#1a1a1a] rounded-2xl border ${borderClass} overflow-hidden shadow-lg`}>
      <div className={`p-4 border-b ${borderClass} ${bgClass} flex items-center justify-between`}>
        <h3 className={`font-semibold flex items-center gap-2 ${colorClass}`}>
          <Icon size={18} />
          {title}
        </h3>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex gap-2 mb-2">
          <Input 
            value={inputVal}
            onChange={(e) => setInputs({ ...inputs, [type]: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd(type, inputVal)}
            placeholder="Add item..."
            className="bg-[#0d0d0d] border-[#333] text-white h-8 text-xs"
          />
          <Button size="icon" className="h-8 w-8 bg-[#222] hover:bg-[#333] text-white shrink-0" onClick={() => handleAdd(type, inputVal)}>
            <Plus size={14} />
          </Button>
        </div>
        
        <div className="space-y-2 overflow-y-auto max-h-[200px] pr-1">
          <AnimatePresence>
            {items.map((item: string, i: number) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#0d0d0d] border border-[#333] rounded-lg p-2.5 flex items-start justify-between gap-2 group"
              >
                <span className="text-sm text-[#d4d4d4] leading-snug">{item}</span>
                <button onClick={() => handleRemove(type, i)} className="text-[#666] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Scope Boundary Builder</h2>
          <p className="text-sm text-[#888]">Define exactly what is and isn't included in your research to prevent scope creep.</p>
        </div>
        <Button 
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
        >
          {isLoading ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
          Get AI Suggestions
        </Button>
      </div>

      <AnimatePresence>
        {aiSuggestions && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            className={`border rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between ${
              aiSuggestions.error 
                ? "bg-red-500/10 border-red-500/20 text-red-200" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-200"
            }`}
          >
            {aiSuggestions.error ? (
              <div className="flex-1">
                <p className="text-sm font-semibold mb-1 text-red-200">Failed to Generate Suggestions</p>
                <p className="text-xs text-red-400/80">{aiSuggestions.error}</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-indigo-200 mb-1"><strong>AI Suggestions Generated!</strong> Review the suggestions below and add them to your scope boundaries.</p>
                  <p className="text-xs text-indigo-400/80 italic">Tip: You don't need to accept all suggestions, pick what fits your resources.</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="bg-[#1a1a1a] border-[#333] text-white whitespace-nowrap" 
                  onClick={() => {
                    const newInclusions = Array.isArray(aiSuggestions.inclusions)
                      ? aiSuggestions.inclusions.map((i: any) => typeof i === 'string' ? i : (i?.item || '')).filter(Boolean)
                      : [];
                    const newExclusions = Array.isArray(aiSuggestions.exclusions)
                      ? aiSuggestions.exclusions.map((e: any) => typeof e === 'string' ? e : (e?.item || '')).filter(Boolean)
                      : [];
                    
                    const targetPop = aiSuggestions.population?.target ? [aiSuggestions.population.target] : [];
                    const targetChars = Array.isArray(aiSuggestions.population?.characteristics) ? aiSuggestions.population.characteristics : [];
                    const newPopulation = [...targetPop, ...targetChars].filter(Boolean);
                    
                    const timeRange = aiSuggestions.constraints?.time_range ? [aiSuggestions.constraints.time_range] : [];
                    const resources = Array.isArray(aiSuggestions.constraints?.resources) ? aiSuggestions.constraints.resources : [];
                    const ethical = Array.isArray(aiSuggestions.constraints?.ethical) ? aiSuggestions.constraints.ethical : [];
                    const newConstraints = [...timeRange, ...resources, ...ethical].filter(Boolean);

                    setInclusions([...inclusions, ...newInclusions]);
                    setExclusions([...exclusions, ...newExclusions]);
                    setPopulation([...population, ...newPopulation]);
                    setConstraints([...constraints, ...newConstraints]);
                    setAiSuggestions(null);
                  }}
                >
                  Accept All
                </Button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Quadrant 
          title="Inclusions" icon={Target} 
          colorClass="text-green-400" borderClass="border-green-500/20" bgClass="bg-green-500/5"
          items={inclusions} type="inc" inputVal={inputs.inc}
        />
        <Quadrant 
          title="Exclusions" icon={ShieldAlert} 
          colorClass="text-red-400" borderClass="border-red-500/20" bgClass="bg-red-500/5"
          items={exclusions} type="exc" inputVal={inputs.exc}
        />
        <Quadrant 
          title="Population / Sample" icon={Users} 
          colorClass="text-blue-400" borderClass="border-blue-500/20" bgClass="bg-blue-500/5"
          items={population} type="pop" inputVal={inputs.pop}
        />
        <Quadrant 
          title="Constraints & Ethics" icon={Clock} 
          colorClass="text-amber-400" borderClass="border-amber-500/20" bgClass="bg-amber-500/5"
          items={constraints} type="con" inputVal={inputs.con}
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => onScopeFinalized({ inclusions, exclusions, population, constraints })}
          disabled={inclusions.length === 0 && exclusions.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          Lock Scope Boundaries <ArrowRight size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}
