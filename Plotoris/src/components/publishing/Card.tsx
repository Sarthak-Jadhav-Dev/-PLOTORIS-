"use client";

import { useDraggable } from '@dnd-kit/core';
import { ResearchPaper } from '@/types/research';
import { Card as ShadCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublishing } from '@/context/PublishingContext';
import { format } from 'date-fns';
import { CalendarIcon, GripVertical, Trash2 } from 'lucide-react';

interface CardProps {
  paper: ResearchPaper;
}

export function Card({ paper }: CardProps) {
  const { deletePaper } = usePublishing();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: paper.id,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deletePaper(paper.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-3 last:mb-0 touch-none"
    >
      <ShadCard className="bg-[#1a1a1a] border-[#333] shadow-sm hover:shadow-md hover:border-[#555] transition-all duration-200 group">
        <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
          <CardTitle className="text-sm font-medium text-white line-clamp-2 pr-2 flex-1">
            {paper.title}
          </CardTitle>
          <div className="flex items-center gap-1 shrink-0">
            {/* Delete button — appears on hover */}
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-[#555] hover:text-red-400"
              title="Delete paper"
            >
              <Trash2 size={13} />
            </button>
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-[#555] group-hover:text-white transition-colors p-0.5"
            >
              <GripVertical size={16} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="flex items-center text-xs text-[#888]">
            <CalendarIcon size={12} className="mr-1" />
            <span>Updated {format(new Date(paper.updated_at), 'MMM d, yyyy')}</span>
          </div>
        </CardContent>
      </ShadCard>
    </div>
  );
}
