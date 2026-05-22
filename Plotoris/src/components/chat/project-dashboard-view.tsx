"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    FileText,
    Settings,
    UserPlus,
    Home,
    ChevronRight,
    Loader2,
    Database,
    Clock,
    Github,
    Shield,
    CheckCircle2,
    BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import InviteTeamDialog from "@/components/chat/invite-team-dialog";
import ProjectSettingsDialog from "@/components/chat/project-settings-dialog";
import { Project } from "@/lib/data/projects-data";
import { createBrowserClient } from "@/lib/supabase";

interface ProjectDashboardViewProps {
    activeProject: Project | null;
    onSelectPhase: (id: string) => void;
}

export default function ProjectDashboardView({ activeProject, onSelectPhase }: ProjectDashboardViewProps) {
    const [inviteOpen, setInviteOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    // Data States
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [designTypes, setDesignTypes] = useState<any>(null);
    const [papers, setPapers] = useState<any[]>([]);
    const [githubLinks, setGithubLinks] = useState<any[]>([]);
    const [timeline, setTimeline] = useState<any>(null);
    const [datasetKanban, setDatasetKanban] = useState<any>(null);
    const [claims, setClaims] = useState<any[]>([]);

    useEffect(() => {
        if (!activeProject?.id) return;

        const fetchDashboardData = async () => {
            setIsLoadingData(true);
            const supabase = createBrowserClient();
            
            try {
                // Fetch Design Selection
                const { data: designData } = await supabase
                    .from("Documents")
                    .select("content")
                    .eq("metadata->>project_id", activeProject.id)
                    .eq("metadata->>type", "design_selection")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                if (designData?.content) {
                    try { setDesignTypes(JSON.parse(designData.content)); } catch(e) { console.error(e); }
                }

                // Fetch Uploaded Papers
                const { data: papersData } = await supabase
                    .from("Documents")
                    .select("metadata")
                    .eq("metadata->>project_id", activeProject.id)
                    .eq("metadata->>type", "fetched_paper");
                
                if (papersData) setPapers(papersData.map(d => d.metadata));

                // Fetch Github Links
                const { data: githubData } = await supabase
                    .from("Documents")
                    .select("metadata")
                    .eq("metadata->>project_id", activeProject.id)
                    .eq("metadata->>type", "github_repo_link");
                
                if (githubData) setGithubLinks(githubData.map(d => d.metadata));

                // Fetch Timeline
                const { data: timelineData } = await supabase
                    .from("Documents")
                    .select("content")
                    .eq("metadata->>project_id", activeProject.id)
                    .eq("metadata->>type", "timeline")
                    .limit(1)
                    .maybeSingle();

                if (timelineData?.content) {
                    try { setTimeline(JSON.parse(timelineData.content)); } catch(e) { console.error(e); }
                }

                // Fetch Dataset Kanban
                const { data: kanbanData } = await supabase
                    .from("Documents")
                    .select("content")
                    .eq("metadata->>project_id", activeProject.id)
                    .eq("metadata->>type", "dataset_kanban")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (kanbanData?.content) {
                    try { setDatasetKanban(JSON.parse(kanbanData.content)); } catch(e) { console.error(e); }
                }

                // Fetch Claims
                const { data: claimsData } = await supabase
                    .from("research_claims")
                    .select("*")
                    .eq("project_id", activeProject.id)
                    .order("created_at", { ascending: false });

                if (claimsData) setClaims(claimsData);

            } catch (error) {
                console.error("Error fetching dashboard data", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchDashboardData();
    }, [activeProject?.id]);

    if (!activeProject) return null;

    return (
        <div className="flex-1 overflow-y-auto bg-[#1a1a1a] text-[#d4d4d4] p-4 lg:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#333] pb-6">
                    <div>
                        <div className="flex items-center gap-2 text-xs text-[#888] mb-4">
                            <Home size={14} />
                            <span>Home</span>
                            <ChevronRight size={12} />
                            <span className="text-[#d4d4d4] font-medium">{activeProject.name}</span>
                        </div>
                        
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

                {isLoadingData ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-[#888]" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Selected Design Types & Uploaded Research Papers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Selected Design Types */}
                            <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                                <div className="p-4 border-b border-[#333] flex items-center gap-2">
                                    <FileText size={16} className="text-[#888]" />
                                    <h3 className="text-sm font-semibold text-white">Selected Design Types</h3>
                                </div>
                                <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto">
                                    {designTypes && !designTypes.recommendations ? (
                                        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-emerald-400 text-sm font-semibold">{designTypes.design_type}</h4>
                                                <Badge variant="outline" className="text-[10px] border-[#444] text-[#888]">{designTypes.tag}</Badge>
                                                {designTypes.confidence && <Badge variant="outline" className="text-[10px] border-[#444] text-[#888]">{designTypes.confidence}% confidence</Badge>}
                                            </div>
                                            <p className="text-xs text-[#a0aec0] mb-2 leading-relaxed">{designTypes.rationale}</p>
                                            <div className="flex gap-4 mt-3 bg-[#2a2a2a] p-2 rounded border border-[#444]">
                                                <div className="flex-1 text-[10px] text-[#888]">
                                                    <strong className="text-[#a0aec0] block mb-1 uppercase tracking-wider">Pros:</strong>
                                                    <ul className="list-disc pl-3 space-y-1">
                                                        {designTypes.pros?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                    </ul>
                                                </div>
                                                <div className="flex-1 text-[10px] text-[#888]">
                                                    <strong className="text-[#a0aec0] block mb-1 uppercase tracking-wider">Cons:</strong>
                                                    <ul className="list-disc pl-3 space-y-1">
                                                        {designTypes.cons?.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-[#888] text-center py-4">No design types selected yet.</div>
                                    )}
                                </div>
                            </div>

                            {/* Uploaded Research Papers */}
                            <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                                <div className="p-4 border-b border-[#333] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={16} className="text-[#888]" />
                                        <h3 className="text-sm font-semibold text-white">Uploaded Research Papers</h3>
                                    </div>
                                    <Badge className="bg-[#333] text-[#d4d4d4] hover:bg-[#333]">{papers.length}</Badge>
                                </div>
                                <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
                                    {papers.length > 0 ? papers.map((paper, idx) => (
                                        <div key={idx} className="flex items-start gap-3 bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
                                            <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                                                <FileText size={14} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white line-clamp-2">{paper.title || paper.id || "Untitled Paper"}</p>
                                                <p className="text-xs text-[#888] mt-1">{paper.authors ? (Array.isArray(paper.authors) ? paper.authors.join(", ") : paper.authors) : "Unknown authors"}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-sm text-[#888] text-center py-4">No papers uploaded.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Linked Github Repos & Timeline */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Linked GitHub Repositories */}
                            <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                                <div className="p-4 border-b border-[#333] flex items-center gap-2">
                                    <Github size={16} className="text-[#888]" />
                                    <h3 className="text-sm font-semibold text-white">Linked GitHub Repositories</h3>
                                </div>
                                <div className="p-4 max-h-[300px] overflow-y-auto space-y-3">
                                    {githubLinks.length > 0 ? githubLinks.map((link, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#333] rounded-lg p-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                <Github size={16} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{link.repo_name || link.github_url}</p>
                                                <a href={link.github_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                                                    {link.github_url}
                                                </a>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-sm text-[#888] text-center py-4">No GitHub repositories linked.</div>
                                    )}
                                </div>
                            </div>

                            {/* Timeline Finalized */}
                            <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                                <div className="p-4 border-b border-[#333] flex items-center gap-2">
                                    <Clock size={16} className="text-[#888]" />
                                    <h3 className="text-sm font-semibold text-white">Timeline Finalized</h3>
                                </div>
                                <div className="p-4 max-h-[300px] overflow-y-auto">
                                    {timeline?.milestones?.length > 0 ? (
                                        <div className="space-y-4">
                                            {timeline.milestones.map((m: any, idx: number) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5" />
                                                        {idx !== timeline.milestones.length - 1 && <div className="w-px h-full bg-[#333] mt-2" />}
                                                    </div>
                                                    <div className="pb-4">
                                                        <p className="text-sm font-bold text-white mb-1">{m.name || m.description || m.phase}</p>
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10 px-2 py-0">
                                                                M{m.startMonth + 1} - M{m.startMonth + m.duration}
                                                            </Badge>
                                                            <span className="text-[#888]">{m.duration} month{m.duration > 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-sm text-[#888] text-center py-4">No timeline generated yet.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Kanban of Datasets Used */}
                        <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                            <div className="p-4 border-b border-[#333] flex items-center gap-2">
                                <Database size={16} className="text-[#888]" />
                                <h3 className="text-sm font-semibold text-white">Kanban of Datasets Used</h3>
                            </div>
                            <div className="p-4 overflow-x-auto">
                                {datasetKanban?.columns?.length > 0 ? (
                                    <div className="flex gap-4 min-w-max pb-2">
                                        {datasetKanban.columns.map((col: any) => (
                                            <div key={col.id} className="w-72 bg-[#1a1a1a] rounded-lg border border-[#333] p-3 flex flex-col">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-bold text-white">{col.name}</h4>
                                                    <Badge className="bg-[#333] text-white hover:bg-[#333]">{col.cards?.length || 0}</Badge>
                                                </div>
                                                <div className="space-y-2 flex-1">
                                                    {col.cards?.length > 0 ? col.cards.map((card: any) => (
                                                        <div key={card.id} className="bg-[#222] border border-[#444] rounded p-2">
                                                            <p className="text-xs font-semibold text-white mb-1">{card.title}</p>
                                                            <div className="flex items-center justify-between mt-1">
                                                                <span className="text-[10px] text-[#888] uppercase">{card.type}</span>
                                                                {card.url && <a href={card.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline">Link</a>}
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="text-[10px] text-[#555] text-center py-2 italic border border-dashed border-[#333] rounded">Empty column</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-[#888] text-center py-4">No datasets kanban board saved.</div>
                                )}
                            </div>
                        </div>

                        {/* Interpretation of Results Claims */}
                        <div className="bg-[#222222] border border-[#333] rounded-xl flex flex-col">
                            <div className="p-4 border-b border-[#333] flex items-center gap-2">
                                <Shield size={16} className="text-violet-400" />
                                <h3 className="text-sm font-semibold text-white">Noticed Claims</h3>
                                <Badge className="ml-2 bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/20 font-medium">
                                    Phase 8: Interpretation of Results
                                </Badge>
                            </div>
                            <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
                                {claims.length > 0 ? claims.map((claim) => (
                                    <div key={claim.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-1 h-full ${
                                            claim.ai_verdict === "Supported" ? "bg-emerald-500" :
                                            claim.ai_verdict === "Partially Supported" ? "bg-amber-500" :
                                            claim.ai_verdict === "Unsupported" ? "bg-rose-500" : "bg-[#888]"
                                        }`} />
                                        <div className="pl-3">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <p className="text-sm font-medium text-white leading-relaxed flex-1">"{claim.claim_text}"</p>
                                                <Badge variant="outline" className={`shrink-0 ${
                                                    claim.ai_verdict === "Supported" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                                                    claim.ai_verdict === "Partially Supported" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
                                                    claim.ai_verdict === "Unsupported" ? "text-rose-400 border-rose-500/30 bg-rose-500/10" :
                                                    "text-[#888] border-[#333] bg-[#222]"
                                                }`}>
                                                    {claim.ai_verdict || "Pending Verification"}
                                                </Badge>
                                            </div>
                                            {claim.evidence_summary && (
                                                <p className="text-xs text-[#a0aec0] bg-[#222] p-2 rounded-lg border border-[#333] mb-3">
                                                    {claim.evidence_summary}
                                                </p>
                                            )}
                                            {claim.confidence_score !== null && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] uppercase text-[#888] font-bold tracking-wider">AI Confidence</span>
                                                    <div className="flex-1 h-1.5 bg-[#333] rounded-full overflow-hidden max-w-[100px]">
                                                        <div 
                                                            className={`h-full ${claim.confidence_score >= 80 ? 'bg-emerald-500' : claim.confidence_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                                            style={{ width: `${claim.confidence_score}%` }} 
                                                        />
                                                    </div>
                                                    <span className="text-xs text-[#d4d4d4] font-medium">{claim.confidence_score}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-sm text-[#888] text-center py-8 flex flex-col items-center gap-2">
                                        <Shield size={24} className="text-[#333]" />
                                        <p>No claims have been noticed and verified yet.</p>
                                        <p className="text-xs">Head to Phase 8: Interpretation of Results to verify your findings.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* Modals */}
            <InviteTeamDialog open={inviteOpen} onOpenChange={setInviteOpen} project={activeProject} />
            <ProjectSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} project={activeProject} />
        </div>
    );
}
