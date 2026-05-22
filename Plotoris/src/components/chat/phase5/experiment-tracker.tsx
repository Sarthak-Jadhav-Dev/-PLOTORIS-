"use client";

import { useState, useEffect } from "react";
import {
  FlaskConical, Plus, AlertTriangle, CheckCircle2, Clock, Loader2,
  Pencil, Trash2, X, Save, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ExperimentRun {
  id: string;
  runId: string;
  date: string;
  operator: string;
  group: string;
  condition: string;
  hypothesis: string;
  ivValue: string;
  dvMeasurement: string;
  sampleSize: string;
  instruments: string;
  environment: string;
  observations: string;
  deviation: boolean;
  deviationReason: string;
  outcome: string;
  created_at?: string;
}

const EMPTY_RUN = {
  operator: "", group: "Control", condition: "", hypothesis: "",
  ivValue: "", dvMeasurement: "", sampleSize: "", instruments: "",
  environment: "", observations: "", deviation: false,
  deviationReason: "", outcome: "Inconclusive"
};

const OUTCOME_STYLES: Record<string, string> = {
  "Positive": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Negative": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Inconclusive": "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function ExperimentTracker({ projectId }: { projectId: string }) {
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRun, setEditingRun] = useState<ExperimentRun | null>(null);
  const [form, setForm] = useState<typeof EMPTY_RUN>({ ...EMPTY_RUN });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const getHeaders = () => {
    const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
    const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
    const headers: any = { "Content-Type": "application/json" };
    if (embeddingKey) { headers["x-embedding-key"] = embeddingKey; headers["x-embedding-provider"] = activeEmbeddingProvider; }
    return headers;
  };

  useEffect(() => {
    const loadRuns = async () => {
      try {
        const res = await fetch(`/api/phase5/experiment-runs?project_id=${projectId}`);
        const data = await res.json();
        if (data.runs) setRuns(data.runs);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    if (projectId) loadRuns();
  }, [projectId]);

  const openNewForm = () => {
    setEditingRun(null);
    setForm({ ...EMPTY_RUN });
    setShowForm(true);
  };

  const openEditForm = (run: ExperimentRun) => {
    setEditingRun(run);
    setForm({
      operator: run.operator, group: run.group, condition: run.condition,
      hypothesis: run.hypothesis, ivValue: run.ivValue, dvMeasurement: run.dvMeasurement,
      sampleSize: run.sampleSize, instruments: run.instruments, environment: run.environment,
      observations: run.observations, deviation: run.deviation, deviationReason: run.deviationReason,
      outcome: run.outcome
    });
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditingRun(null); setForm({ ...EMPTY_RUN }); };

  const saveRun = async () => {
    if (!form.operator || !form.condition) return;
    setIsSaving(true);
    try {
      if (editingRun) {
        // Update existing
        const updated: ExperimentRun = { ...editingRun, ...form };
        const res = await fetch("/api/phase5/experiment-runs", {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ project_id: projectId, ...updated })
        });
        if (res.ok) {
          setRuns(runs.map(r => r.id === editingRun.id ? updated : r));
        }
      } else {
        // Create new
        const runId = `RUN-${String(runs.length + 1).padStart(3, "0")}`;
        const newRun: ExperimentRun = {
          id: `run_${Date.now()}`,
          runId,
          date: new Date().toLocaleString(),
          ...form,
        };
        const res = await fetch("/api/phase5/experiment-runs", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ project_id: projectId, ...newRun })
        });
        if (res.ok) setRuns([...runs, newRun]);
      }
      closeForm();
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  const deleteRun = async (run: ExperimentRun) => {
    try {
      await fetch(`/api/phase5/experiment-runs?project_id=${projectId}&run_id=${run.runId}`, { method: "DELETE" });
      setRuns(runs.filter(r => r.id !== run.id));
      setDeleteConfirm(null);
    } catch (err) { console.error(err); }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );

  const inputCls = "w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500 transition-colors";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FlaskConical size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Experiment Tracker</h2>
              <p className="text-sm text-[#888]">Persistent, team-attributed run logs with full audit trail.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-xs">
              <span className="text-[#888]"><span className="text-white font-bold">{runs.length}</span> Runs</span>
              <span className="text-[#888]"><span className="text-rose-400 font-bold">{runs.filter(r => r.deviation).length}</span> Deviations</span>
              <span className="text-[#888]"><span className="text-emerald-400 font-bold">{runs.filter(r => r.outcome === "Positive").length}</span> Positive</span>
            </div>
            <Button onClick={openNewForm} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
              <Plus size={14} /> Log Run
            </Button>
          </div>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-[#0d0d0d] border-b border-[#333] space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white">{editingRun ? `Editing ${editingRun.runId}` : "New Experiment Run"}</h3>
                  <button onClick={closeForm} className="text-[#555] hover:text-white"><X size={16} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Operator Name">
                    <input value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}
                      placeholder="e.g., Dr. Sharma" className={inputCls} />
                  </Field>
                  <Field label="Group">
                    <select value={form.group} onChange={e => setForm({ ...form, group: e.target.value })} className={inputCls}>
                      <option>Control</option><option>Treatment</option><option>Observation</option>
                    </select>
                  </Field>
                  <Field label="Outcome">
                    <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })} className={inputCls}>
                      <option>Positive</option><option>Negative</option><option>Inconclusive</option>
                    </select>
                  </Field>

                  <Field label="Experimental Condition">
                    <input value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
                      placeholder="e.g., Social media restricted 2hr/day" className={inputCls} />
                  </Field>
                  <Field label="Hypothesis Being Tested">
                    <input value={form.hypothesis} onChange={e => setForm({ ...form, hypothesis: e.target.value })}
                      placeholder="e.g., H1: Restriction improves GPA" className={inputCls} />
                  </Field>
                  <Field label="Sample Size (This Run)">
                    <input value={form.sampleSize} onChange={e => setForm({ ...form, sampleSize: e.target.value })}
                      placeholder="e.g., n=30" className={inputCls} />
                  </Field>

                  <Field label="IV Value / Setting">
                    <input value={form.ivValue} onChange={e => setForm({ ...form, ivValue: e.target.value })}
                      placeholder="e.g., Usage capped at 120 min" className={inputCls} />
                  </Field>
                  <Field label="DV Measurement / Result">
                    <input value={form.dvMeasurement} onChange={e => setForm({ ...form, dvMeasurement: e.target.value })}
                      placeholder="e.g., GPA: 3.8, Stress: 42" className={inputCls} />
                  </Field>
                  <Field label="Instruments / Tools Used">
                    <input value={form.instruments} onChange={e => setForm({ ...form, instruments: e.target.value })}
                      placeholder="e.g., Likert scale, GPA records" className={inputCls} />
                  </Field>

                  <Field label="Environment / Setup Notes">
                    <textarea value={form.environment} onChange={e => setForm({ ...form, environment: e.target.value })}
                      placeholder="Lab conditions, room setup, time of day..." rows={2}
                      className={inputCls + " resize-none"} />
                  </Field>
                  <Field label="Observations & Field Notes">
                    <textarea value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })}
                      placeholder="Behavioral notes, unexpected events..." rows={2}
                      className={inputCls + " resize-none"} />
                  </Field>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer mt-5">
                      <input type="checkbox" checked={form.deviation}
                        onChange={e => setForm({ ...form, deviation: e.target.checked })}
                        className="accent-rose-500 w-4 h-4" />
                      <span className="text-sm text-[#ccc]">Protocol Deviation?</span>
                    </label>
                    {form.deviation && (
                      <input value={form.deviationReason} onChange={e => setForm({ ...form, deviationReason: e.target.value })}
                        placeholder="Reason for deviation..." className={inputCls} />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button onClick={closeForm} variant="ghost" className="text-[#666] hover:text-white">Cancel</Button>
                  <Button onClick={saveRun} disabled={isSaving || !form.operator || !form.condition}
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {editingRun ? "Update Run" : "Save Run"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Runs */}
        {runs.length === 0 ? (
          <div className="p-16 text-center">
            <FlaskConical size={40} className="text-[#333] mx-auto mb-4" />
            <p className="text-white font-medium mb-1">No experiment runs yet</p>
            <p className="text-[#666] text-sm">Log your first experimental run to start tracking results.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {runs.map((run) => (
              <div key={run.id} className={`hover:bg-[#111] transition-colors ${run.deviation ? "bg-rose-500/3" : ""}`}>
                {/* Run Summary Row */}
                <div className="flex items-center gap-3 px-6 py-4">
                  <button onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    className="text-[#555] hover:text-white transition-colors shrink-0">
                    {expandedRun === run.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <span className="font-mono text-xs text-[#666] w-20 shrink-0">{run.runId}</span>
                  <div className="flex items-center gap-1 text-[#666] text-xs w-36 shrink-0">
                    <Clock size={10} /> {run.date}
                  </div>
                  <span className="text-sm text-white font-medium w-32 shrink-0 truncate">{run.operator}</span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                    run.group === "Control" ? "bg-blue-500/10 text-blue-400" :
                    run.group === "Treatment" ? "bg-amber-500/10 text-amber-400" :
                    "bg-violet-500/10 text-violet-400"
                  }`}>{run.group}</span>

                  <span className="text-xs text-[#888] flex-1 truncate">{run.condition}</span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${OUTCOME_STYLES[run.outcome] || OUTCOME_STYLES["Inconclusive"]}`}>
                    {run.outcome}
                  </span>

                  {run.deviation && (
                    <span className="flex items-center gap-1 text-rose-400 text-xs shrink-0">
                      <AlertTriangle size={12} /> Deviation
                    </span>
                  )}

                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEditForm(run)} className="text-[#444] hover:text-amber-400 p-1 transition-colors">
                      <Pencil size={13} />
                    </button>
                    {deleteConfirm === run.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteRun(run)} className="text-[10px] text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-[#666] px-1.5 py-0.5 rounded">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(run.id)} className="text-[#444] hover:text-rose-400 p-1 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedRun === run.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 grid grid-cols-2 md:grid-cols-3 gap-4 bg-[#0a0a0a] border-t border-[#1a1a1a]">
                        {[
                          { label: "Hypothesis", value: run.hypothesis },
                          { label: "IV Value / Setting", value: run.ivValue },
                          { label: "DV Measurement", value: run.dvMeasurement },
                          { label: "Sample Size", value: run.sampleSize },
                          { label: "Instruments / Tools", value: run.instruments },
                          { label: "Environment / Setup", value: run.environment },
                          { label: "Observations", value: run.observations },
                          run.deviation ? { label: "Deviation Reason", value: run.deviationReason } : null,
                        ].filter(Boolean).map((item: any, i) => (
                          item.value ? (
                            <div key={i} className="pt-4">
                              <p className="text-[10px] text-[#555] font-bold uppercase tracking-wider mb-1">{item.label}</p>
                              <p className="text-sm text-[#bbb]">{item.value}</p>
                            </div>
                          ) : null
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
