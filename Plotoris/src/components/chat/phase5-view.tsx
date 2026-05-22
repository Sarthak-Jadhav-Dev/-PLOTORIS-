"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DatabaseZap, ClipboardList, FileSpreadsheet, Mic2, FlaskConical, ShieldAlert, Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import DatasetManager from "@/components/chat/phase5/dataset-manager";
import ExperimentTracker from "@/components/chat/phase5/experiment-tracker";
import DataQualityChecker from "@/components/chat/phase5/data-quality-checker";
import VariableLinker from "@/components/chat/phase5/variable-linker";
import DatasetUploader from "@/components/chat/phase5/dataset-uploader";

type Tab = "dashboard" | "dataset" | "experiment" | "quality" | "linker";

export default function PhaseFiveView({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "dataset", label: "Dataset" },
    { id: "experiment", label: "Experiment" },
    { id: "quality", label: "Quality" },
    { id: "linker", label: "Variable Linker" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6 mt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#cffafe] text-[#0e7490] hover:bg-[#cffafe] font-medium rounded-full px-3 py-0.5 border border-[#a5f3fc]">
                Phase 5
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">Data Collection</h1>
            </div>
            <p className="text-[#888] text-sm">
              Manage datasets, log experimental runs, and validate data quality.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#333] flex-wrap">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`rounded-lg px-3 text-xs whitespace-nowrap ${activeTab === tab.id ? "bg-[#222] text-white shadow-sm" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"}`}
                onClick={() => setActiveTab(tab.id as Tab)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Global Dataset Uploader stays visible at the top */}
        <DatasetUploader projectId={projectId} />

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              {/* Hero Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Data Sources", value: "0", icon: DatabaseZap, color: "text-cyan-400" },
                  { label: "Total Records", value: "0", icon: FileSpreadsheet, color: "text-blue-400" },
                  { label: "Quality Score", value: "--/100", icon: ShieldAlert, color: "text-emerald-400" },
                  { label: "Variable Coverage", value: "0%", icon: Link2, color: "text-fuchsia-400" },
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "dataset", label: "1. Resource Kanban", icon: FileSpreadsheet, color: "text-blue-400", border: "hover:border-blue-500/50", desc: "Manage datasets, Colab, and Jupyter notebooks." },
                  { id: "experiment", label: "2. Experiment Tracker", icon: FlaskConical, color: "text-amber-400", border: "hover:border-amber-500/50", desc: "Production-grade experimental runs logger." },
                  { id: "quality", label: "3. Data Quality Checker", icon: ShieldAlert, color: "text-emerald-400", border: "hover:border-emerald-500/50", desc: "LangGraph multi-agent issue detection." },
                  { id: "linker", label: "4. Variable Linker", icon: Link2, color: "text-fuchsia-400", border: "hover:border-fuchsia-500/50", desc: "Map dataset columns to Phase 3 variables." },
                ].map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setActiveTab(card.id as Tab)}
                    className={`bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] ${card.border} rounded-2xl p-6 cursor-pointer group transition-all`}
                  >
                    <card.icon size={24} className={`${card.color} mb-4 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-white font-semibold mb-1">{card.label}</h3>
                    <p className="text-xs text-[#888]">{card.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "dataset" && (
            <motion.div key="dataset" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DatasetManager projectId={projectId} />
            </motion.div>
          )}
          {activeTab === "experiment" && (
            <motion.div key="experiment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ExperimentTracker projectId={projectId} />
            </motion.div>
          )}
          {activeTab === "quality" && (
            <motion.div key="quality" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DataQualityChecker projectId={projectId} />
            </motion.div>
          )}
          {activeTab === "linker" && (
            <motion.div key="linker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <VariableLinker projectId={projectId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
