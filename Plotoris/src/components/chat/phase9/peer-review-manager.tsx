"use client";

import { useState } from "react";
import { MessageSquare, Check, Clock, User, Sparkles, Loader2, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  reviewer: string;
  type: "Major" | "Minor";
  status: "open" | "resolved";
  text: string;
}

export default function PeerReviewManager({ projectId }: { projectId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newReviewer, setNewReviewer] = useState("Reviewer 1");
  const [newType, setNewType] = useState<"Major" | "Minor">("Major");
  const [showAddForm, setShowAddForm] = useState(false);

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: `r-${Date.now()}`,
      reviewer: newReviewer,
      type: newType,
      status: "open",
      text: newComment,
    }]);
    setNewComment("");
    setShowAddForm(false);
  };

  const toggleStatus = (id: string) => {
    setComments(comments.map(c => c.id === id ? { ...c, status: c.status === "open" ? "resolved" : "open" } : c));
  };

  const removeComment = (id: string) => setComments(comments.filter(c => c.id !== id));

  const open = comments.filter(c => c.status === "open").length;
  const resolved = comments.filter(c => c.status === "resolved").length;
  const progress = comments.length > 0 ? Math.round((resolved / comments.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header + Stats */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <MessageSquare size={20} className="text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Peer Review Manager</h2>
              <p className="text-xs text-[#888]">Add and track reviewer comments. Use Revision Assistant to generate AI rebuttals.</p>
            </div>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs">
            <Plus size={14} className="mr-1" /> Add Comment
          </Button>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 border-b border-[#333] flex gap-6 bg-[#111]">
          <div className="text-center pr-6 border-r border-[#333]">
            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{comments.length}</p>
          </div>
          <div className="text-center pr-6 border-r border-[#333]">
            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Open</p>
            <p className="text-2xl font-bold text-rose-400">{open}</p>
          </div>
          <div className="text-center pr-6 border-r border-[#333]">
            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Resolved</p>
            <p className="text-2xl font-bold text-emerald-400">{resolved}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Progress</p>
            <p className="text-2xl font-bold text-white">{progress}%</p>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="px-6 py-4 border-b border-[#333] bg-[#0d0d0d] space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Reviewer</label>
                <select value={newReviewer} onChange={e => setNewReviewer(e.target.value)} className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-lg px-3 py-2">
                  <option>Reviewer 1</option>
                  <option>Reviewer 2</option>
                  <option>Reviewer 3</option>
                  <option>Editor</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Type</label>
                <select value={newType} onChange={e => setNewType(e.target.value as "Major" | "Minor")} className="w-full bg-[#111] border border-[#333] text-white text-sm rounded-lg px-3 py-2">
                  <option>Major</option>
                  <option>Minor</option>
                </select>
              </div>
            </div>
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={3}
              placeholder="Paste reviewer comment here..."
              className="w-full bg-[#111] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 resize-none font-serif"
            />
            <div className="flex gap-2">
              <Button onClick={addComment} disabled={!newComment.trim()} className="bg-rose-600 hover:bg-rose-700 text-white h-9 text-xs">Add Comment</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="border-[#444] text-[#888] h-9 text-xs">Cancel</Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={36} className="text-[#333] mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No Reviewer Comments Yet</p>
            <p className="text-[#888] text-sm">Click "Add Comment" to paste reviewer feedback and track your revisions.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#222]">
            {comments.map((comment) => (
              <div key={comment.id} className={`p-6 transition-colors ${comment.status === "resolved" ? "bg-[#111]/50 opacity-60" : "bg-[#1a1a1a]"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className={`text-[10px] bg-[#0d0d0d] ${comment.reviewer === "Reviewer 1" ? "border-blue-500/30 text-blue-400" : comment.reviewer === "Reviewer 2" ? "border-purple-500/30 text-purple-400" : "border-teal-500/30 text-teal-400"}`}>
                      <User size={10} className="mr-1" /> {comment.reviewer}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${comment.type === "Major" ? "border-rose-500/50 text-rose-400" : "border-[#444] text-[#888]"}`}>
                      {comment.type} Comment
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleStatus(comment.id)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded flex items-center gap-1 border transition-colors ${comment.status === "resolved" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#222] border-[#444] text-[#888] hover:bg-[#333]"}`}>
                      {comment.status === "resolved" ? <><Check size={12} />Resolved</> : <><Clock size={12} />Open</>}
                    </button>
                    <button onClick={() => removeComment(comment.id)} className="text-[#555] hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#d4d4d4] leading-relaxed font-serif">"{comment.text}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
