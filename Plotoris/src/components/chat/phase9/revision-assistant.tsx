"use client";

import { useState } from "react";
import { PenTool, Sparkles, Loader2, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RevisionAssistant({ projectId }: { projectId: string }) {
  const [comment, setComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = async () => {
    if (!comment.trim()) return;
    setIsGenerating(true);
    setResponse(null);
    setError(null);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase9/generate-response", {
        method: "POST",
        headers,
        body: JSON.stringify({ comment, project_id: projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate response");
      setResponse(data.response);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyText = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <PenTool size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Revision Assistant</h2>
            <p className="text-xs text-[#888]">Gemini AI drafts grounded rebuttals using your actual methodology from Phases 1–8.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-2">Paste Reviewer Comment</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={5}
              placeholder="Paste the reviewer's comment here..."
              className="w-full bg-[#0d0d0d] border border-[#333] text-[#d4d4d4] text-sm rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 resize-none font-serif transition-colors"
            />
          </div>

          <Button
            onClick={generateResponse}
            disabled={isGenerating || !comment.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
          >
            {isGenerating
              ? <><Loader2 size={16} className="mr-2 animate-spin" />Formulating Academic Rebuttal...</>
              : <><Sparkles size={16} className="mr-2" />Generate AI Response</>}
          </Button>

          {isGenerating && (
            <div className="py-6 text-center">
              <Loader2 size={24} className="animate-spin text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-[#888] animate-pulse">Reading your methodology, hypothesis and design decisions...</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">{error}</div>
          )}

          {response && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">AI-Drafted Response</label>
                <Button size="sm" variant="ghost" onClick={copyText} className="h-6 px-2 text-[#888] hover:text-white">
                  {copied ? <><CheckCheck size={12} className="mr-1 text-emerald-400" />Copied</> : <><Copy size={12} className="mr-1" />Copy</>}
                </Button>
              </div>
              <div className="w-full bg-[#111] border border-emerald-500/20 text-[#d4d4d4] text-sm rounded-lg p-4 font-serif leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
