"use client";

import { useState } from "react";
import { Kanban, Clock, CheckCircle2, XCircle, AlertCircle, FileText, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SubmissionStatus = "Under Review" | "Major Revision" | "Minor Revision" | "Accepted" | "Rejected";

interface Submission {
  id: string;
  journal: string;
  status: SubmissionStatus;
  dateSubmitted: string;
  decisionDate?: string;
  editor?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<SubmissionStatus, { color: string; bg: string; icon: any }> = {
  "Under Review": { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Clock },
  "Major Revision": { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", icon: AlertCircle },
  "Minor Revision": { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", icon: AlertCircle },
  "Accepted": { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: CheckCircle2 },
  "Rejected": { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", icon: XCircle },
};

const COLUMNS: { id: SubmissionStatus[]; label: string; color: string }[] = [
  { id: ["Under Review"], label: "Under Review", color: "text-blue-400" },
  { id: ["Major Revision", "Minor Revision"], label: "Revisions", color: "text-amber-400" },
  { id: ["Accepted", "Rejected"], label: "Decisions", color: "text-[#888]" },
];

export default function SubmissionTracker({ projectId }: { projectId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    journal: "",
    status: "Under Review" as SubmissionStatus,
    dateSubmitted: new Date().toISOString().slice(0, 10),
    editor: "",
    notes: "",
  });

  const addSubmission = () => {
    if (!form.journal.trim()) return;
    setSubmissions([...submissions, { ...form, id: `sub-${Date.now()}` }]);
    setForm({ journal: "", status: "Under Review", dateSubmitted: new Date().toISOString().slice(0, 10), editor: "", notes: "" });
    setShowForm(false);
  };

  const updateStatus = (id: string, status: SubmissionStatus) => {
    setSubmissions(submissions.map(s => s.id === id ? { ...s, status } : s));
  };

  const removeSubmission = (id: string) => setSubmissions(submissions.filter(s => s.id !== id));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Kanban size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Submission Tracker</h2>
            <p className="text-xs text-[#888]">Track your manuscript across journals in a real-time Kanban board.</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs">
          <Plus size={14} className="mr-1" /> Add Submission
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white">New Submission</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Journal Name</label>
              <input value={form.journal} onChange={e => setForm({ ...form, journal: e.target.value })} placeholder="e.g. PLOS ONE" className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as SubmissionStatus })} className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2">
                {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Date Submitted</label>
              <input type="date" value={form.dateSubmitted} onChange={e => setForm({ ...form, dateSubmitted: e.target.value })} className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Handling Editor (optional)</label>
              <input value={form.editor} onChange={e => setForm({ ...form, editor: e.target.value })} placeholder="e.g. Dr. A. Smith" className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addSubmission} disabled={!form.journal.trim()} className="bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs">Add</Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-[#444] text-[#888] h-9 text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map(col => {
          const colSubs = submissions.filter(s => col.id.includes(s.status));
          return (
            <div key={col.label} className="bg-[#111] border border-[#222] rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>{col.label}</h3>
                <Badge variant="outline" className={`text-[10px] border-[#333] ${col.color}`}>{colSubs.length}</Badge>
              </div>

              {colSubs.length === 0 ? (
                <div className="border-2 border-dashed border-[#333] rounded-lg p-6 text-center text-[#555] text-xs">No submissions here</div>
              ) : (
                <div className="space-y-3">
                  {colSubs.map(sub => {
                    const cfg = STATUS_CONFIG[sub.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={sub.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 shadow-xl group relative">
                        <button onClick={() => removeSubmission(sub.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#555] hover:text-rose-500">
                          <Trash2 size={12} />
                        </button>
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.bg} ${cfg.color}`}>
                            <Icon size={10} /> {sub.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mb-3 pr-4">{sub.journal}</h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[#888]">
                            <span>Submitted:</span>
                            <span className="text-[#d4d4d4]">{sub.dateSubmitted}</span>
                          </div>
                          {sub.editor && (
                            <div className="flex justify-between text-[#888]">
                              <span>Editor:</span>
                              <span className="text-[#d4d4d4]">{sub.editor}</span>
                            </div>
                          )}
                        </div>
                        <select
                          value={sub.status}
                          onChange={e => updateStatus(sub.id, e.target.value as SubmissionStatus)}
                          className="mt-3 w-full bg-[#111] border border-[#333] text-[#888] text-[10px] rounded px-2 py-1"
                        >
                          {Object.keys(STATUS_CONFIG).map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {submissions.length === 0 && !showForm && (
        <div className="text-center py-12 bg-[#1a1a1a] border border-[#333] rounded-2xl">
          <Kanban size={48} className="text-[#333] mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No Submissions Tracked</p>
          <p className="text-[#888] text-sm">Click "Add Submission" to start tracking your manuscript submissions.</p>
        </div>
      )}
    </div>
  );
}
