"use client";

import { useState } from "react";
import { Clock, Plus, Trash2, CheckCircle2, Circle, GripVertical, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["bg-blue-500", "bg-fuchsia-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-emerald-500", "bg-cyan-500"];

export default function TimelineBuilder({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateTimeline = async () => {
    setIsGenerating(true);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase4/generate-timeline", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json();
      
      if (data.milestones) {
        const newTasks = data.milestones.map((m: any, i: number) => ({
          id: `t${Date.now() + i}`,
          name: m.description || m.phase,
          startMonth: m.startMonth || i,
          duration: m.duration || 1,
          color: COLORS[i % COLORS.length],
          done: false
        }));
        setTasks(newTasks);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const addTask = () => {
    if (!newTaskName.trim()) return;
    setTasks([...tasks, {
      id: `t${Date.now()}`,
      name: newTaskName,
      startMonth: 0,
      duration: 1,
      color: COLORS[tasks.length % COLORS.length],
      done: false,
    }]);
    setNewTaskName("");
  };

  const removeTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const updateTask = (id: string, field: string, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Project Timeline Builder</h2>
              <p className="text-sm text-[#888]">Build your research schedule and milestones on a 12-month horizon.</p>
            </div>
          </div>
          <Button onClick={generateTimeline} disabled={isGenerating} className="bg-amber-600 hover:bg-amber-700 text-white">
            {isGenerating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
            Auto-Generate Timeline
          </Button>
        </div>

        {tasks.length > 0 ? (
          <>
            {/* Gantt Chart */}
            <div className="overflow-x-auto">
              {/* Month Headers */}
              <div className="flex mb-3 min-w-[900px]">
                <div className="w-56 shrink-0" />
                <div className="flex-1 grid grid-cols-12 gap-px">
                  {MONTHS.map((m, i) => (
                    <div key={i} className="text-center text-[10px] font-bold uppercase tracking-widest text-[#555]">{m}</div>
                  ))}
                </div>
              </div>

              {/* Task Rows */}
              <div className="space-y-2 min-w-[900px]">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 group">
                    <div className="w-56 shrink-0 flex items-center gap-2">
                      <GripVertical size={14} className="text-[#444] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                      <span className="text-sm text-white truncate font-medium" title={task.name}>{task.name}</span>
                    </div>
                    <div className="flex-1 relative h-8 bg-[#111] rounded-lg overflow-hidden grid grid-cols-12 gap-px p-px">
                      {Array.from({ length: 12 }).map((_, i) => {
                        const inRange = i >= task.startMonth && i < task.startMonth + task.duration;
                        return (
                          <div key={i} className={`rounded h-full transition-all ${inRange ? `${task.color} opacity-70` : ''}`} />
                        );
                      })}
                    </div>
                    <button onClick={() => removeTask(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} className="text-[#555] hover:text-rose-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Task Controls */}
            <div className="mt-8 border-t border-[#333] pt-6 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Tasks</h3>
              {tasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 bg-[#0d0d0d] p-3 rounded-xl border border-[#333]">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${task.color}`} />
                  <span className="text-sm text-white font-medium flex-1 truncate">{task.name}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-[#888] uppercase">Start</label>
                    <select 
                      value={task.startMonth}
                      onChange={(e) => updateTask(task.id, "startMonth", Number(e.target.value))}
                      className="bg-[#111] border border-[#333] text-white text-xs rounded px-2 py-1"
                    >
                      {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-[#888] uppercase">Dur (mo)</label>
                    <input 
                      type="number" min="1" max="12"
                      value={task.duration}
                      onChange={(e) => updateTask(task.id, "duration", Math.min(12 - task.startMonth, Number(e.target.value)))}
                      className="bg-[#111] border border-[#333] text-white text-xs rounded px-2 py-1 w-16"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-[#0d0d0d] rounded-xl border border-[#333]">
            <Clock size={48} className="text-[#333] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No Timeline Created</p>
            <p className="text-[#888] text-sm">Click the button above to auto-generate a schedule based on your project context.</p>
          </div>
        )}

        {/* Add Task */}
        <div className="mt-6 flex gap-2">
          <input 
            type="text"
            placeholder="New task name..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            className="flex-1 bg-[#0d0d0d] border border-[#333] text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
          <Button onClick={addTask} className="bg-[#222] border border-[#444] hover:bg-[#333] text-white">
            <Plus size={16} className="mr-1" /> Add Manual Task
          </Button>
        </div>
      </div>
    </div>
  );
}
