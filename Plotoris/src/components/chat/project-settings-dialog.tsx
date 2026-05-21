"use client";

import { useState, useEffect } from "react";
import { Settings, Key, Trash2, ShieldAlert, Loader2, CheckCircle2, Users, UserPlus, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProjectSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: { id: string; name: string; description: string; dueDate: string } | null;
}

interface TeamMember {
  id: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  allowed_phases: string[];
}

export default function ProjectSettingsDialog({ open, onOpenChange, project }: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<"general" | "team" | "api" | "danger">("general");
  
  // General State
  const [name, setName] = useState(project?.name || "");
  const [desc, setDesc] = useState(project?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // API State
  const [apiKey, setApiKey] = useState("");

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: "1", email: "admin@plotoris.com", role: "ADMIN", allowed_phases: [] },
    { id: "2", email: "researcher@plotoris.com", role: "MEMBER", allowed_phases: ["p1", "p2", "p3"] }
  ]);
  const [newEmail, setNewEmail] = useState("");
  const allPhases = [
    { id: "p1", name: "Phase 1: Project Scope" },
    { id: "p2", name: "Phase 2: Literature Corpus" },
    { id: "p3", name: "Phase 3: Hypothesis" },
    { id: "p4", name: "Phase 4: Design" },
    { id: "p5", name: "Phase 5: Data Collection" },
    { id: "p6", name: "Phase 6: Quality Control" },
    { id: "p7", name: "Phase 7: AI Analysis" },
    { id: "p8", name: "Phase 8: Interpretation" },
    { id: "p9", name: "Phase 9: Drafting" },
    { id: "p10", name: "Phase 10: Publication" }
  ];

  useEffect(() => {
    if (project?.id) {
      const storedKey = localStorage.getItem(`plotoris_gemini_key_${project.id}`);
      if (storedKey) setApiKey(storedKey);
      
      const storedTeam = localStorage.getItem(`plotoris_team_${project.id}`);
      if (storedTeam) setTeamMembers(JSON.parse(storedTeam));
    }
  }, [project?.id]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    if (project?.id) {
      localStorage.setItem(`plotoris_gemini_key_${project.id}`, apiKey);
      localStorage.setItem(`plotoris_team_${project.id}`, JSON.stringify(teamMembers));
    }

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addMember = () => {
    if (!newEmail) return;
    setTeamMembers([...teamMembers, { id: Date.now().toString(), email: newEmail, role: "MEMBER", allowed_phases: ["p1"] }]);
    setNewEmail("");
  };

  const updateMemberRole = (id: string, role: "ADMIN" | "MEMBER") => {
    setTeamMembers(teamMembers.map(m => m.id === id ? { ...m, role, allowed_phases: role === "ADMIN" ? [] : m.allowed_phases } : m));
  };

  const togglePhaseAccess = (memberId: string, phaseId: string) => {
    setTeamMembers(teamMembers.map(m => {
      if (m.id === memberId) {
        const phases = m.allowed_phases.includes(phaseId)
          ? m.allowed_phases.filter(p => p !== phaseId)
          : [...m.allowed_phases, phaseId];
        return { ...m, allowed_phases: phases };
      }
      return m;
    }));
  };

  const removeMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#333] text-white sm:max-w-[800px] p-0 overflow-hidden flex flex-col md:flex-row h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-[250px] bg-[#0d0d0d] border-r border-[#333] p-4 flex flex-col gap-2 shrink-0">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg">Project Settings</DialogTitle>
          </DialogHeader>
          
          <button onClick={() => setActiveTab("general")} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === "general" ? "bg-[#222] text-white" : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#d4d4d4]"}`}>
            <Settings size={16} /> General
          </button>
          <button onClick={() => setActiveTab("team")} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === "team" ? "bg-[#222] text-white" : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#d4d4d4]"}`}>
            <Users size={16} /> Team & Access
          </button>
          <button onClick={() => setActiveTab("api")} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === "api" ? "bg-[#222] text-white" : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#d4d4d4]"}`}>
            <Key size={16} /> API Keys
          </button>
          <div className="flex-1" />
          <button onClick={() => setActiveTab("danger")} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === "danger" ? "bg-red-500/10 text-red-500" : "text-[#888] hover:bg-red-500/5 hover:text-red-400"}`}>
            <ShieldAlert size={16} /> Danger Zone
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">General Details</h3>
                  <p className="text-xs text-[#888] mb-6">Update your project's basic information.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Project Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Description</label>
                      <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors resize-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Role-Based Access Control</h3>
                  <p className="text-xs text-[#888] mb-6">Manage team members and their phase-level permissions.</p>
                  
                  <div className="flex items-center gap-2 mb-6">
                    <input 
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="flex-1 bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                    />
                    <Button onClick={addMember} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      <UserPlus size={16} className="mr-2" /> Invite
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {teamMembers.map(member => (
                      <div key={member.id} className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                              {member.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select 
                              value={member.role}
                              onChange={(e) => updateMemberRole(member.id, e.target.value as "ADMIN" | "MEMBER")}
                              className="bg-[#050505] border border-[#333] text-white text-xs rounded px-2 py-1 focus:outline-none"
                            >
                              <option value="ADMIN">Admin</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <button onClick={() => removeMember(member.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10"><Trash2 size={14} /></button>
                          </div>
                        </div>

                        {member.role === "MEMBER" && (
                          <div className="mt-4 pt-4 border-t border-[#333]">
                            <h4 className="text-xs font-semibold text-[#888] mb-3 flex items-center gap-1"><Lock size={12}/> Phase Access Permissions</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {allPhases.map(phase => (
                                <label key={phase.id} className="flex items-center gap-2 text-xs cursor-pointer hover:text-white text-[#aaa]">
                                  <input 
                                    type="checkbox"
                                    checked={member.allowed_phases.includes(phase.id)}
                                    onChange={() => togglePhaseAccess(member.id, phase.id)}
                                    className="rounded border-[#555] bg-[#111] checked:bg-indigo-500"
                                  />
                                  {phase.name}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Bring Your Own Key</h3>
                  <p className="text-xs text-[#888] mb-6">Provide your own API key to bypass platform rate limits.</p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Gemini API Key</label>
                      <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="AIza..." className="w-full bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors" />
                      <p className="text-[10px] text-[#555]">Keys are stored securely in your browser's local storage.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "danger" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-red-500 mb-1">Danger Zone</h3>
                  <p className="text-xs text-[#888] mb-6">Irreversible actions for this project.</p>
                  
                  <div className="border border-red-500/30 rounded-xl p-4 bg-red-500/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">Archive Project</h4>
                        <p className="text-xs text-[#888]">Mark as read-only and hide from main dashboard.</p>
                      </div>
                      <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">Archive</Button>
                    </div>
                    <div className="border-t border-red-500/20 pt-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">Delete Project</h4>
                        <p className="text-xs text-[#888]">Permanently delete all files, agents, and data.</p>
                      </div>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white">
                        <Trash2 size={16} className="mr-2" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-[#333] flex justify-end shrink-0 bg-[#111]">
            <Button onClick={handleSave} disabled={isSaving || saved} className="bg-white text-black hover:bg-gray-200">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle2 size={16} className="mr-2" /> Saved</> : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
