"use client";

import { useState } from "react";
import { FileCheck, Download, AlertTriangle, CheckCircle2, FileText, File, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AutoFormatExporter({ projectId }: { projectId: string }) {
  const [journal, setJournal] = useState("");
  const [customJournal, setCustomJournal] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveJournal = journal === "custom" ? customJournal : journal;

  const handleCheck = async () => {
    if (!effectiveJournal.trim()) return;
    setIsChecking(true);
    setReport(null);
    setError(null);
    try {
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase9/format-check", {
        method: "POST",
        headers,
        body: JSON.stringify({ journal: effectiveJournal, project_id: projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Format check failed");
      setReport(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsChecking(false);
    }
  };

  const severityColor = (s: string) =>
    s === "critical" ? "text-rose-400 border-rose-500/30 bg-rose-500/5"
    : s === "warning" ? "text-amber-400 border-amber-500/30 bg-amber-500/5"
    : "text-blue-400 border-blue-500/30 bg-blue-500/5";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FileCheck size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Auto Format Exporter</h2>
            <p className="text-xs text-[#888]">Checks your manuscript against real journal formatting guidelines using OpenAlex + Gemini AI.</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-[10px] font-bold text-[#888] uppercase tracking-wider mb-1">Target Journal</label>
            <select value={journal} onChange={e => setJournal(e.target.value)} className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500">
              <option value="">— Select or type below —</option>
              <option>Journal of Educational Technology</option>
              <option>Computers in Human Behavior</option>
              <option>Nature Human Behaviour</option>
              <option>PLOS ONE</option>
              <option>Journal of Research in Science Teaching</option>
              <option value="custom">Custom journal name...</option>
            </select>
          </div>
          {journal === "custom" && (
            <input
              value={customJournal}
              onChange={e => setCustomJournal(e.target.value)}
              placeholder="Enter journal name..."
              className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          )}
        </div>

        <Button onClick={handleCheck} disabled={isChecking || !effectiveJournal.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11">
          {isChecking
            ? <><Loader2 size={16} className="mr-2 animate-spin" />Checking Formatting Rules...</>
            : <><FileCheck size={16} className="mr-2" />Validate Compliance</>}
        </Button>

        {isChecking && (
          <div className="py-12 flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-blue-500 mb-4" />
            <p className="text-white font-medium animate-pulse">Fetching journal guidelines from OpenAlex...</p>
            <p className="text-[#888] text-xs mt-1">Running Gemini compliance check against your manuscript</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">{error}</div>
        )}

        {report && (
          <div className="mt-6 space-y-6">
            {/* Score */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0d0d0d] border border-[#333] rounded-xl p-4 text-center">
                <p className="text-[10px] text-[#888] uppercase font-bold mb-1">Compliance Score</p>
                <div className={`text-3xl font-black ${(report.score || 0) >= 80 ? 'text-emerald-400' : (report.score || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {report.score || 0}%
                </div>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                <p className="text-[10px] text-emerald-400 uppercase font-bold mb-1">Passed</p>
                <div className="text-2xl font-black text-emerald-400">{report.passedCount || (report.passed?.length ?? 0)}</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                <p className="text-[10px] text-amber-400 uppercase font-bold mb-1">Issues</p>
                <div className="text-2xl font-black text-amber-400">{report.issues?.length || 0}</div>
              </div>
            </div>

            {/* Issues */}
            {report.issues && report.issues.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Issues to Fix</h3>
                {report.issues.map((issue: any, i: number) => (
                  <div key={i} className={`border rounded-lg p-4 ${severityColor(issue.severity)}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-white">{issue.title}</p>
                        <p className="text-xs text-[#888] mt-1">{issue.description}</p>
                        {issue.fix && (
                          <p className="text-xs mt-2 font-mono bg-black/30 px-2 py-1 rounded inline-block">
                            Fix: {issue.fix}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Passed Checks */}
            {report.passed && report.passed.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Passed Checks</h3>
                {report.passed.map((p: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span className="text-[#888]">{p}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Export Actions */}
            <div className="border-t border-[#333] pt-6 flex flex-wrap gap-3">
              {report.homepage && (
                <a href={report.homepage} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full border-[#444] text-white hover:bg-[#222]">
                    <ExternalLink size={16} className="mr-2" /> Journal Website
                  </Button>
                </a>
              )}
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                <FileText size={16} className="mr-2" /> Export DOCX
              </Button>
              <Button variant="outline" className="border-[#444] text-white hover:bg-[#222] flex-1">
                <Download size={16} className="mr-2" /> Download LaTeX ZIP
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
