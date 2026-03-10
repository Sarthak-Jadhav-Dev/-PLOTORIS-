"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Mic } from "lucide-react";

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
        }
    }, [value]);

    const handleSubmit = () => {
        if (!value.trim() || disabled) return;
        onSend(value.trim());
        setValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="px-6 pb-6 pt-2">
            <div className="max-w-3xl mx-auto">
                <div className="glass-card-strong p-2 flex items-end gap-2 border border-border hover:border-border-hover focus-within:border-orange-primary/30 transition-all duration-300">
                    {/* Upload Button */}
                    <button
                        className="flex-shrink-0 p-3 rounded-xl text-text-muted hover:text-orange-primary hover:bg-surface-overlay transition-all duration-200"
                        title="Attach file"
                    >
                        <Paperclip size={18} />
                    </button>

                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask Plotoris anything about your research..."
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted py-3 px-1 resize-none focus:outline-none max-h-[200px]"
                    />

                    {/* Voice Button */}
                    <button
                        className="flex-shrink-0 p-3 rounded-xl text-text-muted hover:text-orange-primary hover:bg-surface-overlay transition-all duration-200"
                        title="Voice input"
                    >
                        <Mic size={18} />
                    </button>

                    {/* Send Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!value.trim() || disabled}
                        className={`flex-shrink-0 p-3 rounded-xl transition-all duration-200 ${value.trim()
                                ? "bg-gradient-to-r from-orange-primary to-orange-dark text-white shadow-lg shadow-orange-primary/20 hover:shadow-orange-primary/40"
                                : "bg-surface-overlay text-text-muted"
                            }`}
                    >
                        <Send size={18} />
                    </button>
                </div>

                <p className="text-center text-xs text-text-muted mt-3">
                    Plotoris can make mistakes. Always verify important research data.
                </p>
            </div>
        </div>
    );
}
