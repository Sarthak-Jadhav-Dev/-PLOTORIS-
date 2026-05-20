"use client";

import { motion } from "framer-motion";
import {
    FileText,
    BookOpen,
    Lightbulb,
    PenTool,
    Database,
    BarChart2,
    FileEdit,
    Send,
    Users,
    Activity,
    ArrowRight,
    TrendingUp,
    Settings,
    UserPlus
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProjectDashboardViewProps {
    activeProject: { id: string; name: string } | null;
    onSelectPhase: (id: string) => void;
}

const RESEARCH_PHASES = [
    { id: "p1", title: "Identification of Problem", description: "Define the core problem statement and objectives.", icon: FileText, color: "#6366F1" },
    { id: "p2", title: "Study Existing Papers", description: "AI-assisted literature review and extraction.", icon: BookOpen, color: "#10B981" },
    { id: "p3", title: "Formulating Hypothesis", description: "Establish theoretical frameworks.", icon: Lightbulb, color: "#F59E0B" },
    { id: "p4", title: "Research Design", description: "Plan methodology and experimental setup.", icon: PenTool, color: "#EC4899" },
    { id: "p5", title: "Data Collection & Analysis", description: "Gather data and uncover patterns.", icon: Database, color: "#8B5CF6" },
    { id: "p6", title: "Interpretation of Results", description: "Synthesize findings and statistical relevance.", icon: BarChart2, color: "#3B82F6" },
    { id: "p7", title: "Drafting Research Papers", description: "Collaborative writing and citation generation.", icon: FileEdit, color: "#14B8A6" },
    { id: "p8", title: "Publication", description: "Final review and submission formatting.", icon: Send, color: "#F97316" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function ProjectDashboardView({ activeProject, onSelectPhase }: ProjectDashboardViewProps) {
    if (!activeProject) return null;

    return (
        <div className="flex-1 overflow-y-auto bg-[#050505] p-6 lg:p-10 relative">
            {/* Background ambient glow */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
                >
                    <div>
                        <Badge variant="outline" className="bg-[#141414] border-[#222] text-orange-primary mb-3">
                            Active Project
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                            {activeProject.name}
                        </h1>
                        <p className="text-[#888] text-sm md:text-base max-w-2xl leading-relaxed">
                            Welcome to your project command center. Manage your research methodology, collaborate with your team, and access AI agents tailored for each phase of your study.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <Button variant="outline" className="bg-[#0d0d0d] border-[#222] text-white hover:bg-[#1a1a1a]">
                            <Settings size={16} className="mr-2" /> Settings
                        </Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                            <UserPlus size={16} className="mr-2" /> Invite Team
                        </Button>
                    </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12"
                >
                    {[
                        { label: "Papers Analyzed", value: "0", icon: FileText, color: "text-blue-400" },
                        { label: "Insights Extracted", value: "0", icon: TrendingUp, color: "text-green-400" },
                        { label: "Team Members", value: "1", icon: Users, color: "text-purple-400" },
                        { label: "Active Agents", value: "2", icon: Activity, color: "text-orange-400" },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            variants={itemVariants}
                            className="bg-[#0d0d0d] border border-[#1a1a1a] p-5 rounded-2xl flex items-center justify-between"
                        >
                            <div>
                                <p className="text-[#666] text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-[#141414] flex items-center justify-center">
                                <stat.icon size={18} className={stat.color} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Research Methodology Grid */}
                <div className="mb-8">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-2 mb-6"
                    >
                        <h2 className="text-xl font-bold text-white">Research Methodology</h2>
                        <Badge className="bg-[#141414] text-[#888] hover:bg-[#141414] text-xs">8 Phases</Badge>
                    </motion.div>

                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {RESEARCH_PHASES.map((phase) => (
                            <motion.button
                                key={phase.id}
                                variants={itemVariants}
                                onClick={() => onSelectPhase(phase.id)}
                                className="group relative bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl p-5 text-left hover:border-[#333] transition-all duration-300 overflow-hidden flex flex-col h-full"
                            >
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500"
                                     style={{ background: `radial-gradient(circle at top right, ${phase.color}, transparent 70%)` }} />
                                
                                <div className="flex items-start justify-between mb-4">
                                    <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: `${phase.color}15` }}
                                    >
                                        <phase.icon size={18} style={{ color: phase.color }} />
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-[#141414] border border-[#222] flex items-center justify-center group-hover:bg-[#1a1a1a] transition-colors">
                                        <ArrowRight size={12} className="text-[#555] group-hover:text-white" />
                                    </div>
                                </div>
                                
                                <h3 className="font-semibold text-white mb-2 group-hover:text-orange-100 transition-colors">
                                    {phase.title}
                                </h3>
                                <p className="text-[#666] text-xs leading-relaxed mt-auto">
                                    {phase.description}
                                </p>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
