"use client";

import { useEffect, useState, useRef } from "react";
import { ResearchClaim } from "@/types/research";
import { ClaimCard } from "@/components/chat/phase7/claim-card";
import { createBrowserClient } from "@/lib/supabase";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ClaimsRegistryProps {
  projectId: string;
  newClaim?: Partial<ResearchClaim> | null;
}

export function ClaimsRegistry({ projectId, newClaim }: ClaimsRegistryProps) {
  const [claims, setClaims] = useState<ResearchClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserClient();
  const lastClaimId = useRef<string | null>(null);

  const fetchClaims = async () => {
    const { data, error } = await supabase
      .from("research_claims")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setClaims(data as ResearchClaim[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClaims();

    // Realtime subscription
    const channel = supabase
      .channel("research_claims_" + projectId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "research_claims", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const incoming = payload.new as ResearchClaim;
          if (incoming.id !== lastClaimId.current) {
            lastClaimId.current = incoming.id;
            setClaims((prev) => [incoming, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Claims Registry</h3>
          {claims.length > 0 && (
            <span className="ml-auto text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-full px-2 py-0.5 font-medium">
              {claims.length} claim{claims.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-xs text-[#666] mt-1">AI-verified findings from this session</p>
      </div>

      {/* Claims list */}
      <ScrollArea className="flex-1 min-h-0 p-3">
        {claims.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Shield size={18} className="text-violet-500" />
            </div>
            <p className="text-xs text-[#555] max-w-[160px] leading-relaxed">
              Claims you describe in the chat will be automatically extracted and stored here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {claims.map((claim) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <ClaimCard claim={claim} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
