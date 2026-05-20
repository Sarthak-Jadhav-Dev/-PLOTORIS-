"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileEdit, Loader2, Download, RefreshCw, Sparkles, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MethodologyBuilder({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDraft(null);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase4/draft-methodology", {
        method: "POST",
        headers,
        body: JSON.stringify({ phase: 4, project_id: projectId }),
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

  const sections = draft
    ? draft.split(/\n(?=#{1,2} )/).filter(Boolean)
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
              <FileEdit size={20} className="text-fuchsia-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Methodology Builder</h2>
              <p className="text-sm text-[#888]">Auto-draft your full academic methodology section from all Phase 4 decisions.</p>
            </div>
          </div>

          <div className="flex gap-2">
            {draft && (
              <>
                <Button variant="outline" onClick={handleCopy} className="border-[#444] text-white hover:bg-[#222]">
                  {copied ? <><CheckCheck size={14} className="mr-2 text-emerald-400" /> Copied!</> : <><Copy size={14} className="mr-2" /> Copy</>}
                </Button>
                <Button variant="outline" onClick={handleGenerate} className="border-[#444] text-white hover:bg-[#222]">
                  <RefreshCw size={14} className="mr-2" /> Regenerate
                </Button>
              </>
            )}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6"
            >
              {isGenerating ? (
                <><Loader2 size={16} className="mr-2 animate-spin" /> Drafting...</>
              ) : (
                <><Sparkles size={16} className="mr-2" /> Generate Draft</>
              )}
            </Button>
          </div>
        </div>

        {!draft && !isGenerating && (
          <div className="border-2 border-dashed border-[#333] rounded-xl p-16 text-center flex flex-col items-center">
            <FileEdit size={48} className="text-[#333] mb-4" />
            <h3 className="text-white font-medium mb-2">No draft generated yet</h3>
            <p className="text-[#888] text-sm max-w-md">
              Click "Generate Draft" to create a journal-quality methodology section based on your research design, sample size, and ethics decisions.
            </p>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={40} className="animate-spin text-fuchsia-500 mb-4" />
            <p className="text-white font-medium animate-pulse">Synthesizing methodology sections...</p>
            <p className="text-[#888] text-xs mt-2">Drawing from your design, variables, sample, and ethics decisions</p>
          </div>
        )}

        <AnimatePresence>
          {draft && !isGenerating && (
            <motion.div
              key="draft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Academic-styled editor output */}
              <div
                className="bg-[#0d0d0d] border border-[#333] rounded-xl p-8 font-serif text-[#d4d4d4] leading-relaxed space-y-6 whitespace-pre-wrap min-h-[400px]"
                contentEditable
                suppressContentEditableWarning
              >
                {draft}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#333]">
                <p className="text-xs text-[#666]">
                  This section is editable. Click anywhere in the text above to make changes.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-[#444] text-white hover:bg-[#222]">
                    <Download size={14} className="mr-2" /> Export DOCX
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
