"use client";

import { useState } from "react";
import { Settings, Key, Trash2, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
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
  project: { name: string; description: string; dueDate: string } | null;
}

export default function ProjectSettingsDialog({ open, onOpenChange, project }: ProjectSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<"general" | "api" | "danger">("general");
  
  // General State
  const [name, setName] = useState(project?.name || "");
  const [desc, setDesc] = useState(project?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // API State
  const [apiKey, setApiKey] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#333] text-white sm:max-w-[700px] p-0 overflow-hidden flex flex-col md:flex-row h-[500px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/3 bg-[#0d0d0d] border-r border-[#333] p-4 flex flex-col gap-2">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg">Project Settings</DialogTitle>
          </DialogHeader>
          
          <button 
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === "general" ? "bg-[#222] text-white" : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#d4d4d4]"}`}
          >
            <Settings size={16} /> General
          </button>
          <button 
            onClick={() => setActiveTab("api")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === "api" ? "bg-[#222] text-white" : "text-[#888] hover:bg-[#1a1a1a] hover:text-[#d4d4d4]"}`}
          >
            <Key size={16} /> API Keys
          </button>
          <div className="flex-1" />
          <button 
            onClick={() => setActiveTab("danger")}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === "danger" ? "bg-red-500/10 text-red-500" : "text-[#888] hover:bg-red-500/5 hover:text-red-400"}`}
          >
            <ShieldAlert size={16} /> Danger Zone
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">General Details</h3>
                <p className="text-xs text-[#888] mb-6">Update your project's basic information.</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Project Name</label>
                    <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#888] uppercase tracking-wider">Description</label>
                    <textarea 
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333] flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || saved} className="bg-white text-black hover:bg-gray-200">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle2 size={16} className="mr-2" /> Saved</> : "Save Changes"}
                </Button>
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
                    <label className="text-xs font-bold text-[#888] uppercase tracking-wider">OpenAI API Key</label>
                    <input 
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-[#050505] border border-[#333] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <p className="text-[10px] text-[#555]">Keys are encrypted at rest and never stored in plain text.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#333] flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || saved} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle2 size={16} className="mr-2" /> Saved</> : "Save API Key"}
                </Button>
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
      </DialogContent>
    </Dialog>
  );
}
