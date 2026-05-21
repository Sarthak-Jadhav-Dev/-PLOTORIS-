"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, FileText, CheckCircle2, Loader2, Bot, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CollaborationEditor } from "@/components/chat/phase9/collaboration-editor";

export default function PhaseNineView({ projectId }: { projectId: string }) {
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [logs, setLogs] = useState<{agent: string, status: string}[]>([]);

  const startDrafting = async () => {
    setIsDrafting(true);
    setLogs([
      { agent: "Context Compiler", status: "Fetching Phase 3 & 7 Data..." },
      { agent: "Abstract Agent", status: "Starting..." },
      { agent: "Introduction Agent", status: "Starting..." },
      { agent: "Literature Agent", status: "Starting..." },
      { agent: "Methodology Agent", status: "Starting..." },
      { agent: "Results Agent", status: "Starting..." },
      { agent: "Conclusion Agent", status: "Starting..." }
    ]);
    
    // Simulate real-time progress updates for UX
    setTimeout(() => {
      setLogs(prev => prev.map(l => l.agent.includes("Compiler") ? { ...l, status: "Complete" } : { ...l, status: "Drafting in progress..." }));
    }, 2000);

    try {
      const res = await fetch("/api/phase9/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      
      setLogs(prev => prev.map(l => ({ ...l, status: "Complete" })));
      setDraftResult(data.draft);
    } catch (e) {
      console.error(e);
      setLogs(prev => prev.map(l => ({ ...l, status: "Failed" })));
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#050505] text-[#d4d4d4] font-sans relative">
      {/* Left Panel: Control Center */}
      {!isExpanded && (
        <div className="w-full lg:w-[35%] h-full border-r border-[#1a1a1a] flex flex-col bg-[#0a0a0a] z-20 shadow-xl transition-all duration-300">
          


          <div className="p-6 border-b border-[#1a1a1a] shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <Badge className="bg-[#ccfbf1] text-[#0f766e] hover:bg-[#ccfbf1] font-medium rounded-full px-3 py-0.5 border border-[#99f6e4]">
                Phase 9
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Drafting Research Paper</h1>
            <p className="text-xs text-[#888]">
              Multi-Agent LangGraph system. Agents will concurrently draft sections of your paper based on the entire project context.
            </p>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {!draftResult && !isDrafting && (
               <div className="bg-[#111] border border-[#222] rounded-xl p-5 text-center">
                 <Bot size={32} className="mx-auto text-teal-500 mb-3" />
                 <h3 className="text-white font-semibold mb-2">Ready to Draft</h3>
                 <p className="text-xs text-[#666] mb-4">Click below to initialize the AI Team. They will work concurrently to produce your IEEE formatted draft.</p>
                 <Button onClick={startDrafting} className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
                   <Play size={16} /> Start AI Team
                 </Button>
               </div>
            )}

            {(isDrafting || logs.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Loader2 className={`w-4 h-4 ${isDrafting ? 'animate-spin text-teal-500' : 'text-green-500'}`} />
                  Agent Operations Status
                </h3>
                
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="bg-[#111] border border-[#222] rounded-lg p-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-[#ccc]">{log.agent}</span>
                      {log.status === "Complete" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : log.status === "Failed" ? (
                        <span className="text-[10px] text-red-500">{log.status}</span>
                      ) : (
                        <span className="text-[10px] text-teal-500 animate-pulse">{log.status}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Panel: Collaborative Editor */}
      <div className={`${isExpanded ? "w-full block" : "hidden lg:block lg:w-[65%]"} h-full relative bg-[#e5e7eb] transition-all duration-300`}>
        <CollaborationEditor 
          projectId={projectId} 
          initialDraft={draftResult || undefined}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      </div>
    </div>
  );
}
