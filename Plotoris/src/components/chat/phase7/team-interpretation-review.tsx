"use client";

import { useState } from "react";
import { Users, MessageSquare, CheckCircle2, Lock, Send, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const INTERPRETATION_DRAFT = `The findings of this study provide strong empirical support for the proposed hypothesis. A statistically significant negative relationship was identified between daily social media usage and academic performance (GPA) among undergraduate students (β = −0.45, p = 0.02, 95% CI [−0.78, −0.12]). These results indicate that, on average, each additional hour of daily social media engagement is associated with a meaningful decrease in academic performance, even after controlling for demographic variables.

The effect size observed (β = 0.45) is consistent with findings reported by comparable studies in the literature (Jones et al., 2021; Chen & Park, 2022), suggesting that the relationship identified herein is not an artifact of the current sample. Furthermore, participants in the treatment condition, whose social media access was restricted, demonstrated notably higher GPA outcomes at the post-intervention assessment point, lending causal weight to these findings under the quasi-experimental framework employed.`;

const INITIAL_COMMENTS = [
  { id: "c1", author: "Dr. Sharma (PI)", role: "PI", time: "2 hours ago", text: "The causal claim in paragraph 2 needs to be softened. A quasi-experimental design does not fully establish causation. Consider: 'provides preliminary causal evidence'.", resolved: false },
  { id: "c2", author: "R. Patel", role: "Researcher", time: "45 minutes ago", text: "Should we add the Bonferroni correction context here since we ran multiple tests?", resolved: false },
  { id: "c3", author: "Prof. Mehta (Advisor)", role: "Advisor", time: "20 minutes ago", text: "Excellent framing of the effect size comparison. This is publication-ready.", resolved: true },
];

export default function TeamInterpretationReview() {
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [approvals, setApprovals] = useState<string[]>([]);

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments([...comments, {
      id: `c${Date.now()}`,
      author: "You",
      role: "Researcher",
      time: "Just now",
      text: newComment,
      resolved: false,
    }]);
    setNewComment("");
  };

  const toggleApproval = (name: string) => {
    setApprovals(a => a.includes(name) ? a.filter(x => x !== name) : [...a, name]);
  };

  const ROLES = ["You (Researcher)", "Dr. Sharma (PI)", "Prof. Mehta (Advisor)"];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Users size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Interpretation Draft v1.2</h2>
                  <p className="text-[10px] text-[#888]">Last edited 2 hours ago by Dr. Sharma</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isLocked ? (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1 font-semibold">
                    <Lock size={11} /> Approved & Locked
                  </span>
                ) : (
                  <Button onClick={() => setIsLocked(true)} disabled={approvals.length < 2} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4">
                    <Lock size={12} className="mr-1" /> Lock & Approve
                  </Button>
                )}
              </div>
            </div>

            <div className={`p-6 font-serif text-[#d4d4d4] leading-relaxed text-sm whitespace-pre-line min-h-[250px] ${isLocked ? "opacity-80 cursor-not-allowed select-none" : ""}`}
              contentEditable={!isLocked} suppressContentEditableWarning>
              {INTERPRETATION_DRAFT}
            </div>
          </div>

          {/* Comment Input */}
          {!isLocked && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">Y</div>
              <div className="flex-1 flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && addComment()}
                  placeholder="Add a comment or suggestion..."
                  className="flex-1 bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 transition-colors" />
                <Button onClick={addComment} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                  <Send size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Approvals */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Approvals ({approvals.length}/3)</h3>
            <div className="space-y-2">
              {ROLES.map((role) => (
                <div key={role} onClick={() => !isLocked && toggleApproval(role)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${approvals.includes(role) ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#0d0d0d] border-[#333] hover:border-[#555]"}`}>
                  <span className="text-xs text-white">{role}</span>
                  {approvals.includes(role) && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Comments Thread */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#333] flex items-center gap-2">
              <MessageSquare size={14} className="text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Comments ({comments.filter(c => !c.resolved).length} open)</h3>
            </div>
            <div className="divide-y divide-[#222] max-h-[400px] overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className={`p-4 ${c.resolved ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                      {c.author[0]}
                    </div>
                    <span className="text-xs font-semibold text-white">{c.author}</span>
                    <span className="text-[9px] bg-[#222] text-[#888] px-1.5 py-0.5 rounded">{c.role}</span>
                    <span className="text-[10px] text-[#666] ml-auto">{c.time}</span>
                  </div>
                  <p className="text-xs text-[#d4d4d4] leading-relaxed pl-8">{c.text}</p>
                  {c.resolved && <p className="text-[9px] text-emerald-400 pl-8 mt-1">✓ Resolved</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
