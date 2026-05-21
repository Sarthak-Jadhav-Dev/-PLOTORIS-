"use client";

import { Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PublishingTracker from "@/components/publishing/PublishingTracker";
import { PublishingProvider } from "@/context/PublishingContext";

export default function PhaseEightView() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#050505] text-[#d4d4d4] font-sans relative">

      {/* Top Banner */}
      <div className="shrink-0 bg-orange-500/10 border-b border-orange-500/20 px-4 py-2 flex items-center justify-center gap-2">
        <Send size={14} className="text-orange-400" />
        <span className="text-xs font-semibold text-orange-300">
          MARKET GAP ADDRESSED: Centralized Publishing Kanban Board for tracking paper statuses across the team.
        </span>
      </div>

      {/* Sub-header */}
      <div className="shrink-0 flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-[#333] px-6 py-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Badge className="bg-[#ffedd5] text-[#c2410c] hover:bg-[#ffedd5] font-medium rounded-full px-3 py-0.5 border border-[#fed7aa]">
              Phase 10
            </Badge>
            <h1 className="text-xl font-bold text-white tracking-tight">Publication Tracker</h1>
          </div>
          <p className="text-[#888] text-sm mt-1">
            Drag and drop research papers across stages to track publishing status.
          </p>
        </div>
      </div>

      {/* Main content - Kanban Board */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <PublishingProvider>
          <PublishingTracker />
        </PublishingProvider>
      </div>
    </div>
  );
}
