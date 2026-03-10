"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, User, Copy, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface ChatMessagesProps {
    messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center px-6">
                <div className="text-center max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-primary to-orange-dark flex items-center justify-center mx-auto mb-6 glow-orange">
                            <Bot size={36} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3">How can I help with your research?</h2>
                        <p className="text-text-secondary mb-8">
                            Ask me anything about research papers, data analysis, or scientific concepts.
                        </p>

                        {/* Suggestion Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                "Summarize a research paper on quantum entanglement",
                                "Compare methodologies in gene therapy studies",
                                "Explain transformer architecture in NLP",
                                "Find recent papers on climate modeling",
                            ].map((suggestion, i) => (
                                <motion.button
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="text-left p-4 rounded-xl border border-border bg-surface-raised hover:border-orange-primary/30 hover:bg-surface-overlay transition-all duration-300 text-sm text-text-secondary"
                                >
                                    {suggestion}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {messages.map((msg, i) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
                    >
                        {msg.role === "assistant" && (
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-orange-primary to-orange-dark flex items-center justify-center">
                                <Bot size={18} className="text-white" />
                            </div>
                        )}

                        <div
                            className={`max-w-[80%] ${msg.role === "user"
                                    ? "bg-orange-primary/10 border border-orange-primary/20 rounded-2xl rounded-br-md px-5 py-4"
                                    : "glass-card px-5 py-4 rounded-2xl rounded-bl-md"
                                }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                                <span className="text-xs text-text-muted flex-1">{msg.timestamp}</span>
                                {msg.role === "assistant" && (
                                    <div className="flex items-center gap-1">
                                        <button className="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors" title="Copy">
                                            <Copy size={13} className="text-text-muted" />
                                        </button>
                                        <button className="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors" title="Good response">
                                            <ThumbsUp size={13} className="text-text-muted" />
                                        </button>
                                        <button className="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors" title="Bad response">
                                            <ThumbsDown size={13} className="text-text-muted" />
                                        </button>
                                        <button className="p-1.5 rounded-lg hover:bg-surface-overlay transition-colors" title="Regenerate">
                                            <RotateCcw size={13} className="text-text-muted" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {msg.role === "user" && (
                            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-surface-overlay border border-border flex items-center justify-center">
                                <User size={18} className="text-text-secondary" />
                            </div>
                        )}
                    </motion.div>
                ))}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}
