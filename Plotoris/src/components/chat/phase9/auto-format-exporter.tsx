"use client";

import { useState } from "react";
import { FileCheck, Download, AlertTriangle, CheckCircle2, FileText, File, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AutoFormatExporter() {
  const [journal, setJournal] = useState("Journal of Educational Technology");
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleCheck = async () => {
    setIsChecking(true);
    setReport(null);
    try {
      const res = await fetch("/api/phase9/format-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal })
      });
      const data = await res.json();
      setReport(data);
    } catch {}
    finally { setIsChecking(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FileCheck size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Auto Format Exporter</h2>
            <p className="text-xs text-[#888]">Validate and export manuscript matching exact journal guidelines.</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <select value={journal} onChange={e => setJournal(e.target.value)} className="flex-1 bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2">
            <option>Journal of Educational Technology</option>
            <option>Computers in Human Behavior</option>
            <option>Nature Human Behaviour</option>
          </select>
          <Button onClick={handleCheck} disabled={isChecking} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isChecking ? <Loader2 size={16} className="animate-spin mr-2" /> : <FileCheck size={16} className="mr-2" />}
            Validate Compliance
          </Button>
        </div>

        {isChecking && (
          <div className="py-12 flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-blue-500 mb-4" />
            <p className="text-white font-medium animate-pulse">Checking formatting rules...</p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Passed Checks</p>
                <div className="text-2xl font-black text-emerald-400">{report.passedCount}</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-[10px] text-amber-400 font-bold uppercase mb-1">Formatting Issues</p>
                <div className="text-2xl font-black text-amber-400">{report.issues.length}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#888] uppercase tracking-wider">Compliance Report</h3>
              {report.issues.map((issue: any, i: number) => (
                <div key={i} className="bg-[#0d0d0d] border border-[#333] rounded-lg p-4 flex gap-3">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-white">{issue.title}</p>
                    <p className="text-xs text-[#888] mt-1">{issue.description}</p>
                    <p className="text-[10px] text-blue-400 mt-2 font-mono bg-blue-500/10 px-2 py-1 rounded inline-block">Auto-fix available</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#333] pt-6 flex flex-wrap gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                <FileText size={16} className="mr-2" /> Export DOCX
              </Button>
              <Button variant="outline" className="border-[#444] text-white hover:bg-[#222] flex-1">
                <File size={16} className="mr-2" /> Export PDF
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
