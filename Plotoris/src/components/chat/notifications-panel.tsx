"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, X, UserPlus, FolderKanban, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { authHeaders } from "@/lib/auth";

export interface Notification {
  id: string;
  type: "invitation" | "info" | "alert";
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    project_id?: string;
    project_name?: string;
    member_id?: string;
    role?: string;
    inviter_name?: string;
  };
}

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Triggers parent re-fetch of notification count
  onCountChange?: (count: number) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPanel({ open, onOpenChange, onCountChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications", { headers: authHeaders() });
      const data = await res.json();
      const notifs: Notification[] = data.data ?? [];
      setNotifications(notifs);
      onCountChange?.(notifs.filter(n => !n.is_read).length);
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [onCountChange]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: authHeaders(), body: JSON.stringify({ ids: [] }) });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onCountChange?.(0);
  };

  const respondToInvitation = async (notif: Notification, action: "accept" | "decline") => {
    if (!notif.metadata?.member_id) return;
    setRespondingId(notif.id);

    try {
      const res = await fetch("/api/invitations/respond", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ member_id: notif.metadata.member_id, action, notification_id: notif.id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n =>
          n.id === notif.id ? { ...n, is_read: true, type: "info" as const, message: action === "accept" ? `✓ Joined as ${notif.metadata?.role}` : "✗ Invitation declined" } : n
        ));
        onCountChange?.(notifications.filter(n => !n.is_read && n.id !== notif.id).length);
      }
    } catch { /* silent */ }
    finally { setRespondingId(null); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[420px] bg-[#0d0d0d] border-[#1a1a1a] text-white p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Bell size={16} className="text-orange-400" />
              </div>
              <SheetTitle className="text-white font-semibold text-base">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge className="bg-orange-500 text-white text-xs px-1.5 py-0 h-5">{unreadCount}</Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Tooltip>
                <TooltipTrigger
                  onClick={markAllRead}
                  className="inline-flex items-center justify-center rounded-md h-7 w-7 text-[#666] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  <CheckCheck size={15} />
                </TooltipTrigger>
                <TooltipContent className="bg-[#1a1a1a] text-white border-[#333] text-xs">Mark all as read</TooltipContent>
              </Tooltip>
            )}
          </div>
          <Separator className="bg-[#1a1a1a] mt-4" />
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#444]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#141414] flex items-center justify-center mb-4">
                <Bell size={24} className="text-[#333]" />
              </div>
              <p className="text-[#555] font-medium">No notifications</p>
              <p className="text-[#444] text-xs mt-1">Invitations and updates will appear here</p>
            </div>
          ) : (
            <div className="py-2">
              <AnimatePresence initial={false}>
                {notifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`px-4 py-3.5 border-b border-[#111] relative transition-colors ${!notif.is_read ? "bg-orange-500/4" : ""}`}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="absolute left-4 top-4 w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}

                    <div className="flex gap-3 pl-4">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${notif.type === "invitation" ? "bg-indigo-500/10" : "bg-[#141414]"}`}>
                        {notif.type === "invitation"
                          ? <UserPlus size={16} className="text-indigo-400" />
                          : <FolderKanban size={16} className="text-[#555]" />
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white leading-snug">{notif.title}</p>
                        <p className="text-xs text-[#888] mt-0.5 leading-relaxed">{notif.message}</p>

                        {/* Invitation role pill */}
                        {notif.type === "invitation" && notif.metadata?.role && !notif.is_read && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                              Role: {notif.metadata.role}
                            </span>
                            {notif.metadata.project_name && (
                              <span className="text-xs px-2 py-0.5 rounded-md bg-[#141414] text-[#888] border border-[#222]">
                                {notif.metadata.project_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Invitation action buttons */}
                        {notif.type === "invitation" && !notif.is_read && (
                          <div className="flex gap-2 mt-2.5">
                            <Button size="sm" onClick={() => respondToInvitation(notif, "accept")}
                              disabled={respondingId === notif.id}
                              className="h-7 px-3 text-xs bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 hover:text-green-300">
                              {respondingId === notif.id ? <Loader2 size={11} className="animate-spin" /> : <><Check size={11} className="mr-1" />Accept</>}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => respondToInvitation(notif, "decline")}
                              disabled={respondingId === notif.id}
                              className="h-7 px-3 text-xs text-[#666] hover:text-white hover:bg-[#1a1a1a]">
                              <X size={11} className="mr-1" />Decline
                            </Button>
                          </div>
                        )}

                        <p className="text-[10px] text-[#555] mt-2">{timeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
