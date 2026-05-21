"use client";

import { ResearchClaim, ClaimVerdict } from "@/types/research";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, FileText, ImageIcon } from "lucide-react";

interface ClaimCardProps {
  claim: ResearchClaim;
}

const verdictConfig: Record<string, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  "Supported": {
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  "Partially Supported": {
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  "Unsupported": {
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
  },
  "Inconclusive": {
    icon: HelpCircle,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
  },
};

export function ClaimCard({ claim }: ClaimCardProps) {
  const verdict = claim.ai_verdict as ClaimVerdict;
  const config = verdict ? (verdictConfig[verdict] ?? verdictConfig["Inconclusive"]) : verdictConfig["Inconclusive"];
  const VerdictIcon = config.icon;
  const confidence = claim.confidence_score ?? 0;
  const confColor = confidence >= 75 ? "bg-emerald-500" : confidence >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <Card className="bg-[#111] border-[#222] hover:border-[#333] transition-all duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-[#e0e0e0] leading-relaxed flex-1 line-clamp-3">
            &ldquo;{claim.claim_text}&rdquo;
          </p>
          <Badge
            className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color} ${config.border} border`}
          >
            <VerdictIcon size={10} className="mr-1" />
            {claim.ai_verdict ?? "Pending"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        {/* Confidence bar */}
        {claim.confidence_score !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-[#666]">
              <span>Confidence</span>
              <span className={`font-semibold ${config.color}`}>{confidence}%</span>
            </div>
            <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${confColor}`}
                style={{ width: `${confidence}%` }}
              />
            </div>
          </div>
        )}

        {/* Evidence summary */}
        {claim.evidence_summary && (
          <p className="text-xs text-[#888] leading-relaxed border-l-2 border-[#333] pl-3">
            {claim.evidence_summary}
          </p>
        )}

        {/* Attachments */}
        {claim.attachment_names && claim.attachment_names.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {claim.attachment_names.map((name, i) => {
              const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
              return (
                <a
                  key={i}
                  href={claim.attachment_urls?.[i] ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-[#888] hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 transition-colors"
                >
                  {isImage ? <ImageIcon size={10} className="text-blue-400" /> : <FileText size={10} className="text-orange-400" />}
                  <span className="truncate max-w-[100px]">{name}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-[#555]">
          {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
