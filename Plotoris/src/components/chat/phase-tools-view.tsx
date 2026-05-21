"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Github, Link as LinkIcon, FolderTree, CheckSquare, Square, CheckCircle2, Loader2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PhaseToolsView({ projectId }: { projectId: string }) {
  const [githubUrl, setGithubUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [files, setFiles] = useState<{ name: string; type: "folder" | "file"; selected: boolean; children?: any[] }[] | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embeddingComplete, setEmbeddingComplete] = useState(false);

  const handleFetchFiles = async () => {
    if (!githubUrl) return;
    setIsFetching(true);
    try {
      const res = await fetch("/api/phase-tools/github-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming API returns { tree: [ {name, type, selected, children?} ] }
        setFiles(data.tree);
      } else {
        console.error("Failed to fetch repository tree");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerateEmbeddings = async () => {
    setIsEmbedding(true);
    try {
      // Gather selected files
      const getSelected = (items: any[]): string[] => {
        let paths: string[] = [];
        for (const item of items) {
          if (item.type === "file" && item.selected) {
            paths.push(item.path || item.name); // Prefer full path if returned by API
          }
          if (item.children) {
            paths = paths.concat(getSelected(item.children));
          }
        }
        return paths;
      };
      
      const selectedPaths = files ? getSelected(files) : [];
      
      const res = await fetch("/api/phase-tools/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, url: githubUrl, files: selectedPaths }),
      });
      
      if (res.ok) {
        setEmbeddingComplete(true);
      } else {
        console.error("Failed to generate embeddings");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEmbedding(false);
    }
  };

  const toggleFileSelection = (fileName: string) => {
    // In a real app, this would recursively toggle children if it's a folder
    // For this mockup, we'll just toggle the top level items if they are matched or do a deep copy
    const newFiles = JSON.parse(JSON.stringify(files));
    
    const toggleDeep = (items: any[]) => {
      for (const item of items) {
        if (item.name === fileName) {
          item.selected = !item.selected;
        }
        if (item.children) {
          toggleDeep(item.children);
        }
      }
    };
    
    toggleDeep(newFiles);
    setFiles(newFiles);
  };

  const renderFileTree = (items: any[], depth = 0) => {
    return items.map((item, index) => (
      <div key={item.name + index} className="flex flex-col">
        <div 
          className="flex items-center gap-3 py-2 px-3 hover:bg-[#1a1a1a] rounded-lg cursor-pointer transition-colors"
          style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
          onClick={() => toggleFileSelection(item.name)}
        >
          {item.selected ? (
            <CheckSquare size={16} className="text-blue-500" />
          ) : (
            <Square size={16} className="text-[#555]" />
          )}
          {item.type === "folder" ? (
            <FolderTree size={16} className="text-[#888]" />
          ) : (
            <div className="w-4 h-4" /> // placeholder
          )}
          <span className={`text-sm ${item.selected ? 'text-white' : 'text-[#888]'}`}>
            {item.name}
          </span>
        </div>
        {item.children && renderFileTree(item.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans relative">


      <div className="max-w-5xl mx-auto space-y-8 mt-8">
        {/* Header */}
        <div className="border-b border-[#333] pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Badge className="bg-[#eff6ff] text-[#2563eb] hover:bg-[#eff6ff] font-medium rounded-full px-3 py-0.5 border border-[#bfdbfe]">
              Phase 5
            </Badge>
            <h1 className="text-2xl font-bold text-white tracking-tight">Research Tools</h1>
          </div>
          <p className="text-[#888] text-sm">
            Import external codebases, select relevant files, and convert them to vector embeddings for the AI agent to analyze.
          </p>
        </div>

        {/* Code Connector Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input & Tree */}
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                  <Github size={20} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Code Connector</h2>
                  <p className="text-xs text-[#888]">Link your GitHub repository</p>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full pl-9 pr-4 py-2.5 bg-[#141414] border border-[#333] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>
                <Button 
                  onClick={handleFetchFiles} 
                  disabled={!githubUrl || isFetching}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                >
                  {isFetching ? <Loader2 size={16} className="animate-spin" /> : "Fetch"}
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {files && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Select Required Files</h3>
                    <Badge variant="outline" className="text-xs border-[#333] text-[#888]">
                      Vector Embeddings Target
                    </Badge>
                  </div>
                  
                  <div className="bg-[#111] border border-[#222] rounded-xl p-2 max-h-[300px] overflow-y-auto mb-6">
                    {renderFileTree(files)}
                  </div>

                  <Button 
                    onClick={handleGenerateEmbeddings}
                    disabled={isEmbedding || embeddingComplete}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl py-6 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                  >
                    {isEmbedding ? (
                      <span className="flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Processing Embeddings...</span>
                    ) : embeddingComplete ? (
                      <span className="flex items-center gap-2"><CheckCircle2 size={18} /> Vectors Generated</span>
                    ) : (
                      <span className="flex items-center gap-2"><Database size={18} /> Store in Vector Embeddings</span>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Dashboard */}
          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-6">Vector Dashboard</h3>
              
              {!embeddingComplete ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#333] rounded-xl bg-[#111]/50">
                  <Database size={32} className="text-[#444] mb-4" />
                  <p className="text-sm text-[#888]">No vector embeddings generated yet.</p>
                  <p className="text-xs text-[#555] mt-1">Connect a repository and select files to begin.</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                      <p className="text-xs text-[#888] mb-1">Files Embedded</p>
                      <p className="text-2xl font-bold text-white">4</p>
                    </div>
                    <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                      <p className="text-xs text-[#888] mb-1">Total Chunks</p>
                      <p className="text-2xl font-bold text-white">128</p>
                    </div>
                  </div>

                  {/* AI Agent Status */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      <p className="text-sm font-semibold text-blue-300">AI Agent Ready</p>
                    </div>
                    <p className="text-xs text-[#888] leading-relaxed">
                      The Plotoris AI agent has successfully indexed the repository context. You can now ask complex queries about the architecture, or use this context in Phase 6.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
