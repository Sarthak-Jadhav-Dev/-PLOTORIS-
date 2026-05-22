"use client";

import { useState } from "react";
import { BookOpen, Loader2, Play, FileText, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LitReviewData {
  introduction: string;
  methodology: string;
  results_future: string;
  best_flow: string;
}

export default function LitReviewGenerator({ projectId, bucketPapers }: { projectId: string, bucketPapers: any[] }) {
  const [reviews, setReviews] = useState<Record<string, LitReviewData>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const generateReview = async (paperId: string) => {
    setLoadingStates(prev => ({ ...prev, [paperId]: true }));
    setErrors(prev => ({ ...prev, [paperId]: "" }));
    
    try {
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }

      const res = await fetch("/api/phase2/lit-review", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId, paper_id: paperId }),
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      
      setReviews(prev => ({ ...prev, [paperId]: data.review }));
    } catch (err: any) {
      console.error(err);
      setErrors(prev => ({ ...prev, [paperId]: err.message || "Generation failed" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [paperId]: false }));
    }
  };

  const generateAll = async () => {
    setIsGeneratingAll(true);
    for (const paper of bucketPapers) {
      const pid = paper.id || paper.paper_id;
      if (!reviews[pid]) {
        await generateReview(pid);
      }
    }
    setIsGeneratingAll(false);
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl shadow-xl w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <LayoutList size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Literature Review Generator</h2>
            <p className="text-sm text-[#888]">Automatically extract structured insights from your bucket papers.</p>
          </div>
        </div>
        <Button 
          onClick={generateAll}
          disabled={isGeneratingAll || bucketPapers.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4"
        >
          {isGeneratingAll ? <Loader2 size={16} className="animate-spin mr-2" /> : <Play size={16} className="mr-2" />}
          Generate All
        </Button>
      </div>

      {bucketPapers.length === 0 ? (
        <div className="text-center py-12 text-[#888]">
          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
          <p>Your Knowledge Bucket is empty.</p>
          <p className="text-sm mt-2">Upload or fetch papers first to generate literature reviews.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {bucketPapers.map((paper, i) => {
            const pid = paper.id || paper.paper_id;
            const isLoading = loadingStates[pid];
            const review = reviews[pid];
            const error = errors[pid];

            return (
              <div key={i} className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#222] flex items-start justify-between bg-[#0d0d0d]">
                  <div className="flex gap-3">
                    <FileText size={20} className="text-[#666] mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-white font-semibold">{paper.title}</h3>
                      <p className="text-[#888] text-xs mt-1">{paper.authors} • {paper.year}</p>
                    </div>
                  </div>
                  {!review && !isLoading && (
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={() => generateReview(pid)}
                       className="border-[#333] bg-[#1a1a1a] hover:bg-[#222] text-white flex-shrink-0"
                     >
                       Generate
                     </Button>
                  )}
                  {isLoading && <Loader2 size={20} className="animate-spin text-purple-500" />}
                </div>
                
                {error && (
                  <div className="p-4 bg-rose-500/10 text-rose-400 text-sm border-t border-rose-500/20">
                    Error: {error}
                  </div>
                )}

                {review && (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Introduction
                      </h4>
                      <p className="text-sm text-[#ccc] leading-relaxed">{review.introduction}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Methodology
                      </h4>
                      <p className="text-sm text-[#ccc] leading-relaxed">{review.methodology}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span> Results & Future Scope
                      </h4>
                      <p className="text-sm text-[#ccc] leading-relaxed">{review.results_future}</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400"></span> Best Flow & Citations
                      </h4>
                      <p className="text-sm text-[#ccc] leading-relaxed">{review.best_flow}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
