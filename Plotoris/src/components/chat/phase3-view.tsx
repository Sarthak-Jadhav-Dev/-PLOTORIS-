"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, Activity, CheckCircle, Network, SearchCode, GitCompare, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import HypothesisBuilder from "@/components/chat/phase3/hypothesis-builder";
import VariableMapper from "@/components/chat/phase3/variable-mapper";
import TestabilityScorer from "@/components/chat/phase3/testability-scorer";
import ValidationPanel from "@/components/chat/phase3/validation-panel";

export default function PhaseThreeView({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "builder" | "mapper" | "scorer" | "validation" | "voting">("dashboard");

  // State to hold the current hypothesis draft
  const [hypothesisDraft, setHypothesisDraft] = useState<any>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans relative">
      
      {/* Top Banner: Market Gap Alert */}
      <div className="absolute top-0 left-0 right-0 bg-rose-500/10 border-b border-rose-500/20 px-4 py-2 flex items-center justify-center gap-2">
        <Activity size={14} className="text-rose-400" />
        <span className="text-xs font-semibold text-rose-300">MARKET GAP ADDRESSED: No dedicated hypothesis engineering and validation tool exists. Plotoris fills this void.</span>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 mt-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#fce7f3] text-[#db2777] hover:bg-[#fce7f3] font-medium rounded-full px-3 py-0.5 border border-[#fbcfe8]">
                Phase 3
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Hypothesis Formulation & Validation
              </h1>
            </div>
            <p className="text-[#888] text-sm">
              Engineer rigorous hypotheses, map variables visually, and validate against the literature corpus.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-[#111] p-1 rounded-xl border border-[#333]">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "builder", label: "Builder" },
              { id: "mapper", label: "Mapper" },
              { id: "scorer", label: "Testability" },
              { id: "validation", label: "Validation" }
            ].map((tab) => (
              <Button 
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`rounded-lg px-4 ${activeTab === tab.id ? 'bg-[#222] text-white shadow-sm' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Vars Mapped", value: "0", icon: Network, color: "text-blue-400" },
                  { label: "Hypotheses Drafted", value: hypothesisDraft ? "1" : "0", icon: Lightbulb, color: "text-amber-400" },
                  { label: "Testability Score", value: "--/100", icon: CheckCircle, color: "text-emerald-400" },
                  { label: "Literature Validation", value: "Pending", icon: SearchCode, color: "text-indigo-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-xs text-[#888] uppercase tracking-wider font-semibold">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => setActiveTab("builder")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-amber-500/50 rounded-2xl p-6 cursor-pointer group">
                  <Lightbulb size={24} className="text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">1. Hypothesis Builder</h3>
                  <p className="text-xs text-[#888]">Define IV/DV and generate formal statements.</p>
                </div>
                
                <div onClick={() => setActiveTab("mapper")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-blue-500/50 rounded-2xl p-6 cursor-pointer group">
                  <Network size={24} className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">2. Variable Mapper</h3>
                  <p className="text-xs text-[#888]">Visually map variable relationships (React Flow).</p>
                </div>

                <div onClick={() => setActiveTab("scorer")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer group">
                  <GitCompare size={24} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">3. Testability Scorer</h3>
                  <p className="text-xs text-[#888]">Score falsifiability, clarity, and novelty.</p>
                </div>

                <div onClick={() => setActiveTab("validation")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-indigo-500/50 rounded-2xl p-6 cursor-pointer group">
                  <SearchCode size={24} className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">4. AI Validation</h3>
                  <p className="text-xs text-[#888]">Cross-check against literature corpus.</p>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === "builder" && (
            <motion.div key="builder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HypothesisBuilder projectId={projectId} onHypothesisGenerated={(data) => {
                setHypothesisDraft(data);
                setActiveTab("scorer");
              }} />
            </motion.div>
          )}

          {activeTab === "mapper" && (
            <motion.div key="mapper" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="h-[600px] bg-[#111] rounded-2xl border border-[#333] overflow-hidden">
              <VariableMapper projectId={projectId} hypothesis={hypothesisDraft} />
            </motion.div>
          )}

          {activeTab === "scorer" && (
            <motion.div key="scorer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <TestabilityScorer projectId={projectId} hypothesis={hypothesisDraft} />
            </motion.div>
          )}

          {activeTab === "validation" && (
            <motion.div key="validation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ValidationPanel projectId={projectId} hypothesis={hypothesisDraft} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
