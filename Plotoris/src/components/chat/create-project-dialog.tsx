"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Loader2, UserPlus, Trash2, FolderKanban } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { authHeaders } from "@/lib/auth";

const PROJECT_COLORS = [
  "#FF6B00", "#6366F1", "#10B981", "#F59E0B",
  "#EC4899", "#3B82F6", "#8B5CF6", "#EF4444",
];

const ROLES = ["Researcher", "Analyst", "Reviewer", "Contributor", "Viewer"];
const CATEGORIES = ["General", "Science", "Engineering", "Medicine", "Social Sciences", "Humanities", "Technology"];

interface SearchedUser {
  id: string;
  user_name: string;
  email: string;
}

interface InviteMember {
  user: SearchedUser;
  role: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function CreateProjectDialog({ open, onOpenChange, onCreated }: CreateProjectDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [color, setColor] = useState("#FF6B00");
  const [members, setMembers] = useState<InviteMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const resetForm = () => {
    setStep(1);
    setName("");
    setDescription("");
    setCategory("General");
    setColor("#FF6B00");
    setMembers([]);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
  };

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim() || q.trim().length < 2) { setSearchResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const alreadyAdded = members.map(m => m.user.id);
        setSearchResults((data.data ?? []).filter((u: SearchedUser) => !alreadyAdded.includes(u.id)));
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 350);
  }, [members]);

  const addMember = (user: SearchedUser) => {
    setMembers(prev => [...prev, { user, role: "Contributor" }]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeMember = (userId: string) => {
    setMembers(prev => prev.filter(m => m.user.id !== userId));
  };

  const updateRole = (userId: string, role: string) => {
    setMembers(prev => prev.map(m => m.user.id === userId ? { ...m, role } : m));
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError("Project name is required"); return; }
    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name, description, category, color }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to create project");

      const projectId = data.data.id;

      // Send invitations for each member
      const invitePromises = members.map(m =>
        fetch("/api/projects/invite", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ project_id: projectId, invitee_email: m.user.email, role: m.role }),
        })
      );
      await Promise.allSettled(invitePromises);

      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCreating(false);
    }
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-[#0d0d0d] border-[#222] text-white max-w-lg sm:max-w-xl p-0 overflow-hidden">
        {/* Top gradient bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                <FolderKanban size={18} style={{ color }} />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold">
                  {step === 1 ? "Create New Project" : "Invite Team Members"}
                </DialogTitle>
                <DialogDescription className="text-[#666] text-xs mt-0.5">
                  {step === 1 ? "Set up your research project details" : "Add collaborators and assign roles"}
                </DialogDescription>
              </div>
            </div>
            {/* Step indicator */}
            <div className="flex gap-2 mt-4">
              {[1, 2].map(s => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "opacity-100" : "opacity-20"}`}
                  style={{ background: s <= step ? color : "#333" }} />
              ))}
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {/* Project Name */}
                <div className="space-y-1.5">
                  <Label className="text-[#999] text-xs font-medium">Project Name *</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Quantum Computing Survey"
                    className="bg-[#141414] border-[#222] text-white placeholder:text-[#555] focus:border-orange-500/50 h-10"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-[#999] text-xs font-medium">Description</Label>
                  <Textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Brief description of your research project..."
                    className="bg-[#141414] border-[#222] text-white placeholder:text-[#555] focus:border-orange-500/50 resize-none"
                    rows={3}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <Label className="text-[#999] text-xs font-medium">Category</Label>
                  <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                    <SelectTrigger className="bg-[#141414] border-[#222] text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#141414] border-[#222] text-white">
                      {CATEGORIES.map(c => <SelectItem key={c} value={c} className="focus:bg-[#1a1a1a]">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color */}
                <div className="space-y-1.5">
                  <Label className="text-[#999] text-xs font-medium">Project Color</Label>
                  <div className="flex gap-2">
                    {PROJECT_COLORS.map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        className="w-7 h-7 rounded-lg transition-all duration-200 ring-offset-[#0d0d0d]"
                        style={{
                          background: c,
                          outline: color === c ? `2px solid ${c}` : "none",
                          outlineOffset: "2px",
                          transform: color === c ? "scale(1.15)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                {/* Search Users */}
                <div className="space-y-1.5">
                  <Label className="text-[#999] text-xs font-medium">Search Users by Name or Email</Label>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
                    <Input
                      value={searchQuery}
                      onChange={e => handleSearch(e.target.value)}
                      placeholder="Type name or email to search..."
                      className="bg-[#141414] border-[#222] text-white placeholder:text-[#555] pl-9 h-10 focus:border-orange-500/50"
                    />
                    {isSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] animate-spin" />}
                  </div>

                  {/* Search Results Dropdown */}
                  <AnimatePresence>
                    {searchResults.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="bg-[#141414] border border-[#222] rounded-xl overflow-hidden shadow-2xl">
                        {searchResults.map(u => (
                          <button key={u.id} onClick={() => addMember(u)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#1a1a1a] transition-colors text-left">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-orange-500/10 text-orange-400 text-xs font-bold">
                                {initials(u.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{u.user_name}</p>
                              <p className="text-xs text-[#666] truncate">{u.email}</p>
                            </div>
                            <Plus size={14} className="text-orange-400 shrink-0" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Added Members */}
                {members.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-[#999] text-xs font-medium">Team Members ({members.length})</Label>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {members.map(({ user: u, role }) => (
                        <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#141414] border border-[#222]">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="bg-orange-500/10 text-orange-400 text-xs font-bold">
                              {initials(u.user_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{u.user_name}</p>
                            <p className="text-xs text-[#666] truncate">{u.email}</p>
                          </div>
                          <Select value={role} onValueChange={(r) => r && updateRole(u.id, r)}>
                            <SelectTrigger className="h-7 w-32 bg-[#1a1a1a] border-[#333] text-xs text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141414] border-[#222] text-white text-xs">
                              {ROLES.map(r => <SelectItem key={r} value={r} className="focus:bg-[#1a1a1a] text-xs">{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <button onClick={() => removeMember(u.id)} className="p-1 rounded-lg hover:bg-red-500/10 transition-colors shrink-0">
                            <Trash2 size={13} className="text-[#666] hover:text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {members.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <UserPlus size={28} className="text-[#333] mb-2" />
                    <p className="text-[#555] text-sm">No members added yet</p>
                    <p className="text-[#444] text-xs mt-1">Search above to invite collaborators</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <Separator className="bg-[#1a1a1a]" />
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}
            className="text-[#666] hover:text-white hover:bg-[#1a1a1a]">
            Cancel
          </Button>
          <div className="flex gap-2">
            {step === 2 && (
              <Button variant="ghost" onClick={() => setStep(1)} className="text-[#999] hover:text-white hover:bg-[#1a1a1a]">
                Back
              </Button>
            )}
            {step === 1 ? (
              <Button onClick={() => { if (!name.trim()) { setError("Project name is required"); return; } setError(""); setStep(2); }}
                className="text-white font-semibold px-6" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
                Next: Add Members
              </Button>
            ) : (
              <Button onClick={handleCreate} disabled={isCreating}
                className="text-white font-semibold px-6" style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
                {isCreating ? <><Loader2 size={14} className="animate-spin mr-2" />Creating...</> : "Create Project"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
