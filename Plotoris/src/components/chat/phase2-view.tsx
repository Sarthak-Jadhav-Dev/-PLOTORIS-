"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Network, FileText, Search, Activity, Sparkles, Plus, Clock, X, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import PdfUploader from "./phase2/pdf-uploader";
import SemanticSearch from "./phase2/semantic-search";
import PaperFetcher from "./phase2/paper-fetcher";
import GapDetector from "./phase2/gap-detector";
import KnowledgeGraph from "./phase2/knowledge-graph";

export default function PhaseTwoView({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "fetch" | "upload" | "search" | "gaps" | "graph">("dashboard");
  const [bucketPapers, setBucketPapers] = useState<any[]>([]);
  const [isBucketOpen, setIsBucketOpen] = useState(false);

  const handlePaperAdded = (paper: any) => {
    setBucketPapers(prev => [...prev, paper]);
  };

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
              className={`bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4`}
              onClick={() => setActiveTab("fetch")}
            >
              <Search size={16} className="mr-2" /> Auto-Fetch
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
                  { label: "Bucket Papers", value: bucketPapers.length.toString(), icon: FileText, color: "text-blue-400" },
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

                <div 
                  onClick={() => setActiveTab("graph")}
                  className="bg-[#1a1a1a] border border-[#333] hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer transition-all group"
                >
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

          {activeTab === "fetch" && (
            <motion.div key="fetch" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PaperFetcher projectId={projectId} onPaperAdded={handlePaperAdded} />
            </motion.div>
          )}

          {activeTab === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <PdfUploader 
                projectId={projectId}
                onUploadComplete={(paper) => {
                  if (paper) handlePaperAdded(paper);
                  setActiveTab("dashboard");
                }} 
              />
            </motion.div>
          )}

          {activeTab === "search" && (
            <motion.div key="search" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <SemanticSearch projectId={projectId} />
            </motion.div>
          )}
          
          {activeTab === "gaps" && (
            <motion.div key="gaps" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <GapDetector projectId={projectId} />
            </motion.div>
          )}

          {activeTab === "graph" && (
            <motion.div key="graph" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <KnowledgeGraph projectId={projectId} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Side-Space Paper Bucket */}
      <AnimatePresence>
        {isBucketOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBucketOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-[#1a1a1a] border-l border-[#333] shadow-2xl z-50 flex flex-col"
            >
              <div className="bg-[#111] border-b border-[#333] p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-400" />
                    Knowledge Bucket
                  </h3>
                  <p className="text-[#888] text-xs mt-1">Your embedded research papers</p>
                </div>
                <button 
                  onClick={() => setIsBucketOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#333] flex items-center justify-center text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                {bucketPapers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#888] opacity-60">
                    <BookOpen size={48} className="mb-4" />
                    <p className="text-sm text-center">Your bucket is empty.</p>
                    <p className="text-xs text-center mt-2">Fetch or upload papers to add them here.</p>
                  </div>
                ) : (
                  bucketPapers.map((p, i) => (
                    <div key={i} className="bg-[#0d0d0d] border border-[#222] hover:border-blue-500/50 p-4 rounded-xl transition-colors group">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-white text-sm font-semibold line-clamp-2 leading-tight">{p.title}</h4>
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 size={12} className="text-blue-400" />
                        </div>
                      </div>
                      <p className="text-[#888] text-xs mb-3 line-clamp-1">{p.authors}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider bg-[#222] text-[#aaa] px-2 py-1 rounded">
                          {p.source === 'upload' ? 'Uploaded PDF' : 'Semantic Scholar'}
                        </span>
                        {p.year && <span className="text-xs text-[#666]">{p.year}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!isBucketOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button 
            onClick={() => setIsBucketOpen(true)}
            className="flex items-center gap-3 bg-white text-black px-5 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 transition-transform"
          >
            <BookOpen size={20} />
            <span className="font-semibold">Bucket</span>
            {bucketPapers.length > 0 && (
              <div className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {bucketPapers.length}
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
