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
  const [geminiKey, setGeminiKey] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [cohereKey, setCohereKey] = useState("");
  const [activeTextProvider, setActiveTextProvider] = useState<"gemini" | "groq" | "openai">("gemini");
  const [activeEmbeddingProvider, setActiveEmbeddingProvider] = useState<"gemini" | "openai" | "cohere">("gemini");

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.email) setUserEmail(payload.email);
        } catch {}
    }
  }, []);
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
      const storedGemini = localStorage.getItem(`plotoris_gemini_key_${project.id}`);
      if (storedGemini) setGeminiKey(storedGemini);
      
      const storedGroq = localStorage.getItem(`plotoris_groq_key_${project.id}`);
      if (storedGroq) setGroqKey(storedGroq);
      
      const storedOpenAi = localStorage.getItem(`plotoris_openai_key_${project.id}`);
      if (storedOpenAi) setOpenAiKey(storedOpenAi);
      
      const storedCohere = localStorage.getItem(`plotoris_cohere_key_${project.id}`);
      if (storedCohere) setCohereKey(storedCohere);
      
      const storedTextProvider = localStorage.getItem(`plotoris_active_text_provider_${project.id}`);
      if (storedTextProvider === "gemini" || storedTextProvider === "groq" || storedTextProvider === "openai") {
        setActiveTextProvider(storedTextProvider);
      }

      const storedEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${project.id}`);
      if (storedEmbeddingProvider === "gemini" || storedEmbeddingProvider === "openai" || storedEmbeddingProvider === "cohere") {
        setActiveEmbeddingProvider(storedEmbeddingProvider);
      }
      
      const storedTeam = localStorage.getItem(`plotoris_team_${project.id}`);
      if (storedTeam) {
          setTeamMembers(JSON.parse(storedTeam));
      } else if (userEmail) {
          setTeamMembers([{ id: Date.now().toString(), email: userEmail, role: "ADMIN", allowed_phases: [] }]);
      }
    }
  }, [project?.id, userEmail]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    
    if (project?.id) {
      localStorage.setItem(`plotoris_gemini_key_${project.id}`, geminiKey);
      localStorage.setItem(`plotoris_groq_key_${project.id}`, groqKey);
      localStorage.setItem(`plotoris_openai_key_${project.id}`, openAiKey);
      localStorage.setItem(`plotoris_cohere_key_${project.id}`, cohereKey);
      localStorage.setItem(`plotoris_active_text_provider_${project.id}`, activeTextProvider);
      localStorage.setItem(`plotoris_active_embedding_provider_${project.id}`, activeEmbeddingProvider);
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
                  <p className="text-xs text-[#888] mb-6">Select your preferred AI provider and provide the corresponding API key. The selected provider will be used across all phases.</p>
                  
                  <div className="space-y-6">
                    <div className="space-y-4 pb-6 border-b border-[#333]">
                      <h4 className="text-sm font-bold text-white">1. Text Generation AI</h4>
                      <p className="text-xs text-[#888]">Used for chatting, analysis, and generating content.</p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Active Provider</label>
                        <div className="flex gap-4">
                          <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${activeTextProvider === "gemini" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-[#333] bg-[#050505] text-[#888] hover:border-[#555]"}`}>
                            <input type="radio" name="textProvider" value="gemini" checked={activeTextProvider === "gemini"} onChange={() => setActiveTextProvider("gemini")} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeTextProvider === "gemini" ? "border-emerald-500" : "border-[#555]"}`}>
                              {activeTextProvider === "gemini" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                            </div>
                            <span className="text-sm font-medium">Gemini</span>
                          </label>
                          <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${activeTextProvider === "groq" ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-[#333] bg-[#050505] text-[#888] hover:border-[#555]"}`}>
                            <input type="radio" name="textProvider" value="groq" checked={activeTextProvider === "groq"} onChange={() => setActiveTextProvider("groq")} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeTextProvider === "groq" ? "border-orange-500" : "border-[#555]"}`}>
                              {activeTextProvider === "groq" && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                            </div>
                            <span className="text-sm font-medium">Groq</span>
                          </label>
                          <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${activeTextProvider === "openai" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-[#333] bg-[#050505] text-[#888] hover:border-[#555]"}`}>
                            <input type="radio" name="textProvider" value="openai" checked={activeTextProvider === "openai"} onChange={() => setActiveTextProvider("openai")} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeTextProvider === "openai" ? "border-blue-500" : "border-[#555]"}`}>
                              {activeTextProvider === "openai" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            </div>
                            <span className="text-sm font-medium">OpenAI</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pb-6 border-b border-[#333]">
                      <h4 className="text-sm font-bold text-white">2. Embeddings AI</h4>
                      <p className="text-xs text-[#888]">Used for vector search and storing semantic knowledge.</p>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Active Provider</label>
                        <div className="flex gap-4">
                          <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${activeEmbeddingProvider === "gemini" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-[#333] bg-[#050505] text-[#888] hover:border-[#555]"}`}>
                            <input type="radio" name="embeddingProvider" value="gemini" checked={activeEmbeddingProvider === "gemini"} onChange={() => setActiveEmbeddingProvider("gemini")} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeEmbeddingProvider === "gemini" ? "border-emerald-500" : "border-[#555]"}`}>
                              {activeEmbeddingProvider === "gemini" && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                            </div>
                            <span className="text-sm font-medium">Gemini</span>
                          </label>
                          <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${activeEmbeddingProvider === "cohere" ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-[#333] bg-[#050505] text-[#888] hover:border-[#555]"}`}>
                            <input type="radio" name="embeddingProvider" value="cohere" checked={activeEmbeddingProvider === "cohere"} onChange={() => setActiveEmbeddingProvider("cohere")} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeEmbeddingProvider === "cohere" ? "border-purple-500" : "border-[#555]"}`}>
                              {activeEmbeddingProvider === "cohere" && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                            </div>
                            <span className="text-sm font-medium">Cohere</span>
                          </label>
                          <label className={`flex-1 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${activeEmbeddingProvider === "openai" ? "border-blue-500 bg-blue-500/10 text-blue-400" : "border-[#333] bg-[#050505] text-[#888] hover:border-[#555]"}`}>
                            <input type="radio" name="embeddingProvider" value="openai" checked={activeEmbeddingProvider === "openai"} onChange={() => setActiveEmbeddingProvider("openai")} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${activeEmbeddingProvider === "openai" ? "border-blue-500" : "border-[#555]"}`}>
                              {activeEmbeddingProvider === "openai" && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            </div>
                            <span className="text-sm font-medium">OpenAI</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-white">API Keys</h4>
                      <div className={`space-y-2 p-4 rounded-xl border ${activeTextProvider === "gemini" || activeEmbeddingProvider === "gemini" ? "border-emerald-500/30 bg-emerald-500/5" : "border-[#222] bg-[#0a0a0a]"}`}>
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-bold uppercase tracking-wider ${activeTextProvider === "gemini" || activeEmbeddingProvider === "gemini" ? "text-emerald-400" : "text-[#888]"}`}>Google Gemini API Key</label>
                        </div>
                        <div className="flex gap-2">
                          <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} placeholder="AIza..." className="flex-1 bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono" />
                          <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(geminiKey)} className="border-[#333] hover:bg-[#222] text-[#888]" title="Copy Key">
                            <Key size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className={`space-y-2 p-4 rounded-xl border ${activeTextProvider === "groq" ? "border-orange-500/30 bg-orange-500/5" : "border-[#222] bg-[#0a0a0a]"}`}>
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-bold uppercase tracking-wider ${activeTextProvider === "groq" ? "text-orange-400" : "text-[#888]"}`}>Groq API Key</label>
                        </div>
                        <div className="flex gap-2">
                          <input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} placeholder="gsk_..." className="flex-1 bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono" />
                          <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(groqKey)} className="border-[#333] hover:bg-[#222] text-[#888]" title="Copy Key">
                            <Key size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className={`space-y-2 p-4 rounded-xl border ${activeTextProvider === "openai" || activeEmbeddingProvider === "openai" ? "border-blue-500/30 bg-blue-500/5" : "border-[#222] bg-[#0a0a0a]"}`}>
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-bold uppercase tracking-wider ${activeTextProvider === "openai" || activeEmbeddingProvider === "openai" ? "text-blue-400" : "text-[#888]"}`}>OpenAI API Key</label>
                        </div>
                        <div className="flex gap-2">
                          <input type="password" value={openAiKey} onChange={(e) => setOpenAiKey(e.target.value)} placeholder="sk-..." className="flex-1 bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors font-mono" />
                          <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(openAiKey)} className="border-[#333] hover:bg-[#222] text-[#888]" title="Copy Key">
                            <Key size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className={`space-y-2 p-4 rounded-xl border ${activeEmbeddingProvider === "cohere" ? "border-purple-500/30 bg-purple-500/5" : "border-[#222] bg-[#0a0a0a]"}`}>
                        <div className="flex items-center justify-between">
                          <label className={`text-xs font-bold uppercase tracking-wider ${activeEmbeddingProvider === "cohere" ? "text-purple-400" : "text-[#888]"}`}>Cohere API Key</label>
                        </div>
                        <div className="flex gap-2">
                          <input type="password" value={cohereKey} onChange={(e) => setCohereKey(e.target.value)} placeholder="..." className="flex-1 bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors font-mono" />
                          <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(cohereKey)} className="border-[#333] hover:bg-[#222] text-[#888]" title="Copy Key">
                            <Key size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-[#555] text-center">Keys are stored securely in your browser's local storage.</p>
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
