"use client";

import { useState } from "react";
import { UserPlus, Loader2, CheckCircle2, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { authHeaders } from "@/lib/auth";
import { Project } from "@/lib/data/projects-data";

interface InviteTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export default function InviteTeamDialog({ open, onOpenChange, project }: InviteTeamDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Contributor");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInvite = async () => {
    if (!email || !project) return;
    setIsSending(true);
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          email,
          type: "invitation",
          title: "Project Invitation",
          message: `You have been invited to join the project "${project.name}" as a ${role}.`,
          metadata: { projectId: project.id, role }
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send invite");
      }

      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmail("");
        onOpenChange(false);
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#333] text-white sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserPlus size={20} className="text-blue-400" />
            </div>
            <div>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription className="text-[#888]">
                Send an invitation link to collaborate on this project.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={16} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@university.edu"
                className="w-full bg-[#050505] border border-[#333] text-white rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Project Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Lead Researcher">Lead Researcher (Admin)</option>
              <option value="Contributor">Contributor (Edit)</option>
              <option value="Reviewer">Reviewer (Comment only)</option>
            </select>
          </div>
          {errorMsg && (
            <p className="text-red-400 text-xs mt-2">{errorMsg}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" className="text-[#888] hover:text-white" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            disabled={!email || isSending || sent}
            onClick={handleInvite} 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : 
             sent ? <><CheckCircle2 size={16} className="mr-2" /> Sent!</> : 
             "Send Invite"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
