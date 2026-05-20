"use client";

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";

import {
  Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Sparkles,
  BookOpen, ShieldAlert, Quote as QuoteIcon, Download, ChevronRight,
  Loader2, Copy, CheckCheck, RefreshCw, Search, CheckCircle2, AlertTriangle, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Default manuscript content
const DEFAULT_CONTENT = `<h1>The Impact of Social Media Usage on Academic Performance: A Quasi-Experimental Study</h1>

<h2>Abstract</h2>
<p>This study investigates the relationship between daily social media usage and academic performance among undergraduate students. A quasi-experimental design was employed with a sample of 385 participants. Results indicate a statistically significant negative relationship (β = −0.45, p = 0.02), supporting the alternative hypothesis. Implications for digital wellness interventions are discussed.</p>

<h2>1. Introduction</h2>
<p>The proliferation of social media platforms has fundamentally altered the informational and social landscape experienced by contemporary undergraduate students. While platforms such as Instagram, TikTok, and X (formerly Twitter) offer significant opportunities for social connection and information access, concerns regarding their impact on academic productivity and performance have attracted increasing scholarly attention (Jones et al., 2021).</p>
<p>The present study seeks to address a specific gap in the literature: the causal relationship between measurable social media usage and quantifiable academic outcomes under controlled conditions. To this end, a quasi-experimental design was employed, enabling preliminary causal inference while accommodating the ethical constraints inherent in restricting participants' digital access.</p>

<h2>2. Literature Review</h2>
<p>Click the AI Writing Assistant to auto-draft this section from your Phase 2 literature corpus...</p>

<h2>3. Methodology</h2>
<p>Click the AI Writing Assistant to pull in your Phase 4 methodology draft...</p>

<h2>4. Results</h2>
<p>Click the AI Writing Assistant to generate this section from your Phase 6 analysis outputs...</p>

<h2>5. Discussion</h2>
<p>Click the AI Writing Assistant to synthesize findings, verdicts, and literature comparisons...</p>

<h2>6. Conclusion</h2>
<p></p>

<h2>References</h2>
<p>Jones, A., Smith, B., & Williams, C. (2021). Social media and academic performance: A systematic review. <em>Journal of Educational Technology, 45</em>(3), 112–128. https://doi.org/10.1000/jet.2021.45.3.112</p>`;

const OUTLINE_SECTIONS = [
  { id: "abstract", label: "Abstract", heading: "Abstract" },
  { id: "intro", label: "1. Introduction", heading: "1. Introduction" },
  { id: "lit", label: "2. Literature Review", heading: "2. Literature Review" },
  { id: "method", label: "3. Methodology", heading: "3. Methodology" },
  { id: "results", label: "4. Results", heading: "4. Results" },
  { id: "discussion", label: "5. Discussion", heading: "5. Discussion" },
  { id: "conclusion", label: "6. Conclusion", heading: "6. Conclusion" },
  { id: "references", label: "References", heading: "References" },
];

type RightPanel = "ai" | "citations" | "consistency" | null;

export default function ManuscriptEditor() {
  const [rightPanel, setRightPanel] = useState<RightPanel>("ai");
  const [wordCount, setWordCount] = useState(0);
  const [citationStyle, setCitationStyle] = useState("APA");
  const [isSaved, setIsSaved] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing your research paper..." }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
      Typography,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
    ],
    content: DEFAULT_CONTENT,
    onUpdate: ({ editor }) => {
      setWordCount(editor.storage.characterCount.words());
      setIsSaved(false);
      setTimeout(() => setIsSaved(true), 1500);
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-lg max-w-none focus:outline-none min-h-full px-16 py-12 font-serif",
      },
    },
  });

  const scrollToSection = (heading: string) => {
    const editorEl = document.querySelector(".ProseMirror");
    if (!editorEl) return;
    const headings = editorEl.querySelectorAll("h1, h2");
    for (const h of Array.from(headings)) {
      if (h.textContent?.includes(heading)) {
        h.scrollIntoView({ behavior: "smooth", block: "start" });
        break;
      }
    }
  };

  if (!editor) return null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT SIDEBAR — Outline */}
      <div className="w-52 shrink-0 border-r border-[#222] bg-[#0d0d0d] flex flex-col">
        <div className="px-4 py-3 border-b border-[#333]">
          <p className="text-[10px] font-black text-[#888] uppercase tracking-widest">Document Outline</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {OUTLINE_SECTIONS.map(s => (
            <button key={s.id} onClick={() => scrollToSection(s.heading)}
              className="w-full text-left px-4 py-2 text-xs text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors rounded-lg mx-2" style={{ width: "calc(100% - 16px)" }}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="border-t border-[#333] p-3 space-y-1">
          <p className="text-[9px] text-[#555] uppercase tracking-wider">Citation Style</p>
          <select value={citationStyle} onChange={e => setCitationStyle(e.target.value)}
            className="w-full bg-[#111] border border-[#333] text-white text-xs rounded px-2 py-1">
            {["APA", "MLA", "IEEE", "Chicago", "Vancouver"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* CENTER — Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="shrink-0 border-b border-[#333] bg-[#111] px-4 py-2 flex items-center gap-1 flex-wrap">
          {[
            { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
            { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
            { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline") },
            { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
          ].map(({ icon: Icon, action, active }, i) => (
            <button key={i} onClick={action} className={`p-1.5 rounded hover:bg-[#333] transition-colors ${active ? "bg-[#333] text-white" : "text-[#888]"}`}>
              <Icon size={14} />
            </button>
          ))}

          <div className="w-px h-5 bg-[#333] mx-1" />

          {[
            { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
            { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
            { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
          ].map(({ icon: Icon, action, active }, i) => (
            <button key={i} onClick={action} className={`p-1.5 rounded hover:bg-[#333] transition-colors ${active ? "bg-[#333] text-white" : "text-[#888]"}`}>
              <Icon size={14} />
            </button>
          ))}

          <div className="w-px h-5 bg-[#333] mx-1" />

          {[
            { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign("left").run() },
            { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign("center").run() },
            { icon: AlignRight, action: () => editor.chain().focus().setTextAlign("right").run() },
          ].map(({ icon: Icon, action }, i) => (
            <button key={i} onClick={action} className="p-1.5 rounded hover:bg-[#333] text-[#888] transition-colors">
              <Icon size={14} />
            </button>
          ))}

          <div className="w-px h-5 bg-[#333] mx-1" />

          {[
            { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
            { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
            { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
            { icon: Code, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive("codeBlock") },
          ].map(({ icon: Icon, action, active }, i) => (
            <button key={i} onClick={action} className={`p-1.5 rounded hover:bg-[#333] transition-colors ${active ? "bg-[#333] text-white" : "text-[#888]"}`}>
              <Icon size={14} />
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-[#666]">{wordCount} words</span>
            <span className={`text-[10px] font-medium ${isSaved ? "text-emerald-500" : "text-amber-400"}`}>
              {isSaved ? "● Saved" : "● Saving..."}
            </span>
            <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-[#444] text-white hover:bg-[#222]">
              <Download size={12} className="mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Right Panel Toggle Bar */}
        <div className="shrink-0 border-b border-[#222] bg-[#0a0a0a] px-4 flex items-center gap-1">
          {[
            { id: "ai" as RightPanel, label: "AI Assistant", icon: Sparkles, color: "text-violet-400" },
            { id: "citations" as RightPanel, label: "Citations", icon: BookOpen, color: "text-blue-400" },
            { id: "consistency" as RightPanel, label: "Consistency Check", icon: ShieldAlert, color: "text-amber-400" },
          ].map(({ id, label, icon: Icon, color }) => (
            <button key={id} onClick={() => setRightPanel(rightPanel === id ? null : id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${rightPanel === id ? `${color} border-current` : "text-[#666] border-transparent hover:text-[#888]"}`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Editor + Right Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor */}
          <div className="flex-1 overflow-y-auto bg-[#0d0d0d]">
            <EditorContent editor={editor} className="h-full" />
          </div>

          {/* Right Panel */}
          <AnimatePresence>
            {rightPanel && (
              <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 340, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                className="shrink-0 border-l border-[#222] bg-[#111] overflow-hidden">
                <div className="w-[340px] h-full overflow-y-auto">
                  {rightPanel === "ai" && <AIAssistantPanel editor={editor} />}
                  {rightPanel === "citations" && <CitationPanel editor={editor} style={citationStyle} />}
                  {rightPanel === "consistency" && <ConsistencyPanel />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============ AI ASSISTANT PANEL ============
function AIAssistantPanel({ editor }: { editor: any }) {
  const [selectedSection, setSelectedSection] = useState("Discussion");
  const [tone, setTone] = useState("academic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateSection = async () => {
    setIsGenerating(true);
    setGenerated(null);
    try {
      const res = await fetch("/api/phase8/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: selectedSection, tone }),
      });
      const data = await res.json();
      setGenerated(data.content);
    } catch {}
    finally { setIsGenerating(false); }
  };

  const insertIntoEditor = () => {
    if (!generated || !editor) return;
    editor.chain().focus().insertContent(`<p>${generated}</p>`).run();
    setGenerated(null);
  };

  const copyToClipboard = () => {
    if (generated) {
      navigator.clipboard.writeText(generated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-violet-400" />
        <h3 className="text-sm font-bold text-white">AI Writing Assistant</h3>
      </div>

      <div>
        <label className="text-[10px] text-[#888] uppercase font-bold block mb-1">Section to Draft</label>
        <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2">
          {["Abstract", "Introduction", "Literature Review", "Methodology", "Results", "Discussion", "Conclusion"].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className="text-[10px] text-[#888] uppercase font-bold block mb-2">Tone</label>
        <div className="flex gap-2">
          {["academic", "technical", "concise"].map(t => (
            <button key={t} onClick={() => setTone(t)}
              className={`flex-1 py-1.5 rounded border text-xs font-semibold capitalize transition-all ${tone === t ? "bg-violet-500/20 border-violet-500 text-violet-400" : "bg-[#0d0d0d] border-[#333] text-[#888] hover:border-[#555]"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={generateSection} disabled={isGenerating} className="w-full bg-violet-600 hover:bg-violet-700 text-white">
        {isGenerating ? <><Loader2 size={14} className="mr-2 animate-spin" />Generating...</> : <><Sparkles size={14} className="mr-2" />Draft {selectedSection}</>}
      </Button>

      {isGenerating && (
        <div className="text-center py-6">
          <Loader2 size={24} className="animate-spin text-violet-500 mx-auto mb-2" />
          <p className="text-xs text-[#888] animate-pulse">RAG agent reading project context...</p>
        </div>
      )}

      {generated && (
        <div className="space-y-3">
          <div className="bg-[#0d0d0d] border border-[#333] rounded-lg p-4 text-xs text-[#d4d4d4] leading-relaxed font-serif max-h-80 overflow-y-auto">
            {generated}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={insertIntoEditor} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
              <ChevronRight size={12} className="mr-1" /> Insert into Doc
            </Button>
            <Button size="sm" variant="outline" onClick={copyToClipboard} className="border-[#444] text-white hover:bg-[#222] text-xs h-8">
              {copied ? <CheckCheck size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </Button>
          </div>
        </div>
      )}

      <div className="border-t border-[#333] pt-4">
        <p className="text-[10px] text-[#888] uppercase font-bold mb-3">Quick Actions</p>
        <div className="space-y-2">
          {[
            { label: "Improve Academic Tone", section: "selection" },
            { label: "Expand Current Paragraph", section: "expand" },
            { label: "Generate Abstract", section: "Abstract" },
          ].map((action) => (
            <button key={action.label} onClick={() => { setSelectedSection(action.section); generateSection(); }}
              className="w-full text-left px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[#333] hover:border-[#555] text-xs text-[#888] hover:text-white transition-colors">
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ CITATION PANEL ============
function CitationPanel({ editor, style }: { editor: any; style: string }) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const searchCitations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch("/api/phase8/search-citations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, style }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch {}
    finally { setIsSearching(false); }
  };

  const insertCitation = (citation: any) => {
    if (!editor) return;
    editor.chain().focus().insertContent(
      `<span style="color: #60a5fa"> (${citation.intext})</span>`
    ).run();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen size={16} className="text-blue-400" />
        <h3 className="text-sm font-bold text-white">Citation Inserter</h3>
        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded ml-auto">{style}</span>
      </div>

      <form onSubmit={searchCitations} className="flex gap-2">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search papers (Crossref API)..."
          className="flex-1 bg-[#0d0d0d] border border-[#333] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors" />
        <Button type="submit" size="sm" disabled={isSearching} className="bg-blue-600 hover:bg-blue-700 text-white px-3 h-8">
          {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
        </Button>
      </form>

      {isSearching && (
        <div className="text-center py-4">
          <Loader2 size={20} className="animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-[#888]">Querying Crossref API...</p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((result, i) => (
          <div key={i} className="bg-[#0d0d0d] border border-[#333] hover:border-blue-500/40 rounded-xl p-3 transition-all">
            <p className="text-xs font-semibold text-white mb-1 leading-snug">{result.title}</p>
            <p className="text-[10px] text-[#888] mb-2">{result.authors} ({result.year})</p>
            <p className="text-[10px] text-[#666] font-mono italic mb-3 leading-relaxed">{result.formatted}</p>
            <Button size="sm" onClick={() => insertCitation(result)}
              className="w-full bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-xs h-7 border border-blue-500/20 hover:border-blue-500">
              <QuoteIcon size={11} className="mr-1" /> Insert ({result.intext})
            </Button>
          </div>
        ))}

        {results.length === 0 && !isSearching && query && (
          <p className="text-xs text-[#666] text-center py-4">No results found. Try different keywords.</p>
        )}

        {!query && (
          <div className="text-center py-6 text-[#555]">
            <BookOpen size={24} className="mx-auto mb-2" />
            <p className="text-xs">Search to find papers from Crossref</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ CONSISTENCY CHECKER PANEL ============
function ConsistencyPanel() {
  const [isChecking, setIsChecking] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [checked, setChecked] = useState(false);

  const runCheck = async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/phase8/consistency-check", { method: "POST" });
      const data = await res.json();
      setIssues(data.issues || []);
      setChecked(true);
    } catch {}
    finally { setIsChecking(false); }
  };

  const severityConfig: Record<string, { icon: any; color: string }> = {
    "critical": { icon: XCircle, color: "text-rose-400" },
    "warning": { icon: AlertTriangle, color: "text-amber-400" },
    "minor": { icon: CheckCircle2, color: "text-blue-400" },
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert size={16} className="text-amber-400" />
        <h3 className="text-sm font-bold text-white">Consistency Checker</h3>
      </div>

      <Button onClick={runCheck} disabled={isChecking} className="w-full bg-amber-600 hover:bg-amber-700 text-white">
        {isChecking ? <><Loader2 size={14} className="mr-2 animate-spin" />Checking...</> : <><ShieldAlert size={14} className="mr-2" />Run Consistency Check</>}
      </Button>

      {isChecking && (
        <div className="text-center py-6">
          <Loader2 size={24} className="animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-[#888] animate-pulse">LangChain agent scanning manuscript...</p>
        </div>
      )}

      {checked && !isChecking && (
        <div>
          <div className={`flex items-center justify-between p-3 rounded-lg mb-3 ${issues.length === 0 ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
            <span className="text-xs font-semibold text-white">{issues.length === 0 ? "No issues found!" : `${issues.length} issues detected`}</span>
            {issues.length > 0 && <span className="text-[10px] text-amber-400">{issues.filter(i => i.severity === "critical").length} critical</span>}
          </div>

          <div className="space-y-3">
            {issues.map((issue, i) => {
              const config = severityConfig[issue.severity] || severityConfig["minor"];
              const Icon = config.icon;
              return (
                <div key={i} className="bg-[#0d0d0d] border border-[#333] rounded-xl p-3">
                  <div className="flex items-start gap-2 mb-2">
                    <Icon size={14} className={`${config.color} mt-0.5 shrink-0`} />
                    <div>
                      <p className="text-xs font-semibold text-white">{issue.title}</p>
                      <p className="text-[10px] text-[#888] mt-1">{issue.description}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-400 ml-5">Fix: {issue.fix}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
