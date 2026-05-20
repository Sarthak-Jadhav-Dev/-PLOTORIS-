"use client";

import { useState } from "react";
import { FlaskConical, Plus, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ExperimentRun {
  id: string;
  runId: string;
  date: string;
  operator: string;
  group: "Control" | "Treatment";
  condition: string;
  measurement: string;
  observation: string;
  deviation: boolean;
}

const initialRuns: ExperimentRun[] = [
  { id: "1", runId: "RUN-001", date: "2026-05-15 09:30", operator: "Dr. Sharma", group: "Control", condition: "Baseline - No Intervention", measurement: "GPA: 3.8, Stress: 42", observation: "No issues noted. Participant responsive.", deviation: false },
  { id: "2", runId: "RUN-002", date: "2026-05-15 11:00", operator: "Dr. Sharma", group: "Treatment", condition: "Social Media Restricted (2hr/day)", measurement: "GPA: 3.5, Stress: 71", observation: "Participant reported difficulty adjusting to restrictions.", deviation: false },
  { id: "3", runId: "RUN-003", date: "2026-05-16 10:15", operator: "R. Patel", group: "Treatment", condition: "Social Media Restricted (2hr/day)", measurement: "GPA: 2.9, Stress: 88", observation: "Participant missed scheduled session — rescheduled.", deviation: true },
];

export default function ExperimentTracker() {
  const [runs, setRuns] = useState(initialRuns);
  const [showForm, setShowForm] = useState(false);
  const [newRun, setNewRun] = useState({ operator: "", group: "Control", condition: "", measurement: "", observation: "", deviation: false });

  const addRun = () => {
    if (!newRun.operator || !newRun.condition) return;
    setRuns([...runs, {
      id: String(Date.now()),
      runId: `RUN-${String(runs.length + 1).padStart(3, "0")}`,
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      ...newRun,
      group: newRun.group as "Control" | "Treatment",
    }]);
    setShowForm(false);
    setNewRun({ operator: "", group: "Control", condition: "", measurement: "", observation: "", deviation: false });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#333]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FlaskConical size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Experiment Tracker</h2>
              <p className="text-sm text-[#888]">Timestamped, team-attributed experimental run logs with audit trail.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-3 text-xs">
              <span className="text-[#888]"><span className="text-white font-bold">{runs.length}</span> Runs</span>
              <span className="text-[#888]"><span className="text-rose-400 font-bold">{runs.filter(r => r.deviation).length}</span> Deviations</span>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Plus size={14} className="mr-2" /> Log Run
            </Button>
          </div>
        </div>

        {/* Log Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-6 bg-[#111] border-b border-[#333] grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Operator</label>
                  <input value={newRun.operator} onChange={e => setNewRun({...newRun, operator: e.target.value})}
                    placeholder="e.g., Dr. Sharma"
                    className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Group</label>
                  <select value={newRun.group} onChange={e => setNewRun({...newRun, group: e.target.value})}
                    className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2">
                    <option>Control</option>
                    <option>Treatment</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Condition</label>
                  <input value={newRun.condition} onChange={e => setNewRun({...newRun, condition: e.target.value})}
                    placeholder="e.g., 2hr restriction"
                    className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block mb-1">Observation</label>
                  <input value={newRun.observation} onChange={e => setNewRun({...newRun, observation: e.target.value})}
                    placeholder="Field notes..."
                    className="w-full bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500" />
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newRun.deviation} onChange={e => setNewRun({...newRun, deviation: e.target.checked})} className="accent-rose-500" />
                    <span className="text-xs text-[#888]">Protocol Deviation</span>
                  </label>
                  <Button onClick={addRun} className="bg-amber-600 hover:bg-amber-700 text-white text-sm">Save Run</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Runs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#111] border-b border-[#333]">
              <tr>
                {["Run ID", "Date/Time", "Operator", "Group", "Condition", "Measurement", "Observation", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#888] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map(run => (
                <tr key={run.id} className={`border-b border-[#222] hover:bg-[#111] transition-colors ${run.deviation ? "bg-rose-500/5" : ""}`}>
                  <td className="px-4 py-3 font-mono text-xs text-[#888]">{run.runId}</td>
                  <td className="px-4 py-3 text-[#888] text-xs whitespace-nowrap flex items-center gap-1"><Clock size={10} /> {run.date}</td>
                  <td className="px-4 py-3 text-white whitespace-nowrap">{run.operator}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${run.group === "Control" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {run.group}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#888] max-w-[150px] truncate">{run.condition}</td>
                  <td className="px-4 py-3 text-white font-mono text-xs">{run.measurement}</td>
                  <td className="px-4 py-3 text-[#888] max-w-[200px] truncate">{run.observation}</td>
                  <td className="px-4 py-3">
                    {run.deviation ? (
                      <span className="flex items-center gap-1 text-rose-400 text-xs"><AlertTriangle size={12} /> Deviation</span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 size={12} /> Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
