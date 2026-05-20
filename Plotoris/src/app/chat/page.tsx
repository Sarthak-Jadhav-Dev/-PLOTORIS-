"use client";

import { useState, useCallback, useEffect } from "react";
import { Menu, Bell, Home, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ChatSidebar from "@/components/chat/chat-sidebar";
import ChatMessages, { type Message } from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";
import ProjectsHomeView from "@/components/chat/projects-home-view";
import ProjectDashboardView from "@/components/chat/project-dashboard-view";
import NotificationsPanel from "@/components/chat/notifications-panel";
import PhaseOneView from "@/components/chat/phase1-view";
import PhaseTwoView from "@/components/chat/phase2-view";
import PhaseThreeView from "@/components/chat/phase3-view";
import PhaseFourView from "@/components/chat/phase4-view";
import PhaseFiveView from "@/components/chat/phase5-view";
import PhaseSevenView from "@/components/chat/phase7-view";
import PhaseEightView from "@/components/chat/phase8-view";
import PhaseNineView from "@/components/chat/phase9-view";
import { authHeaders } from "@/lib/auth";
import { Project, MOCK_PROJECTS } from "@/lib/data/projects-data";

const sampleResponse = `Based on my analysis of recent quantum computing research papers, here are the key findings:

**1. Quantum Supremacy Progress**
Recent experiments have demonstrated quantum advantage on specific computational tasks, with systems exceeding 1000 qubits in 2025.

**2. Error Correction Advances**
Surface codes and topological quantum error correction have shown promising results in reducing logical error rates below the threshold needed for practical computation.

**3. Key Applications**
- Drug discovery and molecular simulation
- Cryptographic applications
- Optimization problems in logistics
- Machine learning acceleration

Would you like me to dive deeper into any of these areas or pull up specific papers for review?`;

type ViewMode = "home" | "dashboard" | "chat";

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeChat, setActiveChat] = useState("1");
    const [messages, setMessages] = useState<Message[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>("home");
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    // Notifications state
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Poll for unread notification count (every 30s)
    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications", { headers: authHeaders() });
            const data = await res.json();
            const count = (data.data ?? []).filter((n: any) => !n.is_read).length;
            setUnreadCount(count);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const handleSend = useCallback((content: string) => {
        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Simulate AI response
        setTimeout(() => {
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: sampleResponse,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setMessages((prev) => [...prev, aiMsg]);
        }, 1200);
    }, []);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        setActiveChat("new");
        setViewMode("chat");
        setActiveProject(null);
    }, []);

    const handleOpenProject = (projectId: string, projectName: string) => {
        const fullProject = MOCK_PROJECTS.find(p => p.id === projectId) || MOCK_PROJECTS[0];
        setActiveProject(fullProject);
        setActiveChat(""); // Clear active chat when opening dashboard
        setMessages([]);
        setViewMode("dashboard");
    };

    const handleSelectPhase = (phaseId: string) => {
        setActiveChat(phaseId);
        setMessages([]);
        setViewMode("chat");
    };

    const handleGoHome = () => {
        setViewMode("home");
        setActiveProject(null);
    };

    // Refresh projects list (called after accepting invitation or creating project)
    const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
    const refreshProjects = useCallback(() => {
        setProjectsRefreshKey(prev => prev + 1);
    }, []);

    return (
        <div className="h-screen flex bg-[#050505]">
            {/* Sidebar */}
            <ChatSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                activeChat={activeChat}
                onSelectChat={handleSelectPhase}
                onNewChat={handleNewChat}
                onGoHome={handleGoHome}
                onGoDashboard={() => {
                    setActiveChat("");
                    setViewMode("dashboard");
                }}
                activeProject={activeProject}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="h-14 flex items-center justify-between px-5 border-b border-[#111] bg-[#050505]/80 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-lg hover:bg-[#111] transition-colors"
                            >
                                <Menu size={18} className="text-[#666]" />
                            </button>
                        )}

                        {/* Breadcrumb */}
                        <div className="flex items-center gap-2 text-sm">
                            {viewMode === "home" ? (
                                <span className="text-white font-semibold flex items-center gap-1.5">
                                    <Home size={14} className="text-orange-400" />
                                    Home
                                </span>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={handleGoHome}
                                        className="flex items-center gap-1 text-[#555] hover:text-white transition-colors text-xs">
                                        <Home size={12} />
                                        <span>Home</span>
                                    </button>
                                    <ChevronLeft size={12} className="text-[#333] rotate-180" />
                                    {activeProject && viewMode === "chat" ? (
                                        <>
                                            <button onClick={() => setViewMode("dashboard")} className="text-[#555] hover:text-white transition-colors text-xs font-medium">
                                                {activeProject.name}
                                            </button>
                                            <ChevronLeft size={12} className="text-[#333] rotate-180" />
                                            <span className="text-white font-medium text-xs">Phase Chat</span>
                                        </>
                                    ) : (
                                        <span className="text-white font-medium text-xs">
                                            {activeProject ? activeProject.name : "New Chat"}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side: Notifications Bell (replaces Online indicator) */}
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger
                                onClick={() => setNotificationsOpen(true)}
                                className="relative p-2 rounded-lg hover:bg-[#111] transition-colors"
                            >
                                <Bell size={17} className="text-[#666] hover:text-white transition-colors" />
                                <AnimatePresence>
                                    {unreadCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                                            className="absolute -top-0.5 -right-0.5"
                                        >
                                            <Badge className="h-4 min-w-4 p-0 flex items-center justify-center bg-orange-500 text-white text-[9px] font-bold rounded-full border-2 border-[#050505]">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </Badge>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#1a1a1a] border-[#333] text-white text-xs">
                                Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === "home" ? (
                        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <ProjectsHomeView
                                key={projectsRefreshKey}
                                onOpenProject={handleOpenProject}
                                onCreated={refreshProjects}
                                onInvitationAccepted={refreshProjects}
                            />
                        </motion.div>
                    ) : viewMode === "dashboard" ? (
                        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            <ProjectDashboardView activeProject={activeProject} onSelectPhase={handleSelectPhase} />
                        </motion.div>
                    ) : (
                        <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col min-h-0 overflow-hidden">
                            {activeChat === "p1" ? (
                                <PhaseOneView />
                            ) : activeChat === "p2" ? (
                                <PhaseTwoView />
                            ) : activeChat === "p3" ? (
                                <PhaseThreeView />
                            ) : activeChat === "p4" ? (
                                <PhaseFourView />
                            ) : activeChat === "p5" ? (
                                <PhaseFiveView />
                            ) : activeChat === "p7" ? (
                                <PhaseSevenView />
                            ) : activeChat === "p8" ? (
                                <PhaseEightView />
                            ) : activeChat === "p9" ? (
                                <PhaseNineView />
                            ) : (
                                <>
                                    <ChatMessages messages={messages} />
                                    <ChatInput onSend={handleSend} />
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Notifications Panel */}
            <NotificationsPanel
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
                onCountChange={setUnreadCount}
                onInvitationAccepted={refreshProjects}
            />
        </div>
    );
}
