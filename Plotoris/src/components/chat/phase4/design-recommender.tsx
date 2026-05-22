"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, FlaskConical, CheckCircle2, AlertTriangle, 
  Sparkles, Check, RefreshCw, Save, Trophy, BarChart2, Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DesignOption {
  design_type: string;
  confidence: number;
  tag: string;
  rationale: string;
  pros: string[];
  cons: string[];
}

const TAG_STYLES: Record<string, { border: string; badge: string; icon: any; glow: string }> = {
  "Most Rigorous":    { border: "border-blue-500/50",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",    icon: Trophy,   glow: "shadow-blue-500/10" },
  "Balanced Approach":{ border: "border-emerald-500/50", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", icon: BarChart2, glow: "shadow-emerald-500/10" },
  "Exploratory":      { border: "border-amber-500/50",   badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",    icon: Compass,  glow: "shadow-amber-500/10" },
};

export default function DesignRecommender({ projectId }: { projectId: string }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [options, setOptions] = useState<DesignOption[] | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<DesignOption | null>(null);
  const [savedDesign, setSavedDesign] = useState<DesignOption | null>(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  // On mount, fetch any previously saved selection
  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await fetch(`/api/phase4/recommend-design?project_id=${projectId}`);
        const data = await res.json();
        if (data.selection) {
          setSavedDesign(data.selection);
          setSelectedDesign(data.selection);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingSaved(false);
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

  const handleRecommend = async () => {
    setIsGenerating(true);
    setOptions(null);
    try {
      const res = await fetch("/api/phase4/recommend-design", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json();
      if (data.options) {
        setOptions(data.options);
        // Pre-select the first (most rigorous) option if nothing saved
        if (!savedDesign) setSelectedDesign(data.options[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveSelection = async () => {
    if (!selectedDesign) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/phase4/recommend-design", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ project_id: projectId, selected: selectedDesign })
      });
      if (res.ok) {
        setSavedDesign(selectedDesign);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getTagStyle = (tag: string) => TAG_STYLES[tag] || TAG_STYLES["Exploratory"];

  const DesignCard = ({ option, index }: { option: DesignOption; index: number }) => {
    const style = getTagStyle(option.tag);
    const Icon = style.icon;
    const isSelected = selectedDesign?.design_type === option.design_type;
    const isSaved = savedDesign?.design_type === option.design_type;

    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={() => setSelectedDesign(option)}
        className={`relative bg-[#0d0d0d] border-2 rounded-2xl p-6 cursor-pointer transition-all duration-300 shadow-xl ${
          isSelected ? `${style.border} ${style.glow}` : "border-[#222] hover:border-[#333]"
        }`}
      >
        {/* Selected ring */}
        {isSelected && (
          <div className="absolute top-3 right-3">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          </div>
        )}

        {/* Saved badge */}
        {isSaved && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/10 text-white border-white/20 text-[10px] font-semibold">
              ✓ Saved
            </Badge>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4 mt-3">
          <div className={`p-2.5 rounded-xl ${style.badge.includes("blue") ? "bg-blue-500/10" : style.badge.includes("emerald") ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
            <Icon size={20} className={style.badge.includes("blue") ? "text-blue-400" : style.badge.includes("emerald") ? "text-emerald-400" : "text-amber-400"} />
          </div>
          <div>
            <Badge variant="outline" className={`text-[10px] font-bold border ${style.badge}`}>{option.tag}</Badge>
            <p className="text-[11px] text-[#666] mt-0.5">Confidence: {option.confidence}%</p>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2">{option.design_type}</h3>
        <p className="text-sm text-[#888] leading-relaxed mb-4 line-clamp-3">{option.rationale}</p>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Pros</p>
            <ul className="space-y-1">
              {option.pros.map((p, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-[#888]">
                  <CheckCircle2 size={11} className="text-emerald-500 mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">Cons</p>
            <ul className="space-y-1">
              {option.cons.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-[#888]">
                  <AlertTriangle size={11} className="text-amber-500 mt-0.5 shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoadingSaved) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header + Generate */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">AI Design Recommender</h2>
          <p className="text-sm text-[#888]">
            {savedDesign 
              ? `Currently saved: "${savedDesign.design_type}". Generate new options or change selection below.`
              : "Generate 3 AI-recommended research designs based on your hypothesis and variables."}
          </p>
        </div>
        <Button
          onClick={handleRecommend}
          disabled={isGenerating}
          variant="outline"
          className="border-[#333] text-[#888] hover:text-white hover:bg-[#1a1a1a] gap-2"
        >
          {isGenerating ? (
            <><Loader2 size={15} className="animate-spin" /> Analyzing...</>
          ) : (
            <><RefreshCw size={15} /> {options || savedDesign ? "Re-generate" : "Generate Recommendations"}</>
          )}
        </Button>
      </div>

      {/* Saved Design Banner (when no new options loaded) */}
      {savedDesign && !options && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Selected Design: {savedDesign.design_type}</p>
              <p className="text-xs text-[#888]">This selection has been saved to the database. Re-generate to explore other options.</p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* 3 Cards Grid */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={32} className="animate-spin text-[#444]" />
            <p className="text-sm text-[#666]">Analyzing your hypothesis and variables...</p>
          </motion.div>
        )}

        {options && !isGenerating && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {options.map((opt, i) => (
              <DesignCard key={opt.design_type} option={opt} index={i} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Save Button */}
      {(options || savedDesign) && selectedDesign && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-[#111] border border-[#222] rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-blue-400" />
            <div>
              <p className="text-sm font-semibold text-white">
                Selected: {selectedDesign.design_type}
              </p>
              <p className="text-xs text-[#666]">
                {savedDesign?.design_type === selectedDesign.design_type
                  ? "This design is currently saved."
                  : "Click Save to persist this choice to the database."}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSaveSelection}
            disabled={isSaving || savedDesign?.design_type === selectedDesign.design_type}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {savedDesign?.design_type === selectedDesign.design_type ? "Saved ✓" : "Save Selection"}
          </Button>
        </motion.div>
      )}

      {/* Empty state */}
      {!options && !savedDesign && !isGenerating && (
        <div className="bg-[#0d0d0d] border border-dashed border-[#222] rounded-2xl p-16 flex flex-col items-center text-center">
          <FlaskConical size={40} className="text-[#333] mb-4" />
          <p className="text-white font-semibold mb-1">No recommendations yet</p>
          <p className="text-sm text-[#666]">Click "Generate Recommendations" to analyze your project.</p>
        </div>
      )}
    </div>
  );
}
