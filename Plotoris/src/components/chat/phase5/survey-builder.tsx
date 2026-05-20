"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, Trash2, GripVertical, Loader2, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type QuestionType = "short_text" | "long_text" | "multiple_choice" | "likert" | "numeric" | "checkbox";

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  required: boolean;
}

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "checkbox", label: "Checkbox" },
  { value: "likert", label: "Likert Scale" },
  { value: "numeric", label: "Numeric" },
];

const LIKERT_LABELS = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

export default function SurveyBuilder() {
  const [surveyTitle, setSurveyTitle] = useState("Research Survey");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", type: "short_text", text: "What is your age?", required: true },
    { id: "q2", type: "likert", text: "Rate your agreement with the following statement.", required: true },
    { id: "q3", type: "multiple_choice", text: "What is your primary area of study?", required: false, options: ["Science", "Engineering", "Arts", "Social Sciences"] },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, {
      id: `q${Date.now()}`,
      type: "short_text",
      text: "New question",
      required: false,
    }]);
  };

  const removeQuestion = (id: string) => setQuestions(questions.filter(q => q.id !== id));

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/phase5/generate-survey", { method: "POST" });
      const data = await res.json();
      if (data.questions) setQuestions(data.questions);
      if (data.title) setSurveyTitle(data.title);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Controls */}
      <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
            <ClipboardList size={20} className="text-cyan-400" />
          </div>
          <input
            value={surveyTitle}
            onChange={(e) => setSurveyTitle(e.target.value)}
            className="bg-transparent text-xl font-bold text-white focus:outline-none border-b border-transparent focus:border-[#444] transition-colors flex-1"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={handleAIGenerate} disabled={isGenerating} className="border-[#444] text-white hover:bg-[#222]">
            {isGenerating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Sparkles size={14} className="mr-2 text-cyan-400" />}
            AI Generate
          </Button>
          <Button onClick={() => setIsPublished(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            <Send size={14} className="mr-2" /> Publish
          </Button>
        </div>
      </div>

      {isPublished && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-emerald-400 font-semibold">Survey Published!</p>
            <p className="text-xs text-[#888] mt-1">Share this link with participants:</p>
            <code className="text-xs text-cyan-400 mt-1 block">https://plotoris.app/s/{surveyTitle.toLowerCase().replace(/\s+/g, '-')}</code>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsPublished(false)} className="border-[#444] text-white shrink-0">Unpublish</Button>
        </motion.div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        <AnimatePresence>
          {questions.map((q, idx) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-[#1a1a1a] border border-[#333] rounded-xl p-5 group"
            >
              <div className="flex items-start gap-3 mb-4">
                <GripVertical size={16} className="text-[#444] mt-1 cursor-grab" />
                <span className="text-xs font-bold text-[#555] mt-1 w-6 shrink-0">Q{idx + 1}</span>
                <input
                  value={q.text}
                  onChange={(e) => updateQuestion(q.id, "text", e.target.value)}
                  className="flex-1 bg-transparent text-white font-medium focus:outline-none border-b border-transparent focus:border-[#555] transition-colors"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestion(q.id, "type", e.target.value)}
                    className="bg-[#111] border border-[#333] text-[#888] text-xs rounded px-2 py-1"
                  >
                    {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <button onClick={() => removeQuestion(q.id)} className="text-[#555] hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="ml-9">
                {q.type === "short_text" && <div className="h-9 rounded border border-[#333] bg-[#0d0d0d] w-full" />}
                {q.type === "long_text" && <div className="h-20 rounded border border-[#333] bg-[#0d0d0d] w-full" />}
                {q.type === "numeric" && <div className="h-9 rounded border border-[#333] bg-[#0d0d0d] w-32" />}
                {q.type === "likert" && (
                  <div className="flex gap-2">
                    {LIKERT_LABELS.map((label, i) => (
                      <div key={i} className="flex-1 text-center">
                        <div className="w-6 h-6 rounded-full border border-[#444] mx-auto mb-1" />
                        <p className="text-[9px] text-[#666]">{label}</p>
                      </div>
                    ))}
                  </div>
                )}
                {(q.type === "multiple_choice" || q.type === "checkbox") && (
                  <div className="space-y-2">
                    {(q.options || ["Option 1", "Option 2"]).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-4 h-4 border border-[#444] ${q.type === "checkbox" ? "rounded" : "rounded-full"}`} />
                        <span className="text-sm text-[#888]">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <Button onClick={addQuestion} variant="outline" className="w-full border-dashed border-[#444] text-[#888] hover:text-white hover:bg-[#1a1a1a]">
          <Plus size={16} className="mr-2" /> Add Question
        </Button>
      </div>
    </div>
  );
}
