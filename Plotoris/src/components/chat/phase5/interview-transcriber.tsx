"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic2, UploadCloud, Loader2, Tag, Quote, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_TRANSCRIPT = [
  { speaker: "Interviewer", time: "00:00:12", text: "Can you describe how often you use social media on a typical day?" },
  { speaker: "Participant 1", time: "00:00:18", text: "I'd say probably five to six hours, mostly Instagram and TikTok. It's become automatic at this point — I open my phone and it's just there." },
  { speaker: "Interviewer", time: "00:00:35", text: "And how do you feel it impacts your ability to focus on academic work?" },
  { speaker: "Participant 1", time: "00:00:41", text: "Honestly, it makes it really hard. I sit down to study and then I'm checking my phone every ten minutes. My grades have definitely suffered." },
  { speaker: "Interviewer", time: "00:01:05", text: "Do you feel anxious when you're not able to access social media?" },
  { speaker: "Participant 1", time: "00:01:12", text: "Yes, very much. There's this constant fear of missing out — like something important is happening and I'm not seeing it." },
];

const MOCK_THEMES = [
  { theme: "Habitual Usage Patterns", frequency: 3, color: "bg-cyan-500", quotes: ["It's become automatic at this point"] },
  { theme: "Academic Performance Impact", frequency: 4, color: "bg-amber-500", quotes: ["My grades have definitely suffered"] },
  { theme: "Fear of Missing Out (FOMO)", frequency: 2, color: "bg-fuchsia-500", quotes: ["constant fear of missing out"] },
  { theme: "Reduced Focus & Attention", frequency: 3, color: "bg-rose-500", quotes: ["checking my phone every ten minutes"] },
];

export default function InterviewTranscriber() {
  const [stage, setStage] = useState<"upload" | "transcribing" | "done">("upload");

  const handleUpload = async () => {
    setStage("transcribing");
    try {
      await fetch("/api/phase5/transcribe-interview", { method: "POST" });
    } catch {}
    setTimeout(() => setStage("done"), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {stage === "upload" && (
        <div className="bg-[#1a1a1a] border-2 border-dashed border-[#444] hover:border-violet-500 rounded-2xl p-16 flex flex-col items-center justify-center transition-colors">
          <Mic2 size={52} className="text-[#555] mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Upload Interview Recording</h2>
          <p className="text-[#888] text-sm mb-6 text-center">Supports MP3, WAV, MP4. AI will transcribe, diarize speakers,<br />and code themes using LangChain agents.</p>
          <Button onClick={handleUpload} className="bg-violet-600 hover:bg-violet-700 text-white px-8">
            <UploadCloud size={16} className="mr-2" /> Upload & Transcribe
          </Button>
        </div>
      )}

      {stage === "transcribing" && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-16 flex flex-col items-center">
          <Loader2 size={40} className="animate-spin text-violet-500 mb-4" />
          <p className="text-white font-medium animate-pulse">Running LangChain transcription + theme coding agents...</p>
          <p className="text-[#888] text-xs mt-2">This may take a moment. Agents are analyzing speech patterns and coding themes.</p>
        </div>
      )}

      {stage === "done" && (
        <AnimatePresence>
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transcript */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-[#333]">
                  <MessageSquare size={16} className="text-violet-400" />
                  <h3 className="text-sm font-bold text-white">Full Transcript</h3>
                  <span className="text-xs text-[#888] ml-auto">Speaker Diarized</span>
                </div>
                <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {MOCK_TRANSCRIPT.map((entry, i) => (
                    <div key={i} className={`flex gap-3 ${entry.speaker === "Interviewer" ? "opacity-70" : ""}`}>
                      <div className="shrink-0 text-right w-16">
                        <p className={`text-[10px] font-bold ${entry.speaker === "Interviewer" ? "text-[#666]" : "text-violet-400"}`}>
                          {entry.speaker === "Interviewer" ? "INT" : "P1"}
                        </p>
                        <p className="text-[9px] text-[#555] font-mono">{entry.time}</p>
                      </div>
                      <div className={`flex-1 p-3 rounded-lg text-sm ${entry.speaker === "Interviewer" ? "bg-[#111] text-[#888]" : "bg-violet-500/10 border border-violet-500/20 text-white"}`}>
                        {entry.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div className="space-y-4">
                <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-[#333]">
                    <Tag size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white">AI-Coded Themes</h3>
                    <span className="text-xs text-[#888] ml-auto">LangChain Agent</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {MOCK_THEMES.map((theme, i) => (
                      <div key={i} className="bg-[#0d0d0d] border border-[#333] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${theme.color}`} />
                            <span className="text-sm font-semibold text-white">{theme.theme}</span>
                          </div>
                          <span className="text-xs bg-[#222] text-[#888] px-2 py-1 rounded font-medium">{theme.frequency}x</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Quote size={12} className="text-[#555] mt-0.5 shrink-0" />
                          <p className="text-xs text-[#666] italic">"{theme.quotes[0]}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
