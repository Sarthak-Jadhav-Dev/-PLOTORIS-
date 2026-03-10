"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    MessageSquare,
    Settings,
    LogOut,
    ChevronLeft,
    Search,
    MoreHorizontal,
    Trash2,
    Edit3,
} from "lucide-react";

interface ChatSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    activeChat: string;
    onSelectChat: (id: string) => void;
    onNewChat: () => void;
}

const chatHistory = [
    {
        category: "Today",
        chats: [
            { id: "1", title: "Quantum Computing Research Analysis" },
            { id: "2", title: "Literature Review on Gene Therapy" },
        ],
    },
    {
        category: "Yesterday",
        chats: [
            { id: "3", title: "Statistical Methods Comparison" },
            { id: "4", title: "Neural Network Architecture Survey" },
        ],
    },
    {
        category: "Previous 7 Days",
        chats: [
            { id: "5", title: "Climate Change Data Patterns" },
            { id: "6", title: "Machine Learning in Healthcare" },
            { id: "7", title: "Blockchain Consensus Mechanisms" },
        ],
    },
];

export default function ChatSidebar({
    isOpen,
    onToggle,
    activeChat,
    onSelectChat,
    onNewChat,
}: ChatSidebarProps) {
    const [hoveredChat, setHoveredChat] = useState<string | null>(null);

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
                className={`fixed lg:relative top-0 left-0 h-full z-50 lg:z-auto overflow-hidden bg-surface border-r border-border flex flex-col`}
            >
                <div className="flex flex-col h-full w-[300px]">
                    {/* Header */}
                    <div className="p-4 flex items-center justify-between border-b border-border">
                        <button
                            onClick={onNewChat}
                            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-surface-raised hover:border-orange-primary/30 hover:bg-surface-overlay transition-all duration-300 group"
                        >
                            <Plus size={18} className="text-orange-primary" />
                            <span className="text-sm font-medium">New Chat</span>
                        </button>
                        <button
                            onClick={onToggle}
                            className="ml-3 p-2 rounded-lg hover:bg-surface-raised transition-colors lg:hidden"
                        >
                            <ChevronLeft size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4 pb-2">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search chats..."
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-surface-raised border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange-primary/30 transition-all duration-300"
                            />
                        </div>
                    </div>

                    {/* Chat List */}
                    <div className="flex-1 overflow-y-auto px-3 pb-4">
                        {chatHistory.map((group) => (
                            <div key={group.category} className="mb-4">
                                <p className="text-xs text-text-muted font-medium uppercase tracking-wider px-3 py-2">
                                    {group.category}
                                </p>
                                {group.chats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => onSelectChat(chat.id)}
                                        onMouseEnter={() => setHoveredChat(chat.id)}
                                        onMouseLeave={() => setHoveredChat(null)}
                                        className={`w-full text-left px-3 py-3 rounded-xl mb-1 flex items-center gap-3 group transition-all duration-200 ${activeChat === chat.id
                                                ? "bg-surface-overlay border border-orange-primary/20 text-text-primary"
                                                : "hover:bg-surface-raised text-text-secondary hover:text-text-primary"
                                            }`}
                                    >
                                        <MessageSquare size={15} className={activeChat === chat.id ? "text-orange-primary" : "text-text-muted"} />
                                        <span className="text-sm truncate flex-1">{chat.title}</span>
                                        {hoveredChat === chat.id && (
                                            <div className="flex items-center gap-1">
                                                <button className="p-1 rounded hover:bg-surface-overlay transition-colors" onClick={(e) => e.stopPropagation()}>
                                                    <Edit3 size={12} className="text-text-muted" />
                                                </button>
                                                <button className="p-1 rounded hover:bg-surface-overlay transition-colors" onClick={(e) => e.stopPropagation()}>
                                                    <Trash2 size={12} className="text-text-muted hover:text-red-400" />
                                                </button>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-surface-raised transition-colors cursor-pointer group">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-primary to-orange-dark flex items-center justify-center text-white text-xs font-bold">
                                JD
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">John Doe</p>
                                <p className="text-xs text-text-muted truncate">Free Plan</p>
                            </div>
                            <MoreHorizontal size={16} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>
            </motion.aside>
        </>
    );
}
