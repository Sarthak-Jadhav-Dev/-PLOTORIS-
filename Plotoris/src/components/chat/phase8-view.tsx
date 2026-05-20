"use client";

import { useState } from "react";
import { FileEdit, BookOpen, Quote, ShieldAlert, History, BookMarked } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ManuscriptEditor from "@/components/chat/phase8/manuscript-editor";

export default function PhaseEightView() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#050505] text-[#d4d4d4] font-sans relative">

      {/* Top Banner */}
      <div className="shrink-0 bg-orange-500/10 border-b border-orange-500/20 px-4 py-2 flex items-center justify-center gap-2">
        <FileEdit size={14} className="text-orange-400" />
        <span className="text-xs font-semibold text-orange-300">
          MARKET GAP ADDRESSED: Writing is disconnected from review, data, and citations. Plotoris unifies them.
        </span>
      </div>

      {/* Sub-header */}
      <div className="shrink-0 flex items-center justify-between border-b border-[#333] px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge className="bg-[#ffedd5] text-[#c2410c] hover:bg-[#ffedd5] font-medium rounded-full px-3 py-0.5 border border-[#fed7aa]">
            Phase 8
          </Badge>
          <h1 className="text-lg font-bold text-white tracking-tight">Research Paper Drafting</h1>
        </div>
      </div>

      {/* Main content - full height editor */}
      <div className="flex-1 overflow-hidden">
        <ManuscriptEditor />
      </div>
    </div>
  );
}
