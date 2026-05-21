"use client";

import { useDroppable } from '@dnd-kit/core';
import { PaperStatus, ResearchPaper } from '@/types/research';
import { Card } from '@/components/publishing/Card';
import { Badge } from '@/components/ui/badge';

interface ColumnProps {
  status: PaperStatus;
  papers: ResearchPaper[];
}

export function Column({ status, papers }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div className="flex flex-col flex-1 min-w-[280px] max-w-[320px] bg-[#111] border border-[#222] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a1a1a] border-b border-[#333]">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">{status}</h2>
        <Badge variant="outline" className="text-xs bg-[#222] border-[#444] text-[#888]">
          {papers.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 p-3 overflow-y-auto transition-colors ${
          isOver ? 'bg-[#1a1a1a]' : 'bg-transparent'
        }`}
      >
        {papers.map((paper) => (
          <Card key={paper.id} paper={paper} />
        ))}
        {papers.length === 0 && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-[#333] rounded-lg">
            <span className="text-xs text-[#555]">Drop papers here</span>
          </div>
        )}
      </div>
    </div>
  );
}
