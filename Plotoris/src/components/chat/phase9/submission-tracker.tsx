"use client";

import { Kanban, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SUBMISSIONS = [
  {
    id: "sub-1",
    journal: "Journal of Educational Technology",
    status: "Major Revision",
    dateSubmitted: "2026-03-15",
    decisionDate: "2026-05-18",
    editor: "Dr. A. Smith",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    icon: AlertCircle
  },
  {
    id: "sub-2",
    journal: "Computers in Human Behavior",
    status: "Rejected",
    dateSubmitted: "2025-11-10",
    decisionDate: "2026-02-05",
    editor: "Dr. R. Chen",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    icon: XCircle
  }
];

export default function SubmissionTracker() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Kanban size={20} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Submission Tracker</h2>
          <p className="text-xs text-[#888]">Monitor manuscript statuses across different journals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Kanban Columns (Simulated) */}
        
        {/* Under Review */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Under Review</h3>
            <Badge variant="outline" className="text-[10px] border-[#333]">0</Badge>
          </div>
          <div className="border-2 border-dashed border-[#333] rounded-lg p-6 text-center text-[#555] text-xs">
            No active submissions
          </div>
        </div>

        {/* Revisions */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Revisions Needed</h3>
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">1</Badge>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 shadow-xl">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${SUBMISSIONS[0].bg} ${SUBMISSIONS[0].color}`}>
                {SUBMISSIONS[0].status}
              </span>
              <FileText size={14} className="text-[#666]" />
            </div>
            <h4 className="text-sm font-bold text-white mb-3">{SUBMISSIONS[0].journal}</h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#888]">
                <span>Submitted:</span>
                <span className="text-[#d4d4d4]">{SUBMISSIONS[0].dateSubmitted}</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Decision:</span>
                <span className="text-[#d4d4d4]">{SUBMISSIONS[0].decisionDate}</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>Editor:</span>
                <span className="text-[#d4d4d4]">{SUBMISSIONS[0].editor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decisions */}
        <div className="bg-[#111] border border-[#222] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Decisions</h3>
            <Badge variant="outline" className="text-[10px] border-[#333]">1</Badge>
          </div>
          
          <div className="bg-[#1a1a1a] border border-[#333] opacity-60 rounded-xl p-4">
            <div className="flex justify-between items-start mb-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${SUBMISSIONS[1].bg} ${SUBMISSIONS[1].color}`}>
                {SUBMISSIONS[1].status}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mb-3">{SUBMISSIONS[1].journal}</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-[#888]">
                <span>Decision:</span>
                <span className="text-[#d4d4d4]">{SUBMISSIONS[1].decisionDate}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
