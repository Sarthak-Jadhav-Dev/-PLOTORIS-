"use client";

import { useState } from "react";
import { ShieldCheck, CheckSquare, Square, Download, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EthicsChecklist({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);

  const generateChecklist = async () => {
    setIsGenerating(true);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase4/ethics-checklist", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await res.json();
      
      const newItems = [];
      let idCounter = 1;
      
      if (data.consent_requirements) {
        data.consent_requirements.forEach((req: string) => {
          newItems.push({ id: `e${idCounter++}`, category: "Informed Consent", task: req, done: false, required: true });
        });
      }
      if (data.data_privacy_measures) {
        data.data_privacy_measures.forEach((req: string) => {
          newItems.push({ id: `e${idCounter++}`, category: "Data Privacy", task: req, done: false, required: true });
        });
      }
      if (data.vulnerable_populations_flag) {
        newItems.push({ id: `e${idCounter++}`, category: "Vulnerable Populations", task: "Implement additional safeguards for vulnerable groups", done: false, required: true });
      }
      newItems.push({ id: `e${idCounter++}`, category: "Approvals", task: "Submit IRB application", done: false, required: true });

      setItems(newItems);
      setRiskLevel(data.risk_level);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const progress = items.length > 0 ? Math.round((items.filter(i => i.done).length / items.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Ethics & IRB Checklist 
                {riskLevel && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">Risk: {riskLevel}</span>}
              </h2>
              <p className="text-sm text-[#888]">Track ethical compliance before beginning data collection.</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             {items.length === 0 ? (
               <Button onClick={generateChecklist} disabled={isGenerating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                 {isGenerating ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Sparkles size={16} className="mr-2" />}
                 Generate Context-Aware Checklist
               </Button>
             ) : (
               <div className="text-right">
                 <div className="text-3xl font-black text-emerald-400">{progress}%</div>
                 <p className="text-xs font-bold uppercase tracking-wider text-[#888]">Compliant</p>
               </div>
             )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <div 
                key={item.id} 
                onClick={() => toggleItem(item.id)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-colors ${
                  item.done ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-[#0d0d0d] border-[#333] hover:border-[#555]'
                }`}
              >
                <div className="flex items-center gap-4">
                  {item.done ? (
                    <CheckSquare size={20} className="text-emerald-500" />
                  ) : (
                    <Square size={20} className="text-[#666]" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${item.done ? 'text-white line-through opacity-70' : 'text-white'}`}>
                      {item.task}
                    </p>
                    <p className="text-xs text-[#888]">{item.category}</p>
                  </div>
                </div>
                {item.required && !item.done && (
                  <BadgeAlert />
                )}
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-8 flex justify-between items-center pt-6 border-t border-[#333]">
             <p className="text-sm text-[#888] flex items-center gap-2">
               <AlertCircle size={16} /> All required items must be checked before proceeding.
             </p>
             <Button variant="outline" className="border-[#444] text-white bg-[#222]">
               <Download size={16} className="mr-2" /> Download IRB Packet
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function BadgeAlert() {
  return (
    <span className="bg-rose-500/10 text-rose-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Required</span>
  );
}
