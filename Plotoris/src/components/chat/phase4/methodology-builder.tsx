"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileEdit, Loader2, RefreshCw, Sparkles, Copy, CheckCheck, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

export default function MethodologyBuilder({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Load previously saved methodology on mount
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch(`/api/phase4/draft-methodology?project_id=${projectId}`);
        const data = await res.json();
        if (data.methodology) setDraft(data.methodology);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) fetchSaved();
  }, [projectId]);

  const getHeaders = () => {
    const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
    const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
    const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
    const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
    const headers: any = { "Content-Type": "application/json" };
    if (textKey) { headers["x-api-key"] = textKey; headers["x-api-provider"] = activeTextProvider; }
    if (embeddingKey) { headers["x-embedding-key"] = embeddingKey; headers["x-embedding-provider"] = activeEmbeddingProvider; }
    return headers;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDraft(null);
    try {
      const res = await fetch("/api/phase4/draft-methodology", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      setDraft(data.methodology);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (draft) {
      navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
              <FileEdit size={20} className="text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Methodology Builder</h2>
              <p className="text-sm text-[#888]">
                Synthesizes data from all phases to draft a journal-quality methodology section.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {draft && (
              <Button
                variant="outline"
                onClick={handleCopy}
                className="border-[#444] bg-transparent text-[#aaa] hover:text-white hover:bg-[#222] gap-2"
              >
                {copied
                  ? <><CheckCheck size={14} className="text-emerald-400" /> Copied!</>
                  : <><Copy size={14} /> Copy Markdown</>}
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`gap-2 text-white ${draft ? "bg-[#333] hover:bg-[#444] border border-[#555]" : "bg-fuchsia-600 hover:bg-fuchsia-700"}`}
            >
              {isGenerating
                ? <><Loader2 size={15} className="animate-spin" /> Drafting...</>
                : draft
                  ? <><RefreshCw size={15} /> Regenerate</>
                  : <><Sparkles size={15} /> Generate Draft</>}
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {!draft && !isGenerating && (
          <div className="border-2 border-dashed border-[#333] rounded-xl p-16 text-center flex flex-col items-center">
            <BookOpen size={48} className="text-[#333] mb-4" />
            <h3 className="text-white font-medium mb-2">No methodology draft yet</h3>
            <p className="text-[#888] text-sm max-w-md mb-6">
              Click "Generate Draft" to synthesize a comprehensive 10-section Research Methodology from your Phase 1–4 data.
            </p>
            <Button
              onClick={handleGenerate}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white gap-2 px-8"
            >
              <Sparkles size={15} /> Generate Draft
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 size={40} className="animate-spin text-fuchsia-500" />
            <p className="text-white font-medium animate-pulse">Synthesizing methodology sections...</p>
            <p className="text-[#666] text-xs">
              Drawing from your research topic, literature, hypotheses, variables, design, ethics & timeline
            </p>
          </div>
        )}

        {/* Rendered Methodology */}
        <AnimatePresence>
          {draft && !isGenerating && (
            <motion.div
              key="draft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-8 min-h-[400px]">
                <div className="methodology-prose max-w-none">
                  <ReactMarkdown>{draft}</ReactMarkdown>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#222]">
                <p className="text-xs text-[#555]">
                  Generated from all Phase 1–4 context. Regenerate to update after making changes to other phases.
                </p>
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="border-[#444] bg-transparent text-[#aaa] hover:text-white hover:bg-[#222] gap-2"
                >
                  {copied ? <><CheckCheck size={14} className="text-emerald-400" /> Copied!</> : <><Copy size={14} /> Copy Markdown</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
