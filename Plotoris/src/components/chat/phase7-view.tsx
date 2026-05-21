"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { ClaimsChat } from "@/components/chat/phase7/claims-chat";
import { ClaimsRegistry } from "@/components/chat/phase7/claims-registry";

type Tab = "chat" | "registry";

export default function PhaseSevenView({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("chat");

  const tabs: { id: Tab; label: string }[] = [
    { id: "chat", label: "AI Analyst Chat" },
    { id: "registry", label: "Verified Results" },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050505] text-[#d4d4d4] font-sans relative">



      {/* Header */}
      <div className="p-4 lg:px-8 pt-6 shrink-0">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#ede9fe] text-[#7c3aed] hover:bg-[#ede9fe] font-medium rounded-full px-3 py-0.5 border border-[#ddd6fe]">
                Phase 8
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">Interpretation of Results</h1>
            </div>
            <p className="text-[#888] text-sm">
              Converse with the AI to verify your findings and automatically register them to the project database.
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "chat" && (
            <motion.div 
              key="chat" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0"
            >
              <ClaimsChat projectId={projectId} />
            </motion.div>
          )}

          {activeTab === "registry" && (
            <motion.div 
              key="registry" 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-[#0a0a0a]"
            >
              <ClaimsRegistry projectId={projectId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
