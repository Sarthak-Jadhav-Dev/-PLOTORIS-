"use client";

import { useState, useRef, useEffect } from "react";
import { useChat, type Message } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, User, Send, BrainCircuit, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

interface ClaimsChatProps {
  projectId: string;
}

export function ClaimsChat({ projectId }: ClaimsChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/phase7/chat-history?project_id=${projectId}`);
        const data = await res.json();
        if (data.messages) setInitialMessages(data.messages);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setIsInitializing(false);
      }
    };
    fetchHistory();
  }, [projectId]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/phase7/chat",
    body: { projectId },
    initialMessages,
    fetch: async (url, options) => {
      const activeProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const apiKey = localStorage.getItem(`plotoris_${activeProvider}_key_${projectId}`) || "";
      
      const customHeaders: any = {
        ...options?.headers,
      };
      
      if (apiKey) {
        customHeaders["x-api-key"] = apiKey;
        customHeaders["x-api-provider"] = activeProvider;
      }
      
      return fetch(url, {
        ...options,
        headers: customHeaders,
      });
    },
    onError: (error: Error) => {
      console.error("Chat error:", error);
    }
  });


  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Save chat history
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      fetch("/api/phase7/chat-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, messages })
      });
    }
  }, [messages, isLoading, projectId]);

  const renderMessageContent = (content: string) => {
    const claimRegex = /<CLAIM_EXTRACT>([\s\S]*?)<\/CLAIM_EXTRACT>/g;
    let visibleContent = content;
    let claimData = null;

    const match = claimRegex.exec(content);
    if (match) {
      visibleContent = content.replace(claimRegex, "").trim();
      try {
        claimData = JSON.parse(match[1].trim());
      } catch (e) {
        console.error("Failed to parse extracted claim", e);
      }
    } else {
      // If the stream is still chunking and we only have partial <CLAIM_EXTRACT>, hide the partial string
      if (content.includes("<CLAIM_EXTRACT>")) {
        const splitIndex = content.indexOf("<CLAIM_EXTRACT>");
        visibleContent = content.substring(0, splitIndex).trim();
      }
    }

    return (
      <>
        {visibleContent && <ReactMarkdown>{visibleContent}</ReactMarkdown>}
        {claimData && (
          <div className="mt-4 p-4 rounded-xl border border-violet-500/30 bg-[#151120]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-violet-400" />
              <h4 className="text-sm font-semibold text-white">Verified Claim Registered</h4>
            </div>
            <p className="text-sm text-violet-100 font-medium mb-3">"{claimData.claim_text}"</p>
            <div className="flex items-center gap-4 mb-3">
              <div>
                <span className="text-[10px] text-[#888] uppercase tracking-wider font-bold block mb-1">AI Verdict</span>
                <Badge variant="outline" className={`text-[10px] px-2 py-0 border ${
                  claimData.ai_verdict === 'Supported' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  claimData.ai_verdict === 'Partially Supported' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {claimData.ai_verdict}
                </Badge>
              </div>
              <div>
                <span className="text-[10px] text-[#888] uppercase tracking-wider font-bold block mb-1">Confidence</span>
                <span className="text-sm text-white font-bold">{claimData.confidence_score}%</span>
              </div>
            </div>
            <div className="bg-[#0a0a0a] rounded-lg p-3 border border-[#222]">
              <span className="text-[10px] text-[#666] uppercase tracking-wider font-bold block mb-1 flex items-center gap-1">
                <ShieldAlert size={10} /> Evidence Summary
              </span>
              <p className="text-xs text-[#aaa]">{claimData.evidence_summary}</p>
            </div>
          </div>
        )}
      </>
    );
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

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
                    renderMessageContent(m.content)
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
