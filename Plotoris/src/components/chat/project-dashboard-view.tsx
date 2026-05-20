"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Settings,
    UserPlus,
    Home,
    ChevronRight,
    Sparkles,
    Users,
    AlertCircle,
    PlayCircle,
    CheckCircle2,
    Network,
    Clock,
    Plus,
    Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import InviteTeamDialog from "@/components/chat/invite-team-dialog";
import ProjectSettingsDialog from "@/components/chat/project-settings-dialog";
import { Project, ProjectStats } from "@/lib/data/projects-data";
import { authHeaders } from "@/lib/auth";

interface ProjectDashboardViewProps {
    activeProject: Project | null;
    onSelectPhase: (id: string) => void;
}

export default function ProjectDashboardView({ activeProject, onSelectPhase }: ProjectDashboardViewProps) {
    const [inviteOpen, setInviteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [stats, setStats] = useState<ProjectStats | null>(null);
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    // Fetch real stats and team data when project changes
    useEffect(() => {
        if (!activeProject?.id) return;

        const fetchProjectData = async () => {
            setIsLoadingStats(true);
            try {
                // Fetch stats
                const statsRes = await fetch(`/api/projects/${activeProject.id}/stats`, { headers: authHeaders() });
                const statsData = await statsRes.json();
                if (statsRes.ok && statsData.data) {
                    setStats(statsData.data);
                } else {
                    setStats(activeProject.stats);
                }

                // Fetch team members
                const teamRes = await fetch(`/api/projects`, { headers: authHeaders() });
                const teamData = await teamRes.json();
                if (teamRes.ok && teamData.data) {
                    const project = teamData.data.find((p: any) => p.id === activeProject.id);
                    if (project && project.ProjectMembers) {
                        // Transform ProjectMembers to team format
                        const transformedTeam = project.ProjectMembers.map((member: any) => ({
                            id: member.user_id,
                            init: member.Users?.user_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
                            name: member.Users?.user_name || 'Unknown',
                            role: member.role,
                            status: 'Active' as const,
                            statusColor: 'text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20'
                        }));
                        setTeamMembers(transformedTeam);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch project data:', error);
                setStats(activeProject.stats);
                setTeamMembers(activeProject.team || []);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchProjectData();
    }, [activeProject?.id]);

    if (!activeProject) return null;

    return (
        <div className="flex-1 overflow-y-auto bg-[#1a1a1a] text-[#d4d4d4] p-4 lg:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* 1. Header Area */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#333] pb-6">
                    <div>
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-xs text-[#888] mb-4">
                            <Home size={14} />
                            <span>Home</span>
                            <ChevronRight size={12} />
                            <span className="text-[#d4d4d4] font-medium">{activeProject.name}</span>
                        </div>
                        
                        {/* Title Section */}
                        <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-[#fff3e0] text-[#f57c00] hover:bg-[#fff3e0] font-medium rounded-full px-3 py-0.5 border border-[#ffb74d]/30 shadow-none">
                                Active project
                            </Badge>
                            <Badge variant="outline" className="border-[#333] text-[#888] font-medium rounded-full px-3 py-0.5">
                                {activeProject.category}
                            </Badge>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                            {activeProject.name}
                        </h1>
                        <p className="text-[#888] text-sm">
                            {activeProject.currentPhase} · {activeProject.dueDate}
                        </p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Button 
                            onClick={() => setSettingsOpen(true)}
                            variant="outline" 
                            className="bg-transparent border-[#333] text-[#d4d4d4] hover:bg-[#2a2a2a] hover:text-white rounded-lg px-4"
                        >
                            <Settings size={16} className="mr-2" /> Settings
                        </Button>
                        <Button 
                            onClick={() => setInviteOpen(true)}
                            variant="outline" 
                            className="bg-transparent border-[#333] text-[#d4d4d4] hover:bg-[#2a2a2a] hover:text-white rounded-lg px-4"
                        >
                            <UserPlus size={16} className="mr-2" /> Invite team
                        </Button>
                    </div>
                </div>

                {/* 2. Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: "Papers analyzed", stat: stats?.papersAnalyzed || activeProject.stats.papersAnalyzed, icon: FileText },
                        { label: "Insights", stat: stats?.insights || activeProject.stats.insights, icon: Sparkles },
                        { label: "Team members", stat: stats?.teamMembers || activeProject.stats.teamMembers, icon: Users },
                        { label: "Open issues", stat: stats?.openIssues || activeProject.stats.openIssues, icon: AlertCircle },
                    ].map((item, i) => (
                        <div key={i} className="bg-[#222222] border border-[#333] rounded-xl p-4 flex flex-col justify-between h-28">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 text-[#888] text-xs font-medium">
                                    <item.icon size={14} />
                                    {item.label}
                                </div>
                                {isLoadingStats && i === 0 && <Loader2 size={12} className="animate-spin text-[#555]" />}
                            </div>
                            <div>
                                <div className="text-3xl font-semibold text-white leading-none mb-1">{item.stat.value}</div>
                                <div className="text-[#888] text-xs">{item.stat.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Resume Banner */}
                <div className="bg-[#1e293b]/40 border border-[#3b82f6]/30 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-[#1e293b]/60 transition-colors">
                    <PlayCircle className="text-[#3b82f6] shrink-0 mt-0.5" size={18} />
                    <div className="flex-1">
                        <h4 className="text-[#60a5fa] text-sm font-semibold mb-1">{activeProject.resumeBanner.title}</h4>
                        <p className="text-[#94a3b8] text-xs leading-relaxed">
                            {activeProject.resumeBanner.description}
                        </p>
                    </div>
                    <ChevronRight className="text-[#3b82f6] shrink-0" size={18} />
                </div>

                {/* 4. Two Columns: Phase Progress & My Tasks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Phase Progress */}
                    <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                        <div className="p-4 border-b border-[#333] flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                                <FileText size={16} className="text-[#888]" />
                                Phase progress
                            </h3>
                            <button className="text-[#3b82f6] text-xs font-medium hover:underline">View all</button>
                        </div>
                        <div className="p-4 space-y-4">
                            {activeProject.phases.map((phase) => {
                                if (phase.status === "done") {
                                    return (
                                        <div key={phase.name} className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                                                <span className="text-sm text-white font-medium flex-1">{phase.name}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-[#333] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#10b981] w-full" />
                                            </div>
                                            <Badge className="bg-white text-black hover:bg-gray-100 text-[10px] px-2 py-0">Done</Badge>
                                        </div>
                                    );
                                } else if (phase.status === "in-progress") {
                                    return (
                                        <div key={phase.name} className="flex items-center justify-between gap-4 bg-[#2e2617] -mx-2 px-2 py-2 rounded-lg border border-[#f59e0b]/30">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                                                <span className="text-sm text-white font-bold flex-1">{phase.name}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-[#333] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#f59e0b]" style={{ width: `${phase.progressPercent}%` }} />
                                            </div>
                                            <Badge className="bg-white text-black hover:bg-gray-100 text-[10px] px-2 py-0">{phase.progressPercent}%</Badge>
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={phase.name} className="flex items-center justify-between gap-4 opacity-50">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-2 h-2 rounded-full bg-[#555]" />
                                                <span className="text-sm text-[#d4d4d4] flex-1">{phase.name}</span>
                                            </div>
                                            <div className="w-24 h-1 bg-[#333] rounded-full overflow-hidden" />
                                            <div className="w-10 flex justify-end">
                                                <div className="w-5 h-5 rounded border border-[#555] flex items-center justify-center">
                                                    <div className="w-2 h-2 border-b border-r border-[#555] transform rotate-45 -mt-1" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>

                    {/* My Tasks */}
                    <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                        <div className="p-4 border-b border-[#333] flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                                <CheckCircle2 size={16} className="text-[#888]" />
                                My tasks
                            </h3>
                            <button className="text-[#3b82f6] text-xs font-medium hover:underline">View board</button>
                        </div>
                        <div className="p-0 max-h-[300px] overflow-y-auto">
                            {activeProject.tasks.map((task) => (
                                <div key={task.id} className="flex items-start gap-3 p-4 border-b border-[#333] last:border-0 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                                    <div className="w-4 h-4 rounded border border-[#555] mt-1 shrink-0 flex items-center justify-center">
                                        {task.completed && <CheckCircle2 size={12} className="text-emerald-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className={`text-sm font-medium leading-snug ${task.completed ? "text-[#888] line-through" : "text-white"}`}>
                                                {task.title}
                                            </p>
                                            <Badge variant="outline" className={`text-[10px] px-2 py-0 font-medium shrink-0 ${task.badgeColor}`}>
                                                {task.badge}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-[#888]">{task.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5. Knowledge Graph Snapshot */}
                <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                    <div className="p-4 border-b border-[#333] flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                            <Network size={16} className="text-[#888]" />
                            Knowledge graph snapshot
                        </h3>
                        <button className="text-[#3b82f6] text-xs font-medium hover:underline">Open full graph</button>
                    </div>
                    
                    <div className="p-6 border-b border-[#333] relative overflow-hidden flex items-center justify-center min-h-[200px]">
                        {/* Simulated Graph Lines (Background) */}
                        <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="30" y1="30" x2="50" y2="50" stroke="#888" strokeWidth="0.5" />
                            <line x1="70" y1="30" x2="50" y2="50" stroke="#888" strokeWidth="0.5" />
                            <line x1="50" y1="50" x2="40" y2="70" stroke="#888" strokeWidth="0.5" />
                            <line x1="50" y1="50" x2="70" y2="60" stroke="#888" strokeWidth="0.5" />
                            <line x1="70" y1="60" x2="80" y2="80" stroke="#888" strokeWidth="0.5" />
                            <line x1="40" y1="70" x2="50" y2="90" stroke="#888" strokeWidth="0.5" />
                        </svg>

                        <div className="flex items-center absolute left-4 text-[#888] text-xs">
                            Connected nodes
                        </div>

                        {/* Floating Nodes */}
                        <div className="relative w-full max-w-lg h-32 flex items-center justify-center">
                            <Badge className="absolute top-0 left-1/4 bg-[#e0e7ff] text-[#4f46e5] hover:bg-[#e0e7ff]">Neural plasticity</Badge>
                            <Badge className="absolute top-2 right-1/4 bg-[#e0e7ff] text-[#4f46e5] hover:bg-[#e0e7ff]">Smith et al. 2023</Badge>
                            
                            <Badge className="absolute top-10 left-1/3 bg-[#e0e7ff] text-[#4f46e5] hover:bg-[#e0e7ff]">Jones 2022</Badge>
                            <Badge className="absolute top-10 right-1/4 bg-[#ffedd5] text-[#ea580c] hover:bg-[#ffedd5]">Hypothesis draft 1</Badge>
                            
                            <Badge className="absolute bottom-10 left-1/4 bg-[#f3e8ff] text-[#9333ea] hover:bg-[#f3e8ff]">Independent variable</Badge>
                            <Badge className="absolute bottom-12 right-1/3 bg-[#dcfce7] text-[#16a34a] hover:bg-[#dcfce7]">Dataset A</Badge>
                            
                            <Badge className="absolute bottom-2 left-1/3 bg-[#ffedd5] text-[#ea580c] hover:bg-[#ffedd5]">Research gap #2</Badge>
                            
                            <Badge className="absolute -bottom-4 left-1/2 bg-[#f3e8ff] text-[#9333ea] hover:bg-[#f3e8ff]">Dependent variable</Badge>
                        </div>
                        
                        <div className="absolute right-4 bottom-4 text-xs text-[#888]">
                            12 nodes · 8 edges
                        </div>
                    </div>

                    <div className="p-4 bg-[#1a1a1a] rounded-b-xl">
                        <p className="text-xs text-[#d4d4d4] leading-relaxed">
                            <span className="text-[#888]">AI summary:</span> Your literature review nodes are converging around <strong>neural plasticity in adolescents</strong>. There is a gap between Smith 2023 and Jones 2022 that your hypothesis draft should address. No dataset is linked to your variables yet.
                        </p>
                    </div>
                </div>

                {/* 6. Two Columns: Recent Activity & Team */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                        <div className="p-4 border-b border-[#333]">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                                <Clock size={16} className="text-[#888]" />
                                Recent activity
                            </h3>
                        </div>
                        <div className="p-4 space-y-5">
                            {activeProject.activity.map((event, i) => (
                                <div key={event.id} className="flex items-start gap-3 relative">
                                    {/* Line connecting events */}
                                    {i !== activeProject.activity.length - 1 && <div className="absolute left-[3px] top-4 bottom-[-16px] w-px bg-[#333]" />}
                                    
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${event.color} z-10`} />
                                    <div className="flex-1 text-sm leading-snug">
                                        <p className="text-[#d4d4d4]">
                                            <strong className="text-white font-medium">{event.user}</strong> {event.action}
                                        </p>
                                    </div>
                                    <span className="text-[#888] text-xs shrink-0">{event.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Team */}
                    <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                        <div className="p-4 border-b border-[#333] flex items-center justify-between">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                                <Users size={16} className="text-[#888]" />
                                Team
                            </h3>
                            <button className="text-[#3b82f6] text-xs font-medium hover:underline">Manage</button>
                        </div>
                        <div className="p-0">
                            {teamMembers.length > 0 ? teamMembers.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 border-b border-[#333] last:border-0 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shrink-0">
                                            {member.init}
                                        </div>
                                        <div>
                                            <p className="text-sm text-white font-medium">{member.name}</p>
                                            <p className="text-xs text-[#888]">{member.role}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`text-[10px] px-2 py-0 ${member.statusColor}`}>
                                        {member.status}
                                    </Badge>
                                </div>
                            )) : (
                                <div className="p-4 text-center text-[#555] text-sm">No team members yet</div>
                            )}
                            <div 
                                onClick={() => setInviteOpen(true)}
                                className="flex items-center gap-3 p-4 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full border border-dashed border-[#555] flex items-center justify-center shrink-0">
                                    <Plus size={14} className="text-[#888]" />
                                </div>
                                <span className="text-sm text-[#888]">Invite a member</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <InviteTeamDialog open={inviteOpen} onOpenChange={setInviteOpen} project={activeProject} />
            <ProjectSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} project={activeProject} />
        </div>
    );
}
