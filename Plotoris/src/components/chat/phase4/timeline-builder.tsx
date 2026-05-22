"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, CheckCircle2, GripVertical, Loader2, Sparkles, Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["bg-blue-500", "bg-fuchsia-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-emerald-500", "bg-cyan-500"];

export default function TimelineBuilder({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSavedTimeline = async () => {
      try {
        const res = await fetch(`/api/phase4/generate-timeline?project_id=${projectId}`);
        const data = await res.json();
        if (data.timeline && data.timeline.milestones) {
          const loadedTasks = data.timeline.milestones.map((m: any, i: number) => ({
            id: m.id || `t${Date.now() + i}`,
            name: m.name || m.description || m.phase,
            startMonth: m.startMonth !== undefined ? m.startMonth : i,
            duration: m.duration || 1,
            color: m.color || COLORS[i % COLORS.length],
            done: false
          }));
          setTasks(loadedTasks);
          setIsSaved(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) fetchSavedTimeline();
  }, [projectId]);

  const getHeaders = () => {
    const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
    const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
    const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
    const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
    const headers: any = { "Content-Type": "application/json" };
    if (textKey) { headers["x-api-key"] = textKey; headers["x-api-provider"] = activeTextProvider; }
    if (embeddingKey) { headers["x-embedding-key"] = embeddingKey; headers["x-embedding-provider"] = activeEmbeddingProvider; }
    return headers;
  };

  const generateTimeline = async () => {
    setIsGenerating(true);
    setIsSaved(false);
    try {
      const res = await fetch("/api/phase4/generate-timeline", {
        method: "POST",
        headers: getHeaders(),
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

  const saveTimeline = async () => {
    if (tasks.length === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/phase4/generate-timeline", {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ project_id: projectId, tasks })
      });
      if (res.ok) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
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
    setIsSaved(false);
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    setIsSaved(false);
  };

  const updateTask = (id: string, field: string, value: any) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
    setIsSaved(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Project Timeline Builder</h2>
              <p className="text-sm text-[#888]">Build your research schedule and milestones on a 12-month horizon.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={generateTimeline} 
              disabled={isGenerating} 
              variant="outline"
              className="border-[#333] text-[#888] hover:text-white hover:bg-[#1a1a1a]"
            >
              {isGenerating ? <Loader2 size={15} className="mr-2 animate-spin" /> : <RefreshCw size={15} className="mr-2" />}
              {tasks.length > 0 ? "Re-generate" : "Auto-Generate"}
            </Button>
            
            {tasks.length > 0 && (
              <Button 
                onClick={saveTimeline} 
                disabled={isSaving || isSaved} 
                className={`${isSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'} text-white`}
              >
                {isSaving ? (
                  <Loader2 size={15} className="mr-2 animate-spin" />
                ) : isSaved ? (
                  <CheckCircle2 size={15} className="mr-2" />
                ) : (
                  <Save size={15} className="mr-2" />
                )}
                {isSaved ? "Saved ✓" : "Save Timeline"}
              </Button>
            )}
          </div>
        </div>

        {tasks.length > 0 ? (
          <>
            {/* Gantt Chart */}
            <div className="overflow-x-auto pb-4">
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
                <AnimatePresence>
                  {tasks.map((task) => (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      exit={{ opacity: 0 }} 
                      className="flex items-center gap-2 group"
                    >
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Task Controls */}
            <div className="mt-8 border-t border-[#333] pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Edit Tasks</h3>
                {!isSaved && <span className="text-xs text-amber-500 flex items-center gap-1"><Sparkles size={12}/> Unsaved changes</span>}
              </div>
              
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div 
                    key={task.id} 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    exit={{ opacity: 0, scale: 0.98 }} 
                    className="flex items-center gap-4 bg-[#0d0d0d] p-3 rounded-xl border border-[#333]"
                  >
                    <div className={`w-3 h-3 rounded-full shrink-0 ${task.color}`} />
                    <input
                      type="text"
                      value={task.name}
                      onChange={(e) => updateTask(task.id, "name", e.target.value)}
                      className="text-sm text-white font-medium flex-1 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#333] rounded px-1 truncate"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] text-[#888] uppercase">Start</label>
                      <select 
                        value={task.startMonth}
                        onChange={(e) => updateTask(task.id, "startMonth", Number(e.target.value))}
                        className="bg-[#111] border border-[#333] text-white text-xs rounded px-2 py-1 focus:outline-none"
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
                        className="bg-[#111] border border-[#333] text-white text-xs rounded px-2 py-1 w-16 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-[#0d0d0d] rounded-xl border border-[#333]">
            <Clock size={48} className="text-[#333] mx-auto mb-4" />
            <p className="text-white font-medium mb-2">No Timeline Created</p>
            <p className="text-[#888] text-sm">Click auto-generate or add manual tasks to start building your schedule.</p>
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
