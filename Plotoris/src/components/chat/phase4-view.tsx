"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; 
import { 
  PencilRuler, Lightbulb, CheckCircle2, FlaskConical, ShieldCheck, Clock, FileEdit, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import DesignRecommender from "@/components/chat/phase4/design-recommender";
import EthicsChecklist from "@/components/chat/phase4/ethics-checklist";
import TimelineBuilder from "@/components/chat/phase4/timeline-builder";
import MethodologyBuilder from "@/components/chat/phase4/methodology-builder";

interface DashboardStats {
  hypothesis: string;
  variableCount: number;
  timelineDuration: string;
  methodologyReadiness: number;
}

export default function PhaseFourView({ projectId }: { projectId: string }) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "design" | "ethics" | "timeline" | "methodology">("dashboard");
  const [stats, setStats] = useState<DashboardStats>({
    hypothesis: "--",
    variableCount: 0,
    timelineDuration: "--",
    methodologyReadiness: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!projectId) return;
      setStatsLoading(true);
      try {
        const res = await fetch(`/api/phase4/dashboard-stats?project_id=${projectId}`);
        const data = await res.json();
        if (!data.error) setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, [projectId]);


  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#d4d4d4] p-4 lg:p-8 font-sans relative">
      


      <div className="max-w-7xl mx-auto space-y-6 mt-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="bg-[#fae8ff] text-[#c026d3] hover:bg-[#fae8ff] font-medium rounded-full px-3 py-0.5 border border-[#f5d0fe]">
                Phase 4
              </Badge>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Research Design
              </h1>
            </div>
            <p className="text-[#888] text-sm">
              Select your design, plan your experiment, calculate sample sizes, and auto-draft your methodology.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-[#111] p-1 rounded-xl border border-[#333] overflow-x-auto max-w-[50vw]">
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "design", label: "Design Recommender" },
              { id: "ethics", label: "Ethics" },
              { id: "timeline", label: "Timeline" },
              { id: "methodology", label: "Methodology" }
            ].map((tab) => (
              <Button 
                key={tab.id}
                variant="ghost"
                size="sm"
                className={`rounded-lg px-4 whitespace-nowrap ${activeTab === tab.id ? 'bg-[#222] text-white shadow-sm' : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
              
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Approved Hypothesis", value: stats.hypothesis, icon: Lightbulb, color: "text-amber-400" },
                  { label: "Variable Count", value: stats.variableCount > 0 ? `${stats.variableCount} Vars` : "--", icon: FlaskConical, color: "text-blue-400" },
                  { label: "Estimated Duration", value: stats.timelineDuration, icon: Clock, color: "text-fuchsia-400" },
                  { label: "Methodology Readiness", value: stats.methodologyReadiness > 0 ? `${stats.methodologyReadiness}%` : "--", icon: CheckCircle2, color: "text-emerald-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={16} className={stat.color} />
                      <span className="text-xs text-[#888] uppercase tracking-wider font-semibold">{stat.label}</span>
                    </div>
                    {statsLoading ? (
                      <Loader2 size={18} className="animate-spin text-[#444] mt-1" />
                    ) : (
                      <span className="text-2xl font-bold text-white">{stat.value}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div onClick={() => setActiveTab("design")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-blue-500/50 rounded-2xl p-6 cursor-pointer group">
                  <FlaskConical size={24} className="text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">1. Design Recommender</h3>
                  <p className="text-xs text-[#888]">AI suggestions based on variables.</p>
                </div>
                
                <div onClick={() => setActiveTab("ethics")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-emerald-500/50 rounded-2xl p-6 cursor-pointer group">
                  <ShieldCheck size={24} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">3. Ethics Checklist</h3>
                  <p className="text-xs text-[#888]">IRB and consent protocols.</p>
                </div>

                <div onClick={() => setActiveTab("timeline")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-amber-500/50 rounded-2xl p-6 cursor-pointer group">
                  <Clock size={24} className="text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">4. Timeline Builder</h3>
                  <p className="text-xs text-[#888]">Project schedule and milestones.</p>
                </div>

                <div onClick={() => setActiveTab("methodology")} className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#333] hover:border-fuchsia-500/50 rounded-2xl p-6 cursor-pointer group xl:col-span-1 md:col-span-2 lg:col-span-3">
                  <FileEdit size={24} className="text-fuchsia-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-semibold mb-1">5. Methodology Builder</h3>
                  <p className="text-xs text-[#888]">Auto-draft your full academic section.</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "design" && (
            <motion.div key="design" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <DesignRecommender projectId={projectId} />
            </motion.div>
          )}

          {activeTab === "ethics" && (
            <motion.div key="ethics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <EthicsChecklist projectId={projectId} />
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <TimelineBuilder projectId={projectId} />
            </motion.div>
          )}

          {activeTab === "methodology" && (
            <motion.div key="methodology" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <MethodologyBuilder projectId={projectId} />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
