"use client";

import { usePublishing } from "@/context/PublishingContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { FilePlus, ArrowRightLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityLogProps {
  open: boolean;
  onClose: () => void;
}

export function ActivityLog({ open, onClose }: ActivityLogProps) {
  const { activityLogs } = usePublishing();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="activity-log"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="border-l border-[#222] bg-[#0a0a0a] flex flex-col h-full shrink-0 overflow-hidden"
          style={{ minWidth: 0 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#222] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Activity Log</h2>
              <p className="text-xs text-[#888] mt-0.5">Recent team changes</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-[#666] hover:text-white hover:bg-[#222] rounded-lg"
            >
              <X size={14} />
            </Button>
          </div>

          {/* Log Entries */}
          <ScrollArea className="flex-1 p-4">
            {activityLogs && activityLogs.length > 0 ? (
              <div className="space-y-4">
                {activityLogs.map((log) => {
                  // Parse action string: "CREATED::Paper Title" or "MOVED::Paper Title"
                  const [actionType, paperTitle] = log.action.split('::');
                  const isCreated = actionType === 'CREATED';
                  return (
                  <div key={log.id} className="flex gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isCreated ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <FilePlus size={12} className="text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <ArrowRightLeft size={12} className="text-blue-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-[#ccc] leading-snug text-xs">
                        <span className="font-semibold text-white">{log.user_name || 'Someone'}</span>
                        {isCreated ? (
                          <> created &ldquo;<span className="font-medium text-white">{paperTitle || 'a paper'}</span>&rdquo;</>
                        ) : (
                          <> moved &ldquo;<span className="font-medium text-white">{paperTitle || 'a paper'}</span>&rdquo;{' '}
                          from <span className="text-orange-400">{log.from_status}</span>{' → '}
                          <span className="text-emerald-400">{log.to_status}</span></>
                        )}
                      </p>
                      <p className="text-[10px] text-[#555]">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-32 flex flex-col items-center justify-center gap-2">
                <ArrowRightLeft size={20} className="text-[#333]" />
                <p className="text-xs text-[#555]">No recent activity yet.</p>
              </div>
            )}
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

