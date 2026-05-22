"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, FolderKanban, Clock, Users, Search, Grid3X3,
  List, MoreHorizontal, ArrowRight, Sparkles, Loader2, RefreshCw, Trash2, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import CreateProjectDialog from "./create-project-dialog";
import { authHeaders, getUser } from "@/lib/auth";

interface ProjectMember {
  user_id: string;
  role: string;
  Users: { id: string; user_name: string; email: string };
}

interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  ProjectMembers: ProjectMember[];
}

const TEMPLATE_CARDS = [
  { icon: Sparkles, label: "AI Research", desc: "ML & deep learning studies", color: "#6366F1" },
  { icon: FolderKanban, label: "Literature Review", desc: "Systematic review workflow", color: "#10B981" },
  { icon: Users, label: "Team Research", desc: "Multi-author collaboration", color: "#F59E0B" },
];

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ProjectsHomeViewProps {
  onOpenProject: (projectId: string, projectName: string) => void;
  onCreated?: () => void;
  onInvitationAccepted?: () => void;
}

export default function ProjectsHomeView({ onOpenProject, onCreated, onInvitationAccepted }: ProjectsHomeViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const user = getUser();

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/projects", { headers: authHeaders() });
      const data = await res.json();
      setProjects(data.data ?? []);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, []);

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (res.ok) {
        setProjectToDelete(null);
        fetchProjects(); // Refresh the list
      } else {
        console.error("Failed to delete project");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505]">
      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p suppressHydrationWarning className="text-[#666] text-sm mb-1">Good {getGreeting()}, {user?.name?.split(" ")[0] ?? "Researcher"} 👋</p>
          <h1 className="text-3xl font-bold text-white">Your Research Projects</h1>
        </motion.div>

        {/* Create New — hero cards row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-4">Start Something New</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Blank project card */}
            <button onClick={() => setCreateOpen(true)}
              className="group relative h-28 rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0d0d0d] hover:border-orange-500/40 hover:bg-orange-500/3 transition-all duration-300 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus size={20} className="text-orange-400" />
              </div>
              <span className="text-xs font-semibold text-white">Blank Project</span>
            </button>

            {/* Template cards */}
            {TEMPLATE_CARDS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.label} onClick={() => setCreateOpen(true)}
                  className="group relative h-28 rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#2a2a2a] hover:bg-[#111] transition-all duration-300 flex flex-col items-start justify-end p-4 overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.06]" style={{ background: `radial-gradient(circle at top right, ${t.color}, transparent 60%)` }} />
                  <Icon size={18} className="mb-1.5" style={{ color: t.color }} />
                  <p className="text-xs font-semibold text-white text-left">{t.label}</p>
                  <p className="text-[10px] text-[#555] text-left leading-tight mt-0.5">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Projects section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#555]" />
              <p className="text-xs font-semibold text-[#555] uppercase tracking-widest">Recent Projects</p>
              {!isLoading && <Badge variant="secondary" className="bg-[#141414] text-[#666] border-[#222] text-[10px] h-4">{projects.length}</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#555]" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search projects..." className="pl-8 h-7 w-48 bg-[#0d0d0d] border-[#1a1a1a] text-white placeholder:text-[#444] text-xs focus:border-[#333]" />
              </div>
              <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-0.5">
                <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#1a1a1a] text-white" : "text-[#555] hover:text-[#888]"}`}>
                  <Grid3X3 size={13} />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#1a1a1a] text-white" : "text-[#555] hover:text-[#888]"}`}>
                  <List size={13} />
                </button>
              </div>
              <Tooltip>
                <TooltipTrigger
                  onClick={fetchProjects}
                  className="inline-flex items-center justify-center rounded-md h-7 w-7 text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                </TooltipTrigger>
                <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white text-xs">Refresh</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-[#444]" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#0d0d0d] border border-[#1a1a1a] flex items-center justify-center mb-5">
                <FolderKanban size={28} className="text-[#333]" />
              </div>
              <p className="text-white font-semibold mb-1">{searchQuery ? "No matching projects" : "No projects yet"}</p>
              <p className="text-[#555] text-sm mb-6">{searchQuery ? "Try a different search term" : "Create your first research project to get started"}</p>
              {!searchQuery && (
                <Button onClick={() => setCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9 px-5">
                  <Plus size={15} className="mr-1.5" /> Create Project
                </Button>
              )}
            </div>
          )}

          {/* Grid View */}
          {!isLoading && filtered.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filtered.map((project, i) => (
                  <motion.div key={project.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="group relative bg-[#0d0d0d] border border-[#1a1a1a] rounded-2xl overflow-hidden hover:border-[#2a2a2a] transition-all duration-300 cursor-pointer"
                    onClick={() => onOpenProject(project.id, project.name)}>
                    {/* Color bar */}
                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${project.color}18` }}>
                          <FolderKanban size={17} style={{ color: project.color }} />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            onClick={e => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[#555] hover:text-white transition-all outline-none"
                          >
                            <MoreHorizontal size={14} />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#141414] border-[#222] text-white" onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem className="focus:bg-[#1a1a1a] text-sm cursor-pointer" onClick={() => onOpenProject(project.id, project.name)}>
                              Open Project
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="focus:bg-rose-500/10 text-rose-500 focus:text-rose-400 text-sm cursor-pointer mt-1" 
                              onClick={() => setProjectToDelete({ id: project.id, name: project.name })}
                            >
                              <Trash2 size={14} className="mr-2" /> Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold text-white text-sm mb-1 truncate">{project.name}</h3>
                      {project.description && (
                        <p className="text-[#555] text-xs leading-relaxed line-clamp-2 mb-3">{project.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <Badge variant="outline" className="border-[#222] text-[#666] text-[10px] h-5 bg-[#111]">
                          {project.category}
                        </Badge>
                        {/* Member avatars */}
                        <div className="flex -space-x-1.5">
                          {(project.ProjectMembers ?? []).slice(0, 4).map(m => (
                            <Tooltip key={m.user_id}>
                              <TooltipTrigger>
                                <Avatar className="w-5 h-5 border border-[#0d0d0d]">
                                  <AvatarFallback className="text-[8px] font-bold" style={{ background: `${project.color}20`, color: project.color }}>
                                    {initials(m.Users?.user_name ?? "U")}
                                  </AvatarFallback>
                                </Avatar>
                              </TooltipTrigger>
                              <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white text-xs">
                                {m.Users?.user_name} · {m.role}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                          {(project.ProjectMembers ?? []).length > 4 && (
                            <div className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#0d0d0d] flex items-center justify-center">
                              <span className="text-[8px] text-[#666]">+{project.ProjectMembers.length - 4}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[#444] text-[10px] mt-2.5">{timeAgo(project.updated_at)}</p>
                    </div>
                    {/* Hover arrow */}
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={14} className="text-[#444]" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* List View */}
          {!isLoading && filtered.length > 0 && viewMode === "list" && (
            <div className="space-y-2">
              <AnimatePresence>
                {filtered.map((project, i) => (
                  <motion.div key={project.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => onOpenProject(project.id, project.name)}
                    className="group flex items-center gap-4 p-3.5 bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl hover:border-[#2a2a2a] cursor-pointer transition-all duration-200">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${project.color}18` }}>
                      <FolderKanban size={15} style={{ color: project.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm truncate">{project.name}</h3>
                      <p className="text-[#555] text-xs truncate">{project.description || project.category}</p>
                    </div>
                    <div className="flex -space-x-1.5 shrink-0">
                      {(project.ProjectMembers ?? []).slice(0, 3).map(m => (
                        <Avatar key={m.user_id} className="w-5 h-5 border border-[#0d0d0d]">
                          <AvatarFallback className="text-[8px] font-bold" style={{ background: `${project.color}20`, color: project.color }}>
                            {initials(m.Users?.user_name ?? "U")}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <Badge variant="outline" className="border-[#222] text-[#666] text-[10px] h-5 bg-[#111] shrink-0">{project.category}</Badge>
                    <p className="text-[#444] text-[10px] shrink-0 w-16 text-right">{timeAgo(project.updated_at)}</p>
                    <ArrowRight size={14} className="text-[#333] group-hover:text-[#555] transition-colors shrink-0" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchProjects} />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4 text-rose-500">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
                <h2 className="text-xl font-bold">Delete Project?</h2>
              </div>
              <p className="text-[#888] text-sm leading-relaxed mb-6">
                Are you absolutely sure you want to delete <strong className="text-white">{projectToDelete.name}</strong>? 
                This will permanently delete all associated data, documents, vector embeddings, and team access records from the database. 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => setProjectToDelete(null)}
                  disabled={isDeleting}
                  className="text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteProject}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
                  Yes, delete project
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
