"use client";

import { useState } from "react";
import { MessageSquare, Check, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COMMENTS = [
  {
    id: "r1-1",
    reviewer: "Reviewer 1",
    type: "Major",
    status: "open",
    text: "The abstract states n=385, but the results section relies on n=357. The attrition rate must be explicitly explained in the methodology and results.",
  },
  {
    id: "r1-2",
    reviewer: "Reviewer 1",
    type: "Minor",
    status: "resolved",
    text: "Please add standard errors alongside the beta coefficients in Table 2.",
  },
  {
    id: "r2-1",
    reviewer: "Reviewer 2",
    type: "Major",
    status: "open",
    text: "While the quasi-experimental design is an improvement over cross-sectional data, the causal language in the discussion (e.g., 'causes lower GPA') is too strong. Tone this down to reflect associations.",
  }
];

export default function PeerReviewManager() {
  const [comments, setComments] = useState(COMMENTS);

  const toggleStatus = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, status: c.status === "open" ? "resolved" : "open" } : c));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
          <MessageSquare size={20} className="text-rose-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Peer Review Manager</h2>
          <p className="text-xs text-[#888]">Track and categorize feedback from peer reviewers.</p>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#333] flex gap-4 bg-[#111]">
          <div className="text-center px-4 border-r border-[#333]">
            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{comments.length}</p>
          </div>
          <div className="text-center px-4 border-r border-[#333]">
            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Open</p>
            <p className="text-2xl font-bold text-rose-400">{comments.filter(c => c.status === "open").length}</p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Resolved</p>
            <p className="text-2xl font-bold text-emerald-400">{comments.filter(c => c.status === "resolved").length}</p>
          </div>
        </div>

        <div className="divide-y divide-[#222]">
          {comments.map((comment) => (
            <div key={comment.id} className={`p-6 transition-colors ${comment.status === "resolved" ? "bg-[#111]/50 opacity-60" : "bg-[#1a1a1a]"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant="outline" className={`text-[10px] bg-[#0d0d0d] ${comment.reviewer === "Reviewer 1" ? "border-blue-500/30 text-blue-400" : "border-purple-500/30 text-purple-400"}`}>
                    <User size={10} className="mr-1" /> {comment.reviewer}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${comment.type === "Major" ? "border-rose-500/50 text-rose-400" : "border-[#444] text-[#888]"}`}>
                    {comment.type} Comment
                  </Badge>
                </div>
                <button onClick={() => toggleStatus(comment.id)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded flex items-center gap-1 border transition-colors ${comment.status === "resolved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#222] border-[#444] text-[#888] hover:bg-[#333]"}`}>
                  {comment.status === "resolved" ? <><Check size={12} /> Resolved</> : <><Clock size={12} /> Open</>}
                </button>
              </div>
              <p className="text-sm text-[#d4d4d4] leading-relaxed font-serif">"{comment.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
