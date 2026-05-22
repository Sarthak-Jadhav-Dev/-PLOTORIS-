"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, CheckCircle2, XCircle, RefreshCw, Loader2, Bot,
  ChevronDown, ChevronRight, BarChart2, Users, Zap, Image, BookOpen,
  FileText, Microscope, PenLine, BookMarked, Star, Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CollaborationEditor } from "@/components/chat/phase9/collaboration-editor";

// ─── Types ───────────────────────────────────────────────────────────────────

interface JurorResult {
  jurorName: string;
  score: number;
  comments: string;
  mustFix: string[];
}

interface JuryRound {
  section: string;
  round: number;
  jurors: JurorResult[];
  avgScore: number;
  syncDecision: "PASS" | "REVISE";
  syncReason: string;
}

// ─── Section color palette ────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
  "Abstract": "#6366f1",
  "I. INTRODUCTION": "#8b5cf6",
  "II. LITERATURE REVIEW": "#06b6d4",
  "III. METHODOLOGY": "#f59e0b",
  "IV. RESULTS AND DISCUSSION": "#10b981",
  "V. CONCLUSION": "#ef4444",
  "References": "#ec4899",
  "Visual Architect": "#14b8a6",
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  "Abstract": <FileText size={12} />,
  "I. INTRODUCTION": <BookOpen size={12} />,
  "II. LITERATURE REVIEW": <BookMarked size={12} />,
  "III. METHODOLOGY": <Microscope size={12} />,
  "IV. RESULTS AND DISCUSSION": <BarChart2 size={12} />,
  "V. CONCLUSION": <PenLine size={12} />,
  "Visual Architect": <Image size={12} />,
};

// ─── Juror Score Badge ────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? "#10b981" : score >= 7 ? "#6366f1" : score >= 5 ? "#f59e0b" : "#ef4444";
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
      style={{ background: color }}
    >
      {score}
    </div>
  );
}

// ─── Jury Round Card ──────────────────────────────────────────────────────────
function JuryRoundCard({ round, isLast }: { round: JuryRound; isLast: boolean }) {
  const [expanded, setExpanded] = useState(isLast);
  const sectionColor = SECTION_COLORS[round.section] || "#6b7280";
  const icon = SECTION_ICONS[round.section];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[#1e1e1e] rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#111] hover:bg-[#161616] transition-colors text-left"
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center text-white shrink-0"
          style={{ background: sectionColor }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-white truncate">{round.section}</span>
            <span className="text-[10px] text-[#555]">Round {round.round}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{
              background: round.syncDecision === "PASS" ? "#052e1a" : "#2d1800",
              color: round.syncDecision === "PASS" ? "#34d399" : "#fb923c",
            }}
          >
            {round.syncDecision === "PASS" ? "✓ PASS" : "↺ REVISE"}
          </div>
          <div className="text-[10px] font-semibold" style={{ color: sectionColor }}>
            {round.avgScore}/10
          </div>
          {expanded ? <ChevronDown size={12} className="text-[#555]" /> : <ChevronRight size={12} className="text-[#555]" />}
        </div>
      </button>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 bg-[#0d0d0d] space-y-3">
              {/* Jurors */}
              {round.jurors.map((juror, i) => (
                <div key={i} className="flex items-start gap-3 bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                  <ScoreBadge score={juror.score} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[#ccc] mb-1">{juror.jurorName}</p>
                    <p className="text-[10px] text-[#888] leading-relaxed">{juror.comments}</p>
                    {juror.mustFix.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {juror.mustFix.map((fix, fi) => (
                          <div key={fi} className="flex items-start gap-1.5">
                            <span className="text-amber-500 text-[9px] mt-0.5 shrink-0">▶</span>
                            <span className="text-[10px] text-amber-400/80">{fix}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Synchronizer verdict */}
              <div
                className="rounded-lg p-3 border"
                style={{
                  background: round.syncDecision === "PASS" ? "#031a0e" : "#1a0f00",
                  borderColor: round.syncDecision === "PASS" ? "#064e3b" : "#7c2d12",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={11} className={round.syncDecision === "PASS" ? "text-emerald-400" : "text-orange-400"} />
                  <span className="text-[10px] font-semibold" style={{ color: round.syncDecision === "PASS" ? "#34d399" : "#fb923c" }}>
                    Synchronizer: {round.syncDecision}
                  </span>
                </div>
                <p className="text-[10px] text-[#888]">{round.syncReason}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Progress Steps (before jury log) ────────────────────────────────────────
const PIPELINE_STEPS = [
  { label: "Fetching Cross-Phase Context", icon: <Bot size={12} />, duration: 3000 },
  { label: "Drafting Abstract", icon: <FileText size={12} />, duration: 8000 },
  { label: "Jury: Abstract", icon: <Users size={12} />, duration: 6000 },
  { label: "Drafting Introduction", icon: <BookOpen size={12} />, duration: 9000 },
  { label: "Jury: Introduction", icon: <Users size={12} />, duration: 7000 },
  { label: "Drafting Literature Review", icon: <BookMarked size={12} />, duration: 10000 },
  { label: "Jury: Literature Review", icon: <Users size={12} />, duration: 8000 },
  { label: "Drafting Methodology", icon: <Microscope size={12} />, duration: 9000 },
  { label: "Jury: Methodology", icon: <Users size={12} />, duration: 7000 },
  { label: "Drafting Results & Discussion", icon: <BarChart2 size={12} />, duration: 12000 },
  { label: "Jury: Results & Discussion", icon: <Users size={12} />, duration: 9000 },
  { label: "Drafting Conclusion", icon: <PenLine size={12} />, duration: 7000 },
  { label: "Visual Architect", icon: <Image size={12} />, duration: 8000 },
  { label: "Final Compilation", icon: <Award size={12} />, duration: 3000 },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PhaseNineView({ projectId }: { projectId: string }) {
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftResult, setDraftResult] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [juryLog, setJuryLog] = useState<JuryRound[]>([]);
  const [stats, setStats] = useState<{ totalRounds: number; sectionsProcessed: number; hasVisuals: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startDrafting = async () => {
    setIsDrafting(true);
    setProgress(0);
    setActiveStep(0);
    setCompletedSteps([]);
    setJuryLog([]);
    setStats(null);
    setError(null);

    // Simulate step-by-step progress during the long API call
    let stepIdx = 0;
    const totalDuration = PIPELINE_STEPS.reduce((s, p) => s + p.duration, 0);
    let elapsed = 0;

    const stepInterval = setInterval(() => {
      if (stepIdx < PIPELINE_STEPS.length - 1) {
        elapsed += PIPELINE_STEPS[stepIdx].duration;
        const pct = Math.min(92, Math.round((elapsed / totalDuration) * 100));
        setProgress(pct);
        setCompletedSteps((prev) => [...prev, stepIdx]);
        stepIdx++;
        setActiveStep(stepIdx);
      }
    }, PIPELINE_STEPS.reduce((s, p) => s + p.duration, 0) / PIPELINE_STEPS.length);

    try {
      const activeTextProvider =
        localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const textKey =
        localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }

      const res = await fetch("/api/phase9/draft", {
        method: "POST",
        headers,
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Drafting failed");

      clearInterval(stepInterval);
      setCompletedSteps(PIPELINE_STEPS.map((_, i) => i));
      setActiveStep(-1);
      setProgress(100);
      setDraftResult(data.draft);
      setJuryLog(data.juryLog || []);
      setStats(data.stats || null);
    } catch (e: any) {
      clearInterval(stepInterval);
      setError(e.message);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#050505] text-[#d4d4d4] font-sans relative">
      {/* ── Left Panel ── */}
      {!isExpanded && (
        <div className="w-full lg:w-[38%] h-full border-r border-[#1a1a1a] flex flex-col bg-[#080808] z-20 shadow-2xl">
          {/* Header */}
          <div className="p-5 border-b border-[#1a1a1a] shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-[#ccfbf1] text-[#0f766e] hover:bg-[#ccfbf1] font-medium rounded-full px-3 py-0.5 border border-[#99f6e4]">
                Phase 9
              </Badge>
              <Badge className="bg-[#1e1b4b] text-[#818cf8] font-medium rounded-full px-3 py-0.5 border border-[#3730a3]">
                Grand Jury Pipeline
              </Badge>
            </div>
            <h1 className="text-lg font-bold text-white mb-1">AI Research Paper Drafting</h1>
            <p className="text-xs text-[#666]">
              6 section agents · 3 jury evaluators per section · Synchronizer · Visual Architect
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Idle state */}
            {!draftResult && !isDrafting && !error && (
              <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Bot size={28} className="text-white" />
                </div>
                <h3 className="text-white font-semibold text-sm mb-2">Grand Jury Pipeline Ready</h3>
                <p className="text-xs text-[#555] mb-5 leading-relaxed">
                  The AI team will draft each section, evaluate it with 3 specialized jurors, and revise until it reaches publication quality. Visual diagrams and tables are generated automatically.
                </p>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { icon: <PenLine size={14} />, label: "6 Sections", color: "#6366f1" },
                    { icon: <Users size={14} />, label: "3 Jurors", color: "#10b981" },
                    { icon: <Image size={14} />, label: "Auto-Visuals", color: "#f59e0b" },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3 flex flex-col items-center gap-1.5">
                      <div style={{ color: item.color }}>{item.icon}</div>
                      <span className="text-[10px] text-[#888]">{item.label}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={startDrafting}
                  className="w-full bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white gap-2 font-semibold"
                >
                  <Play size={14} />
                  Launch AI Team
                </Button>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={14} className="text-red-400" />
                  <span className="text-sm font-semibold text-red-400">Pipeline Failed</span>
                </div>
                <p className="text-xs text-red-300/80">{error}</p>
                <Button
                  onClick={startDrafting}
                  variant="outline"
                  className="mt-3 w-full border-red-900 text-red-400 hover:bg-red-950"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Active drafting — pipeline steps */}
            {isDrafting && (
              <div className="space-y-3">
                {/* Progress bar */}
                <div className="bg-[#0e0e0e] border border-[#1e1e1e] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin text-teal-400" />
                      Pipeline Running...
                    </span>
                    <span className="text-xs font-bold text-teal-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-[#1a1a1a] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-indigo-500"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Step list */}
                <div className="space-y-1.5">
                  {PIPELINE_STEPS.map((step, i) => {
                    const isDone = completedSteps.includes(i);
                    const isActive = activeStep === i;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                          isActive ? "bg-teal-950/40 border border-teal-900/50" :
                          isDone ? "opacity-60" : "opacity-30"
                        }`}
                      >
                        <div className={`shrink-0 ${isDone ? "text-emerald-500" : isActive ? "text-teal-400" : "text-[#444]"}`}>
                          {isDone ? <CheckCircle2 size={12} /> : isActive ? <Loader2 size={12} className="animate-spin" /> : step.icon}
                        </div>
                        <span className={`text-[11px] ${isActive ? "text-white font-medium" : "text-[#666]"}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Done state — Stats + Jury Log */}
            {!isDrafting && draftResult && (
              <div className="space-y-3">
                {/* Success banner */}
                <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <Star size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-400">Paper Complete!</p>
                    {stats && (
                      <p className="text-[10px] text-emerald-600">
                        {stats.sectionsProcessed} sections · {stats.totalRounds} jury rounds · {stats.hasVisuals ? "✓ Visuals" : "No visuals"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Re-draft button */}
                <Button
                  onClick={startDrafting}
                  variant="outline"
                  className="w-full border-[#222] text-[#888] hover:text-white hover:border-teal-900 gap-2 text-xs"
                >
                  <RefreshCw size={12} />
                  Re-draft with New Jury Session
                </Button>

                {/* Jury Log */}
                {juryLog.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider px-1">
                      Jury Evaluation Log
                    </h3>
                    {juryLog.map((round, i) => (
                      <JuryRoundCard key={i} round={round} isLast={i === juryLog.length - 1} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Right Panel: Collaborative Editor ── */}
      <div
        className={`${isExpanded ? "w-full block" : "hidden lg:block lg:w-[62%]"} h-full relative bg-[#e5e7eb] transition-all duration-300`}
      >
        <CollaborationEditor
          projectId={projectId}
          initialDraft={draftResult || undefined}
          isExpanded={isExpanded}
          onToggleExpand={() => setIsExpanded(!isExpanded)}
        />
      </div>
    </div>
  );
}
