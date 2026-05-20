"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, BarChart3, BookOpen, AlertOctagon, Users, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import ResultInterpreter from "@/components/chat/phase7/result-interpreter";
import HypothesisVerdictEngine from "@/components/chat/phase7/hypothesis-verdict-engine";
import LimitationLogger from "@/components/chat/phase7/limitation-logger";
import TeamInterpretationReview from "@/components/chat/phase7/team-interpretation-review";

type Tab = "dashboard" | "interpreter" | "verdict" | "limitations" | "review";

export default function PhaseSevenView() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "interpreter", label: "Result Interpreter" },
    { id: "verdict", label: "Verdict Engine" },
    { id: "limitations", label: "Limitations" },
    { id: "review", label: "Team Review" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans relative">

      {/* Top Banner */}
      <div className="absolute top-0 left-0 right-0 bg-violet-500/10 border-b border-violet-500/20 px-4 py-2 flex items-center justify-center gap-2">
        <Brain size={14} className="text-violet-400" />
        <span className="text-xs font-semibold text-violet-300">
          MARKET GAP ADDRESSED: Interpretation is entirely manual and disconnected from data. Plotoris automates it.
        </span>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 mt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ede9fe] font-medium rounded-full px-3 py-0.5 border border-[#ddd6fe]">
                Phase 7
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">Interpretation of Results</h1>
            </div>
            <p className="text-[#888] text-sm">
              Convert statistical outputs into publication-ready interpretations, issue verdicts, and document limitations.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#333]">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`rounded-lg px-4 whitespace-nowrap ${activeTab === tab.id ? "bg-[#222] text-white shadow-sm" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"}`}
                onClick={() => setActiveTab(tab.id)}
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Hypotheses Evaluated", value: "0", icon: BarChart3, color: "text-violet-400" },
                  { label: "Significant Findings", value: "0", icon: Brain, color: "text-amber-400" },
                  { label: "Interpretation Readiness", value: "0%", icon: Gauge, color: "text-emerald-400" },
                  { label: "Limitations Logged", value: "0", icon: AlertOctagon, color: "text-rose-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-xs text-[#888] uppercase tracking-wider font-semibold">{stat.label}</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: "interpreter", label: "1. Result Interpreter", icon: Brain, color: "text-violet-400", border: "hover:border-violet-500/50", desc: "Convert statistical outputs (p-values, β, effect size) to academic prose using RAG + LangChain." },
                  { id: "verdict", label: "2. Hypothesis Verdict Engine", icon: BarChart3, color: "text-amber-400", border: "hover:border-amber-500/50", desc: "Compare findings to H0/H1. Issue Accept, Reject, or Partial verdicts with confidence scores." },
                  { id: "limitations", label: "3. Limitation Logger", icon: AlertOctagon, color: "text-rose-400", border: "hover:border-rose-500/50", desc: "Document, classify, and severity-score study limitations. AI suggests limitations from methodology." },
                  { id: "review", label: "4. Team Review", icon: Users, color: "text-emerald-400", border: "hover:border-emerald-500/50", desc: "Inline comments, tracked changes, approval workflow, and version history." },
                ].map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setActiveTab(card.id as Tab)}
                    className={`bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] ${card.border} rounded-2xl p-6 cursor-pointer group transition-all`}
                  >
                    <card.icon size={28} className={`${card.color} mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-white font-semibold text-lg mb-2">{card.label}</h3>
                    <p className="text-sm text-[#888] leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "interpreter" && (
            <motion.div key="interpreter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ResultInterpreter />
            </motion.div>
          )}
          {activeTab === "verdict" && (
            <motion.div key="verdict" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <HypothesisVerdictEngine />
            </motion.div>
          )}
          {activeTab === "limitations" && (
            <motion.div key="limitations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <LimitationLogger />
            </motion.div>
          )}
          {activeTab === "review" && (
            <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <TeamInterpretationReview />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
