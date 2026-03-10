"use client";

import { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import ChatSidebar from "@/components/chat/chat-sidebar";
import ChatMessages, { type Message } from "@/components/chat/chat-messages";
import ChatInput from "@/components/chat/chat-input";

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

export default function ChatPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeChat, setActiveChat] = useState("1");
    const [messages, setMessages] = useState<Message[]>([]);

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
    }, []);

    return (
        <div className="h-screen flex bg-background">
            {/* Sidebar */}
            <ChatSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                activeChat={activeChat}
                onSelectChat={setActiveChat}
                onNewChat={handleNewChat}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-border bg-surface/50 backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 rounded-lg hover:bg-surface-raised transition-colors"
                            >
                                <Menu size={20} />
                            </button>
                        )}
                        <div>
                            <h1 className="text-sm font-semibold">Plotoris AI</h1>
                            <p className="text-xs text-text-muted">Research Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                        </span>
                    </div>
                </div>

                {/* Messages */}
                <ChatMessages messages={messages} />

                {/* Input */}
                <ChatInput onSend={handleSend} />
            </div>
        </div>
    );
}
