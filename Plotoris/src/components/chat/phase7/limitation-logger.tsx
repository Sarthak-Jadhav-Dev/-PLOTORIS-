"use client";

import { useState } from "react";
import { AlertOctagon, Plus, Sparkles, Loader2, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type Severity = "Low" | "Moderate" | "High" | "Critical";

interface Limitation {
  id: string;
  title: string;
  category: string;
  description: string;
  severity: Severity;
  impact: string;
  mitigation: string;
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string }> = {
  "Low": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  "Moderate": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  "High": { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  "Critical": { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30" },
};

const CATEGORIES = ["Sample Size", "Sampling Bias", "Measurement Error", "Confounding Variables", "Missing Data", "Generalizability", "Time Constraints", "Instrument Reliability", "Ethical Constraints"];

const DEFAULT_LIMITATIONS: Limitation[] = [
  { id: "l1", title: "Non-Random Sampling", category: "Sampling Bias", severity: "High", description: "Purposive sampling was used, which may not represent the broader population of undergraduate students.", impact: "Limits the external validity and generalizability of findings.", mitigation: "Future studies should employ stratified random sampling across multiple institutions." },
  { id: "l2", title: "Self-Reported Data", category: "Measurement Error", severity: "Moderate", description: "Social media usage and GPA were self-reported, introducing potential recall and social desirability bias.", impact: "May overestimate or underestimate the true relationship between variables.", mitigation: "Supplement with device screen time logs and official academic records." },
];

export default function LimitationLogger() {
  const [limitations, setLimitations] = useState<Limitation[]>(DEFAULT_LIMITATIONS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("l1");
  const [newLim, setNewLim] = useState<Partial<Limitation>>({ severity: "Moderate", category: "Sample Size" });

  const handleAISuggest = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/phase7/suggest-limitations", { method: "POST" });
      const data = await res.json();
      if (data.limitations) setLimitations(prev => [...prev, ...data.limitations]);
    } catch {}
    finally { setIsGenerating(false); }
  };

  const addLimitation = () => {
    if (!newLim.title || !newLim.description) return;
    setLimitations([...limitations, { id: `l${Date.now()}`, title: newLim.title!, category: newLim.category || "Sample Size", severity: newLim.severity as Severity || "Moderate", description: newLim.description!, impact: newLim.impact || "", mitigation: newLim.mitigation || "" }]);
    setNewLim({ severity: "Moderate", category: "Sample Size" });
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <AlertOctagon size={20} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Limitation Logger</h2>
              <p className="text-xs text-[#888]">Document, classify, and severity-score all study limitations.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAISuggest} disabled={isGenerating} className="border-[#444] text-white hover:bg-[#222] text-xs">
              {isGenerating ? <><Loader2 size={12} className="mr-1 animate-spin" />Suggesting...</> : <><Sparkles size={12} className="mr-1 text-rose-400" />AI Suggest</>}
            </Button>
            <Button onClick={() => setShowForm(!showForm)} className="bg-rose-700 hover:bg-rose-800 text-white text-xs">
              <Plus size={12} className="mr-1" /> Add
            </Button>
          </div>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-6">
              <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-5 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[10px] text-[#888] uppercase font-bold block mb-1">Title</label>
                    <input value={newLim.title || ""} onChange={e => setNewLim({...newLim, title: e.target.value})}
                      placeholder="e.g., Small Sample Size" className="w-full bg-[#111] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-rose-500" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888] uppercase font-bold block mb-1">Category</label>
                    <select value={newLim.category} onChange={e => setNewLim({...newLim, category: e.target.value})}
                      className="w-full bg-[#111] border border-[#333] text-white text-sm rounded px-3 py-2">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-[#888] uppercase font-bold block mb-1">Description</label>
                  <textarea value={newLim.description || ""} onChange={e => setNewLim({...newLim, description: e.target.value})} rows={2}
                    className="w-full bg-[#111] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-rose-500 resize-none" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[#888] uppercase font-bold block mb-2">Severity</label>
                    <div className="flex gap-2">
                      {(["Low", "Moderate", "High", "Critical"] as Severity[]).map(s => (
                        <button key={s} onClick={() => setNewLim({...newLim, severity: s})}
                          className={`flex-1 py-1 rounded border text-[10px] font-bold uppercase transition-all ${newLim.severity === s ? `${SEVERITY_CONFIG[s].bg} ${SEVERITY_CONFIG[s].color}` : "bg-[#111] border-[#333] text-[#666]"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-[#888] uppercase font-bold block mb-1">Mitigation Strategy</label>
                    <input value={newLim.mitigation || ""} onChange={e => setNewLim({...newLim, mitigation: e.target.value})}
                      placeholder="Future research should..." className="w-full bg-[#111] border border-[#333] text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-rose-500" />
                  </div>
                </div>
                <Button onClick={addLimitation} size="sm" className="bg-rose-700 hover:bg-rose-800 text-white">Save Limitation</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Limitations List */}
        <div className="space-y-3">
          {limitations.map(lim => {
            const sev = SEVERITY_CONFIG[lim.severity];
            return (
              <div key={lim.id} className={`border rounded-xl overflow-hidden transition-all ${expanded === lim.id ? sev.bg : "bg-[#0d0d0d] border-[#333]"}`}>
                <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpanded(expanded === lim.id ? null : lim.id)}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${sev.bg} ${sev.color}`}>{lim.severity}</span>
                    <span className="text-white font-semibold text-sm">{lim.title}</span>
                    <span className="text-[10px] text-[#666] bg-[#222] px-2 py-0.5 rounded">{lim.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); setLimitations(limitations.filter(l => l.id !== lim.id)); }}>
                      <Trash2 size={14} className="text-[#555] hover:text-rose-500" />
                    </button>
                    <ChevronDown size={14} className={`text-[#666] transition-transform ${expanded === lim.id ? "rotate-180" : ""}`} />
                  </div>
                </div>
                {expanded === lim.id && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[#333]/50 pt-3">
                    <div><p className="text-[10px] text-[#888] uppercase font-bold mb-1">Description</p><p className="text-sm text-[#d4d4d4]">{lim.description}</p></div>
                    {lim.impact && <div><p className="text-[10px] text-[#888] uppercase font-bold mb-1">Impact on Findings</p><p className="text-sm text-[#d4d4d4]">{lim.impact}</p></div>}
                    {lim.mitigation && <div><p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Mitigation Strategy</p><p className="text-sm text-[#d4d4d4]">{lim.mitigation}</p></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
