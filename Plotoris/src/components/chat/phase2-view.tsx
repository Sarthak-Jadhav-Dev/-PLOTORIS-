"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Network, FileText, Search, Activity, Sparkles, Plus, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import PdfUploader from "./phase2/pdf-uploader";
import SemanticSearch from "./phase2/semantic-search";
// We'll create these later if needed, or stub them out here.

export default function PhaseTwoView() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "upload" | "search" | "gaps">("dashboard");

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#e0e7ff] text-[#4f46e5] hover:bg-[#e0e7ff] font-medium rounded-full px-3 py-0.5 border border-[#c7d2fe]">
                Phase 2
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Literature Review
              </h1>
            </div>
            <p className="text-[#888] text-sm">
              Upload papers, extract insights, and detect research gaps using semantic analysis.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className={`bg-transparent border-[#333] hover:bg-[#1a1a1a] hover:text-white rounded-lg px-4 ${activeTab === 'dashboard' ? 'bg-[#1a1a1a] text-white' : 'text-[#888]'}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </Button>
            <Button 
              className={`bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4`}
              onClick={() => setActiveTab("upload")}
            >
              <Plus size={16} className="mr-2" /> Upload PDF
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* 1. Stats Hero */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Papers", value: "0", icon: FileText, color: "text-blue-400" },
                  { label: "Extracted Insights", value: "0", icon: Sparkles, color: "text-amber-400" },
                  { label: "Research Gaps", value: "0", icon: Activity, color: "text-rose-400" },
                  { label: "Graph Nodes", value: "4", icon: Network, color: "text-emerald-400" }, // From phase 1
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-xs text-[#888] uppercase tracking-wider font-semibold">{stat.label}</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* 2. Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  onClick={() => setActiveTab("search")}
                  className="bg-[#1a1a1a] border border-[#333] hover:border-indigo-500/50 rounded-2xl p-6 cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Search size={20} className="text-indigo-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Semantic Search</h3>
                  <p className="text-sm text-[#888]">Search your corpus using natural language and conceptual meaning.</p>
                </div>
                
                <div 
                  onClick={() => setActiveTab("gaps")}
                  className="bg-[#1a1a1a] border border-[#333] hover:border-rose-500/50 rounded-2xl p-6 cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity size={20} className="text-rose-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Gap Detector</h3>
                  <p className="text-sm text-[#888]">Cross-reference findings to detect contradictions and white-space.</p>
                </div>

                <div className="bg-[#1a1a1a] border border-[#333] hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Network size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Knowledge Graph</h3>
                  <p className="text-sm text-[#888]">Visualize relationships between authors, methods, and concepts.</p>
                </div>
              </div>

              {/* 3. Uploaded Papers Table */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <BookOpen size={16} className="text-blue-400" />
                    Uploaded Papers
                  </h3>
                </div>
                <div className="p-8 text-center text-[#888] flex flex-col items-center">
                  <FileText size={32} className="mb-3 opacity-20" />
                  <p>No papers uploaded yet.</p>
                  <Button 
                    variant="link" 
                    className="text-blue-500 mt-2"
                    onClick={() => setActiveTab("upload")}
                  >
                    Upload your first PDF
                  </Button>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PdfUploader onUploadComplete={() => setActiveTab("dashboard")} />
            </motion.div>
          )}

          {activeTab === "search" && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SemanticSearch />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
