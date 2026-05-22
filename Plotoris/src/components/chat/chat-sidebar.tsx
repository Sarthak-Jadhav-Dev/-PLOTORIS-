"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    MessageSquare,
    LogOut,
    ChevronLeft,
    Search,
    MoreHorizontal,
    Trash2,
    Edit3,
    UserCircle,
    Sliders,
    Key,
    Home,
    FileText,
    BookOpen,
    Lightbulb,
    PenTool,
    Database,
    BarChart2,
    FileEdit,
    Send,
    PieChart,
    Lock,
    Globe
} from "lucide-react";
import Link from "next/link";

interface ChatSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    activeChat: string;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
    onGoHome?: () => void;
    onGoDashboard?: () => void;
    activeProject?: { id: string; name: string } | null;
    onOpenProject?: (id: string, name: string) => void;
    projectsRefreshKey?: number;
}



const RESEARCH_PHASES = [
    { id: "p1", title: "Identification of Problem", icon: FileText },
    { id: "p2", title: "Study Existing Papers", icon: BookOpen },
    { id: "p3", title: "Formulating Hypothesis", icon: Lightbulb },
    { id: "p4", title: "Research Design", icon: PenTool },
    { id: "p-tools", title: "Phase 5: Research Tools", icon: Search, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30" },
    { id: "p5", title: "Phase 7: Data Collection & Analysis", icon: Database },
    { id: "p6", title: "Phase 8: Interpretation of Results", icon: BarChart2 },
    { id: "p7", title: "Phase 9: Drafting Research Papers", icon: FileEdit },
    { id: "p8", title: "Phase 10: Publication", icon: Send },
];

export default function ChatSidebar({
    isOpen,
    onToggle,
    activeChat,
    onSelectChat,
    onNewChat,
    onGoHome,
    onGoDashboard,
    activeProject,
    onOpenProject,
    projectsRefreshKey,
}: ChatSidebarProps) {
    const [hoveredChat, setHoveredChat] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userName, setUserName] = useState("John Doe");
    const [userInitials, setUserInitials] = useState("JD");
    const [userEmail, setUserEmail] = useState("");
    const [allowedPhases, setAllowedPhases] = useState<string[] | "ALL">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    // Fetch projects for the sidebar
    useEffect(() => {
        if (!activeProject && userEmail) {
            setIsLoadingProjects(true);
            fetch("/api/projects", {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.data) {
                        setProjects(data.data.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()));
                    }
                })
                .catch(console.error)
                .finally(() => setIsLoadingProjects(false));
        }
    }, [activeProject, userEmail, projectsRefreshKey]);

    // Extract user info from token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.name) {
                    setUserName(payload.name);
                    const initials = payload.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                    setUserInitials(initials.substring(0, 2));
                }
                if (payload.email) setUserEmail(payload.email);
            } catch {
                console.error("Failed to decode token");
            }
        } else {
            setUserEmail("researcher@plotoris.com");
        }
    }, []);

    // Enforce RBAC
    useEffect(() => {
        if (activeProject?.id && userEmail) {
            const storedTeam = localStorage.getItem(`plotoris_team_${activeProject.id}`);
            if (storedTeam) {
                const team = JSON.parse(storedTeam);
                const me = team.find((m: any) => m.email === userEmail);
                if (me) {
                    if (me.role === "ADMIN") {
                        setAllowedPhases("ALL");
                    } else {
                        setAllowedPhases(me.allowed_phases || []);
                    }
                } else {
                    // Edge case: if user accidentally saved the mock team (admin@plotoris.com)
                    const hasMockAdmin = team.some((m: any) => m.email === "admin@plotoris.com" && m.role === "ADMIN");
                    if (hasMockAdmin && team.length <= 2) {
                        setAllowedPhases("ALL"); // Auto-recover from mock data bug
                    } else {
                        setAllowedPhases([]); // strict
                    }
                }
            } else {
                setAllowedPhases("ALL"); // default open if not configured
            }
        }
    }, [activeProject?.id, userEmail, isOpen]);

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onToggle}
                        className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    width: isOpen ? 300 : 0,
                    opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={`fixed lg:relative top-0 left-0 h-full z-50 lg:z-auto overflow-hidden bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col`}
            >
                <div className="flex flex-col h-full w-[300px]">
                    {/* Header */}
                    <div className="p-3 border-b border-[#1a1a1a] space-y-2">
                        {/* Home Button */}
                        <button
                            onClick={onGoHome}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1a1a1a] transition-all duration-200 group"
                        >
                            <Home size={16} className="text-[#555] group-hover:text-orange-primary transition-colors" />
                            <span className="text-sm text-[#777] group-hover:text-white transition-colors">Home</span>
                        </button>
                        {activeProject && onGoDashboard && (
                            <button
                                onClick={onGoDashboard}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1a1a1a] transition-all duration-200 group"
                            >
                                <FileText size={16} className="text-[#555] group-hover:text-orange-primary transition-colors" />
                                <span className="text-sm text-[#777] group-hover:text-white transition-colors">Dashboard</span>
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            <Link
                                href="/"
                                className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#222] bg-[#141414] hover:border-orange-primary/30 hover:bg-[#1a1a1a] transition-all duration-300 group text-white"
                            >
                                <Globe size={16} className="text-orange-primary" />
                                <span className="text-sm font-medium">Plotoris.com</span>
                            </Link>
                            <button
                                onClick={onToggle}
                                className="p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors lg:hidden text-white"
                            >
                                <ChevronLeft size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="p-4 pb-2">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                            <input
                                type="text"
                                placeholder={activeProject ? "Search phases..." : "Search projects..."}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#141414] border border-[#222] text-sm text-white placeholder:text-[#555] focus:outline-none focus:border-orange-primary/30 transition-all duration-300"
                            />
                        </div>
                    </div>

                    {/* Chat List / Project Phases */}
                    <div className="flex-1 overflow-y-auto px-3 pb-4">
                        {activeProject ? (
                            <div className="mb-4">
                                <p className="text-xs text-[#555] font-semibold uppercase tracking-wider px-3 py-2 mt-2">
                                    Research Methodology
                                </p>
                                {RESEARCH_PHASES.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((phase) => {
                                    const Icon = phase.icon;
                                    const isLocked = allowedPhases !== "ALL" && !allowedPhases.includes(phase.id);

                                    return (
                                        <button
                                            key={phase.id}
                                            onClick={() => {
                                                if (isLocked) {
                                                    alert("You do not have permission to access this phase.");
                                                    return;
                                                }
                                                onSelectChat(phase.id);
                                            }}
                                            className={`w-full text-left px-3 py-3 rounded-xl mb-1 flex items-center gap-3 group transition-all duration-200 
                                                ${isLocked ? 'opacity-50 cursor-not-allowed bg-transparent border-transparent' : ''}
                                                ${activeChat === phase.id && !isLocked
                                                    ? `border text-white ${phase.bgColor || 'bg-[#1a1a1a]'} ${phase.borderColor || 'border-orange-primary/20'}`
                                                    : !isLocked ? `hover:bg-[#141414] text-[#888] hover:text-white ${phase.color ? `hover:${phase.color}` : ''}` : 'text-[#555]'
                                                }`}
                                        >
                                            {isLocked ? (
                                                <Lock size={15} className="text-[#555]" />
                                            ) : (
                                                <Icon size={15} className={activeChat === phase.id ? (phase.color || "text-orange-primary") : (phase.color || "text-[#555] group-hover:text-[#888]")} />
                                            )}
                                            <span className="text-sm truncate flex-1 leading-snug">{phase.title}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-xs text-[#555] font-semibold uppercase tracking-wider px-3 py-2 mt-2">
                                    Recent Projects
                                </p>
                                {isLoadingProjects ? (
                                    <div className="flex justify-center py-4">
                                        <div className="w-5 h-5 border-2 border-[#333] border-t-orange-primary rounded-full animate-spin" />
                                    </div>
                                ) : projects.length === 0 ? (
                                    <div className="text-center py-4 text-[#555] text-sm px-4">No projects found. Create one to get started!</div>
                                ) : (
                                    projects
                                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((project) => (
                                            <div
                                                key={project.id}
                                                onClick={() => onOpenProject?.(project.id, project.name)}
                                                onMouseEnter={() => setHoveredChat(project.id)}
                                                onMouseLeave={() => setHoveredChat(null)}
                                                className="w-full text-left px-3 py-3 rounded-xl mb-1 flex items-center gap-3 group transition-all duration-200 cursor-pointer hover:bg-[#141414] text-[#888] hover:text-white"
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-[#222] group-hover:border-orange-primary/30 transition-colors">
                                                    <Database size={14} className="text-[#555] group-hover:text-orange-400 transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium truncate block text-white">{project.name}</span>
                                                    <span className="text-[10px] text-[#666] truncate block mt-0.5">{project.category || "Research Project"}</span>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer with Dropdown Menu */}
                    <div className="p-4 border-t border-[#1a1a1a] relative">
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-full left-4 right-4 mb-2 bg-surface-raised border border-border shadow-2xl rounded-xl overflow-hidden z-50 p-1"
                                >
                                    <div className="flex flex-col">
                                        <button
                                            onClick={() => {
                                                localStorage.removeItem("token");
                                                window.location.href = "/login";
                                            }}
                                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left"
                                        >
                                            <LogOut size={16} /> Log out
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer group ${isMenuOpen ? "bg-[#1a1a1a]" : "hover:bg-[#141414]"}`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-primary to-orange-dark flex items-center justify-center text-white text-xs font-bold">
                                {userInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-white">{userName}</p>
                                <p className="text-xs text-[#666] truncate">Free Plan</p>
                            </div>
                            <MoreHorizontal size={16} className={`text-[#555] transition-opacity ${isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                        </div>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
