"use client";

import React, { useState } from 'react';
import { usePublishing } from '@/context/PublishingContext';
import { Column } from '@/components/publishing/Column';
import { PaperStatus, ResearchPaper } from '@/types/research';
import { DndContext, closestCenter, DragOverlay, DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { Card } from '@/components/publishing/Card';
import { Loader2, ClipboardList, Save, CheckCircle2 } from 'lucide-react';
import { CreatePaperDialog } from '@/components/publishing/CreatePaperDialog';
import { ActivityLog } from '@/components/publishing/ActivityLog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublishingTracker() {
  const { papersByStatus, movePaper, isLoading } = usePublishing();
  const [activePaper, setActivePaper] = useState<ResearchPaper | null>(null);
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const paperId = active.id as string;
    for (const status of Object.keys(papersByStatus) as PaperStatus[]) {
      const paper = papersByStatus[status].find(p => p.id === paperId);
      if (paper) { setActivePaper(paper); break; }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActivePaper(null);
    if (over && active.id !== over.id) {
      const paperId = active.id as string;
      const toStatus = over.id as PaperStatus;
      await movePaper(paperId, toStatus);
      // Flash the "Saved" indicator briefly
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-[#888] text-sm">Loading Publishing Board...</p>
      </div>
    );
  }

  const columns: PaperStatus[] = ['Drafting', 'Pre-print', 'Submitted', 'Under Review', 'Accepted'];

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex overflow-hidden">

        {/* Main Board Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a1a1a] bg-[#080808] shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-white">Kanban Board</h2>
              {/* Saved flash indicator */}
              <AnimatePresence>
                {savedFlash && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"
                  >
                    <CheckCircle2 size={13} />
                    <span>Saved</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              {/* Activity Log toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivityLogOpen(prev => !prev)}
                className={`gap-2 text-xs h-8 px-3 rounded-lg border transition-colors ${
                  activityLogOpen
                    ? 'border-orange-500/40 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20'
                    : 'border-[#333] text-[#888] hover:text-white hover:bg-[#1a1a1a]'
                }`}
              >
                <ClipboardList size={14} />
                Activity Log
                {activityLogOpen ? null : (
                  <Badge className="ml-1 h-4 min-w-4 px-1 text-[9px] bg-orange-500 text-white rounded-full">
                    Live
                  </Badge>
                )}
              </Button>

              {/* New Paper button */}
              <CreatePaperDialog />
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-[#050505] p-6">
            <div className="flex gap-5 h-full min-h-[500px]">
              {columns.map(status => (
                <Column key={status} status={status} papers={papersByStatus[status] || []} />
              ))}
            </div>
          </div>
        </div>

        {/* Collapsible Activity Log Sidebar */}
        <ActivityLog open={activityLogOpen} onClose={() => setActivityLogOpen(false)} />
      </div>

      <DragOverlay>
        {activePaper ? (
          <div className="w-[280px]">
            <Card paper={activePaper} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

