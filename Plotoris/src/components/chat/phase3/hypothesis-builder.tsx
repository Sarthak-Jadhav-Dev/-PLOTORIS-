"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lightbulb, CheckCircle2, Search, Network, Save, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExtractedVariable {
  id?: string;
  iv: string;
  dv: string;
  relationship: string;
  citation: string;
  validation: string;
}

interface HypothesisBuilderProps {
  projectId: string;
  savedVariables: ExtractedVariable[];
  onSavedVariablesUpdate: () => void;
  onHypothesisGenerated: (data: any) => void;
}

export default function HypothesisBuilder({ projectId, savedVariables, onSavedVariablesUpdate, onHypothesisGenerated }: HypothesisBuilderProps) {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  
  // Auto-Scanner State
  const [extractedVariables, setExtractedVariables] = useState<ExtractedVariable[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  // Manual Input State
  const [manualIv, setManualIv] = useState("");
  const [manualDv, setManualDv] = useState("");
  const [manualRel, setManualRel] = useState("Positive");
  const [manualValidation, setManualValidation] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Formulation State
  const [selectedSavedIds, setSelectedSavedIds] = useState<Set<string>>(new Set());
  const [isFormulating, setIsFormulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanBucket = async () => {
    setIsScanning(true);
    setError(null);
    setExtractedVariables([]);

    try {
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }

      const res = await fetch("/api/phase3/extract-variables", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      if (!data.variables || data.variables.length === 0) throw new Error("No variables extracted. Try adding more papers to your Knowledge Bucket.");

      setExtractedVariables(data.variables);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to scan bucket.");
    } finally {
      setIsScanning(false);
    }
  };

  const saveVariable = async (v: ExtractedVariable, uniqueId: string) => {
    setSavingIds(prev => new Set(prev).add(uniqueId));
    try {
      const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
      const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase3/saved-variables", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId, ...v })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onSavedVariablesUpdate();
    } catch (err: any) {
      console.error("Save variable error", err);
    } finally {
      setSavingIds(prev => {
        const next = new Set(prev);
        next.delete(uniqueId);
        return next;
      });
    }
  };

  const saveManualVariable = async () => {
    if (!manualIv || !manualDv) return;
    setIsSavingManual(true);
    try {
      const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
      const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase3/saved-variables", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          project_id: projectId, 
          iv: manualIv, 
          dv: manualDv, 
          relationship: manualRel,
          citation: "Custom Input",
          validation: manualValidation || "Manually defined variable."
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      onSavedVariablesUpdate();
      setManualIv("");
      setManualDv("");
      setManualValidation("");
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSavingManual(false);
    }
  };

  const deleteSavedVariable = async (id: string) => {
    try {
      const res = await fetch(`/api/phase3/saved-variables?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onSavedVariablesUpdate();
        setSelectedSavedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectSaved = (id: string) => {
    const newSelected = new Set(selectedSavedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedSavedIds(newSelected);
  };

  const formulateHypothesis = async () => {
    if (selectedSavedIds.size === 0) return;
    setIsFormulating(true);
    setError(null);

    const selectedVars = savedVariables.filter(v => v.id && selectedSavedIds.has(v.id));
    const combinedIv = selectedVars.map(v => v.iv).join(", ");
    const combinedDv = selectedVars.map(v => v.dv).join(", ");
    const combinedRel = selectedVars.map(v => v.relationship).join(", ");

    try {
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase3/generate-hypothesis", {
        method: "POST",
        headers,
        body: JSON.stringify({ iv: combinedIv, dv: combinedDv, relationship: combinedRel, project_id: projectId })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      onHypothesisGenerated(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to formulate hypothesis.");
    } finally {
      setIsFormulating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      
      {/* Top Section: Variable Entry */}
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Lightbulb size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Variable Identification</h2>
            <p className="text-sm text-[#888]">Extract from literature or manually define variables.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-[#333] pb-4">
          <Button 
            variant="ghost" 
            onClick={() => setMode("auto")}
            className={`rounded-full px-6 ${mode === 'auto' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300' : 'text-[#888] hover:text-white'}`}
          >
            <Search size={16} className="mr-2" /> Auto-Scanner
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setMode("manual")}
            className={`rounded-full px-6 ${mode === 'manual' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 hover:text-amber-300' : 'text-[#888] hover:text-white'}`}
          >
            <Plus size={16} className="mr-2" /> Custom Input
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 text-rose-400 text-sm border border-rose-500/20 rounded-xl mb-6">
            Error: {error}
          </div>
        )}

        {mode === "auto" && (
          <div className="space-y-6">
            <Button 
              onClick={scanBucket} 
              disabled={isScanning}
              className="bg-amber-600 hover:bg-amber-700 text-white w-full py-6 text-lg"
            >
              {isScanning ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : (
                <Search size={20} className="mr-2" />
              )}
              Scan Knowledge Bucket
            </Button>

            <AnimatePresence>
              {extractedVariables.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-white font-semibold text-sm mb-2">AI Extracted Variables</h3>
                  <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {extractedVariables.map((v, i) => {
                      const uniqueId = `ext_${i}`;
                      const isSaving = savingIds.has(uniqueId);
                      const isAlreadySaved = savedVariables.some(sv => sv.iv === v.iv && sv.dv === v.dv);
                      const relColor = 
                        v.relationship?.toLowerCase() === 'positive' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 
                        v.relationship?.toLowerCase() === 'negative' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' : 
                        'text-blue-400 bg-blue-400/10 border-blue-400/20';

                      return (
                        <div key={i} className="p-5 rounded-xl border bg-[#0d0d0d] border-[#333]">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-white font-semibold">{v.iv}</span>
                                <Network size={14} className="text-[#666]" />
                                <span className="text-white font-semibold">{v.dv}</span>
                              </div>
                              <span className="text-xs text-[#888]">Source: {v.citation}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${relColor}`}>
                                {v.relationship}
                              </span>
                              <Button 
                                size="sm" 
                                variant={isAlreadySaved ? "secondary" : "default"}
                                disabled={isAlreadySaved || isSaving}
                                onClick={() => saveVariable(v, uniqueId)}
                                className={isAlreadySaved ? "bg-[#222] text-[#888]" : "bg-amber-600 hover:bg-amber-700 text-white"}
                              >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : 
                                 isAlreadySaved ? <CheckCircle2 size={14} /> : <Save size={14} className="mr-1" />}
                                {isAlreadySaved ? 'Saved' : 'Save'}
                              </Button>
                            </div>
                          </div>
                          <div className="pl-2 border-l-2 border-[#333] ml-1">
                            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Validation</p>
                            <p className="text-sm text-[#ccc] leading-relaxed">{v.validation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {mode === "manual" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Independent Variable (IV)</label>
              <input 
                type="text" 
                placeholder="e.g., Social Media Usage"
                value={manualIv}
                onChange={(e) => setManualIv(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Dependent Variable (DV)</label>
              <input 
                type="text" 
                placeholder="e.g., Academic Performance"
                value={manualDv}
                onChange={(e) => setManualDv(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Expected Relationship</label>
              <div className="flex gap-4">
                {['Positive', 'Negative', 'Non-directional'].map((rel) => (
                  <button
                    key={rel}
                    onClick={() => setManualRel(rel)}
                    className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${
                      manualRel === rel ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-[#0d0d0d] border-[#333] text-[#888] hover:border-[#555]'
                    }`}
                  >
                    {rel}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#888] uppercase tracking-wider mb-2">Notes / Scientific Validation (Optional)</label>
              <textarea 
                placeholder="Why do you think this relationship exists?"
                value={manualValidation}
                onChange={(e) => setManualValidation(e.target.value)}
                rows={3}
                className="w-full bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={saveManualVariable} disabled={!manualIv || !manualDv || isSavingManual} className="bg-amber-600 hover:bg-amber-700 text-white">
                {isSavingManual ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                Save Custom Variable
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: My Saved Variables */}
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <Save size={20} className="text-blue-400" />
          My Saved Variables
          <span className="bg-[#222] text-[#888] text-xs px-2 py-1 rounded-full ml-2">{savedVariables.length}</span>
        </h3>

        {savedVariables.length === 0 ? (
          <div className="text-center py-12 text-[#888] border border-dashed border-[#333] rounded-xl">
            <p>No variables saved yet.</p>
            <p className="text-sm mt-1">Scan the bucket or add a custom variable to build your repository.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedVariables.map((v, i) => {
              const isSelected = v.id && selectedSavedIds.has(v.id);
              const relColor = 
                v.relationship?.toLowerCase() === 'positive' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 
                v.relationship?.toLowerCase() === 'negative' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' : 
                'text-blue-400 bg-blue-400/10 border-blue-400/20';

              return (
                <div 
                  key={v.id || i} 
                  onClick={() => v.id && toggleSelectSaved(v.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between ${
                    isSelected ? 'bg-[#1a1a1a] border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-[#0d0d0d] border-[#333] hover:border-[#555]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-[#666]'
                    }`}>
                      {isSelected && <CheckCircle2 size={14} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">{v.iv}</span>
                        <Network size={14} className="text-[#666]" />
                        <span className="text-white font-semibold">{v.dv}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${relColor} ml-2`}>
                          {v.relationship}
                        </span>
                      </div>
                      <p className="text-xs text-[#888] mb-2">Source: {v.citation}</p>
                      <p className="text-xs text-[#aaa] line-clamp-2">{v.validation}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (v.id) deleteSavedVariable(v.id); }}
                    className="w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-400 transition-colors flex-shrink-0"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-6 border-t border-[#333] mt-6">
          <Button 
            onClick={formulateHypothesis} 
            disabled={selectedSavedIds.size === 0 || isFormulating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg w-full md:w-auto"
          >
            {isFormulating ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Engineering Formal Hypothesis...
              </>
            ) : (
              <>
                Generate Hypothesis ({selectedSavedIds.size} Selected)
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
