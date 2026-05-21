"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, type Message } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, BrainCircuit, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ClaimsChatProps {
  projectId: string;
}

export function ClaimsChat({ projectId }: ClaimsChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/phase7/chat",
    body: { projectId },
    onError: (error: Error) => {
      console.error("Chat error:", error);
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-[#0a0a0a] border-r border-[#1a1a1a]">


      {/* Chat Messages */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#111] border border-[#222] flex items-center justify-center">
              <Bot size={24} className="text-[#555]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white mb-2">Welcome to Phase 7 Interpretation</p>
              <p className="text-xs text-[#888] leading-relaxed">
                I am your AI research assistant. Tell me about your findings, and I will help you formulate rigorous, publication-ready claims. 
                I will automatically verify them against your Phase 3 hypotheses and register them in the project.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            {messages.map((m: Message) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center shrink-0 mt-1">
                    <Bot size={14} className="text-violet-400" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === "user" 
                    ? "bg-violet-600 text-white rounded-tr-sm" 
                    : "bg-[#111] border border-[#222] text-[#d4d4d4] rounded-tl-sm prose prose-invert prose-sm prose-p:leading-relaxed prose-pre:bg-[#050505] prose-pre:border prose-pre:border-[#333]"
                }`}>
                  {m.role === "user" ? (
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  )}
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center shrink-0 mt-1">
                    <User size={14} className="text-[#888]" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-violet-400" />
                </div>
                <div className="bg-[#111] border border-[#222] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-[#888]" />
                  <span className="text-xs text-[#888]">Analyzing finding...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Form */}
      <div className="p-4 border-t border-[#1a1a1a] bg-[#050505]">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) handleSubmit(e);
          }}
          className="relative max-w-4xl mx-auto"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Describe your finding or claim..."
            className="min-h-[60px] max-h-[200px] bg-[#111] border-[#333] resize-none pr-12 text-sm rounded-xl py-3 focus-visible:ring-violet-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim()) handleSubmit(e as any);
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:hover:bg-violet-600"
          >
            <Send size={14} />
          </Button>
        </form>
        <p className="text-center text-[10px] text-[#555] mt-2">
          AI generated claims are automatically cross-referenced with Phase 3 data.
        </p>
      </div>
    </div>
  );
}
