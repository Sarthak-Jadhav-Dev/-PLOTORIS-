"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, FileCheck, Kanban, MessageSquare, PenTool, LayoutDashboard, Target, Clock, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import JournalRecommender from "@/components/chat/phase9/journal-recommender";
import AutoFormatExporter from "@/components/chat/phase9/auto-format-exporter";
import SubmissionTracker from "@/components/chat/phase9/submission-tracker";
import PeerReviewManager from "@/components/chat/phase9/peer-review-manager";
import RevisionAssistant from "@/components/chat/phase9/revision-assistant";

type Tab = "dashboard" | "recommender" | "exporter" | "tracker" | "reviews" | "revision";

export default function PhaseNineView() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "recommender", label: "Journal Recommender" },
    { id: "exporter", label: "Format Exporter" },
    { id: "tracker", label: "Submission Tracker" },
    { id: "reviews", label: "Peer Review Manager" },
    { id: "revision", label: "Revision Assistant" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans relative">

      {/* Top Banner */}
      <div className="absolute top-0 left-0 right-0 bg-teal-500/10 border-b border-teal-500/20 px-4 py-2 flex items-center justify-center gap-2">
        <Send size={14} className="text-teal-400" />
        <span className="text-xs font-semibold text-teal-300">
          MARKET GAP ADDRESSED: Fragmented submission tracking across multiple platforms. Plotoris centralizes it.
        </span>
      </div>

      <div className="max-w-7xl mx-auto space-y-6 mt-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#ccfbf1] text-[#0f766e] hover:bg-[#ccfbf1] font-medium rounded-full px-3 py-0.5 border border-[#99f6e4]">
                Phase 9
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">Publication & Peer Review</h1>
            </div>
            <p className="text-[#888] text-sm">
              Identify target journals, track submissions, manage reviewer comments, and automate revisions.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#333] overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`rounded-lg px-3 whitespace-nowrap ${activeTab === tab.id ? "bg-[#222] text-white shadow-sm" : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"}`}
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
                  { label: "Current Target", value: "J. of Educ. Tech", icon: Target, color: "text-teal-400" },
                  { label: "Submission Status", value: "Major Revision", icon: Clock, color: "text-amber-400" },
                  { label: "Open Comments", value: "3", icon: MessageCircle, color: "text-rose-400" },
                  { label: "Revision Progress", value: "65%", icon: FileText, color: "text-emerald-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-xs text-[#888] uppercase tracking-wider font-semibold">{stat.label}</span>
                    </div>
                    <span className="text-xl font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: "recommender", label: "1. Journal Recommender", icon: Send, color: "text-teal-400", border: "hover:border-teal-500/50", desc: "Find the best journals based on your abstract, keywords, and constraints." },
                  { id: "exporter", label: "2. Auto Format Exporter", icon: FileCheck, color: "text-blue-400", border: "hover:border-blue-500/50", desc: "Export your manuscript formatted exactly to your target journal's guidelines." },
                  { id: "tracker", label: "3. Submission Tracker", icon: Kanban, color: "text-purple-400", border: "hover:border-purple-500/50", desc: "Track manuscript statuses across different journals in a centralized board." },
                  { id: "reviews", label: "4. Peer Review Manager", icon: MessageSquare, color: "text-rose-400", border: "hover:border-rose-500/50", desc: "Import, categorize, and assign reviewer comments for your team to address." },
                  { id: "revision", label: "5. Revision Assistant", icon: PenTool, color: "text-emerald-400", border: "hover:border-emerald-500/50", desc: "Generate point-by-point response letters using AI and project context." },
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

          {activeTab === "recommender" && (
            <motion.div key="recommender" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <JournalRecommender />
            </motion.div>
          )}
          {activeTab === "exporter" && (
            <motion.div key="exporter" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AutoFormatExporter />
            </motion.div>
          )}
          {activeTab === "tracker" && (
            <motion.div key="tracker" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SubmissionTracker />
            </motion.div>
          )}
          {activeTab === "reviews" && (
            <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PeerReviewManager />
            </motion.div>
          )}
          {activeTab === "revision" && (
            <motion.div key="revision" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <RevisionAssistant />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
