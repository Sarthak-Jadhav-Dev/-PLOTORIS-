"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  PieChart, UploadCloud, FileImage, FileSpreadsheet, Download, 
  BarChart2, FileText, Bot, Sparkles, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from "@/lib/supabase";

export default function PhaseHelperView({ projectId }: { projectId: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, type: 'png' | 'csv', size: string, path: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    const supabase = createBrowserClient();
    const newFiles: {name: string, type: 'png' | 'csv', size: string, path: string}[] = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;
      
      const { error } = await supabase.storage.from('research_files').upload(filePath, file);
      
      if (!error) {
        newFiles.push({
          name: file.name,
          type: file.name.endsWith('.csv') ? 'csv' as const : 'png' as const,
          size: (file.size / 1024).toFixed(2) + ' KB',
          path: filePath
        });
      }
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleAnalyze = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/phase-helper/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, files: uploadedFiles }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data.analysis);
        setDashboardReady(true);
      } else {
        console.error("Failed to analyze results");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans relative">


      <div className="max-w-6xl mx-auto space-y-8 mt-8">
        {/* Header */}
        <div className="border-b border-[#333] pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#fdf4ff] text-[#c026d3] hover:bg-[#fdf4ff] font-medium rounded-full px-3 py-0.5 border border-[#fae8ff]">
                Phase 6
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">Research Helper Tool</h1>
            </div>
            <p className="text-[#888] text-sm">
              Upload your final charts (PNG) and data summaries (CSV) to generate an interactive results quality dashboard.
            </p>
          </div>
          
          {dashboardReady && (
            <div className="flex gap-2">
              <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a] rounded-xl flex items-center gap-2">
                <FileImage size={16} /> Export PNG
              </Button>
              <Button className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl flex items-center gap-2">
                <FileText size={16} /> Export PDF
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Upload Zone & LangGraph Agent Info */}
          <div className="space-y-6 lg:col-span-1">
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                isDragging 
                  ? "border-fuchsia-500 bg-fuchsia-500/10 scale-[1.02]" 
                  : "border-[#333] bg-[#0a0a0a] hover:border-fuchsia-500/30"
              }`}
            >
              <div className="p-4 bg-[#111] rounded-full mb-4">
                <UploadCloud size={32} className={isDragging ? "text-fuchsia-400" : "text-[#555]"} />
              </div>
              <h3 className="text-white font-semibold mb-2">Upload to Supabase Storage</h3>
              <p className="text-xs text-[#888] mb-4">
                Drag & drop your final charts (PNG) and data summaries (CSV) here.
              </p>
              <Button variant="outline" className="border-[#333] text-white hover:bg-[#1a1a1a] rounded-xl text-xs">
                Browse Files
              </Button>
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5">
                <h4 className="text-sm font-semibold text-white mb-3">Staged Files</h4>
                <div className="space-y-2 mb-4">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-[#111] rounded-lg border border-[#222]">
                      {f.type === 'png' ? <FileImage size={16} className="text-blue-400" /> : <FileSpreadsheet size={16} className="text-emerald-400" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{f.name}</p>
                        <p className="text-[10px] text-[#666]">{f.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={handleAnalyze}
                  disabled={isProcessing || dashboardReady}
                  className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl"
                >
                  {isProcessing ? "Processing via LangGraph..." : dashboardReady ? "Analysis Complete" : "Analyze Results"}
                </Button>
              </div>
            )}

            {/* AI Agent Info */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Bot size={18} className="text-purple-400" />
                <h4 className="text-sm font-semibold text-white">LangGraph AI Pipeline</h4>
              </div>
              <p className="text-xs text-[#888] leading-relaxed">
                The AI agent uses LangGraph and LangChain to synthesize context from Phases 1-5, cross-referencing your vector embeddings with these uploaded results to assess Data Quality, Validity, and Hypothesis Alignment.
              </p>
            </div>
          </div>

          {/* Right Column: Dashboard */}
          <div className="lg:col-span-2">
            {!dashboardReady ? (
              <div className="h-full min-h-[400px] bg-[#0a0a0a] border border-[#222] rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
                {isProcessing ? (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center z-10"
                  >
                    <div className="w-16 h-16 rounded-full border-4 border-t-fuchsia-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin mb-6" />
                    <h3 className="text-lg font-semibold text-white mb-2">Synthesizing Dashboard</h3>
                    <p className="text-sm text-[#888] text-center max-w-sm">
                      Cross-referencing CSV data with visual chart trends and prior research phases using LangChain...
                    </p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center text-center opacity-50">
                    <PieChart size={48} className="text-[#333] mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Awaiting Data</h3>
                    <p className="text-sm text-[#888]">
                      Upload your files and click Analyze to generate the interactive results quality dashboard.
                    </p>
                  </div>
                )}
                
                {/* Background decorative elements for processing state */}
                {isProcessing && (
                  <>
                    <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                  </>
                )}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Project Results Quality</h3>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                    High Confidence
                  </Badge>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity size={16} className="text-fuchsia-400" />
                      <p className="text-xs text-[#888] uppercase tracking-wider font-semibold">Statistical Power</p>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-white">{analysisResult?.statisticalPower || "N/A"}%</span>
                      <span className="text-xs text-emerald-400 mb-1">{analysisResult?.powerTrend || "+0%"}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart2 size={16} className="text-blue-400" />
                      <p className="text-xs text-[#888] uppercase tracking-wider font-semibold">Data Variance</p>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-white">{analysisResult?.dataVariance || "N/A"}</span>
                      <span className="text-xs text-[#888] mb-1">{analysisResult?.varianceNote || ""}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-xl p-5 mb-6">
                  <h4 className="text-sm font-semibold text-white mb-4">Hypothesis Alignment (Phase 3 Cross-Check)</h4>
                  <div className="space-y-4">
                    {analysisResult?.hypotheses?.map((h: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#ccc]">{h.title}</span>
                          <span className={`${h.score >= 80 ? 'text-emerald-400' : h.score >= 50 ? 'text-amber-400' : 'text-red-400'} font-medium`}>{h.status} ({h.score}%)</span>
                        </div>
                        <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                          <div className={`h-full bg-gradient-to-r ${h.score >= 80 ? 'from-emerald-600 to-emerald-400' : h.score >= 50 ? 'from-amber-600 to-amber-400' : 'from-red-600 to-red-400'}`} style={{ width: `${h.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-2">LangGraph AI Insights</h4>
                  <ul className="space-y-2 text-xs text-[#aaa]">
                    {analysisResult?.insights?.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 ${i % 2 === 0 ? 'bg-purple-500' : 'bg-fuchsia-500'}`} />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
