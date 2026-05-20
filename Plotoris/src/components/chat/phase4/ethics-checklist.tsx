"use client";

import { useState } from "react";
import { ShieldCheck, CheckSquare, Square, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialChecklist = [
  { id: "e1", category: "Informed Consent", task: "Draft informed consent forms", done: false, required: true },
  { id: "e2", category: "Informed Consent", task: "Ensure 8th-grade reading level", done: false, required: true },
  { id: "e3", category: "Data Privacy", task: "Establish anonymization protocol", done: false, required: true },
  { id: "e4", category: "Data Privacy", task: "Ensure secure encrypted storage", done: false, required: true },
  { id: "e5", category: "Vulnerable Populations", task: "Additional safeguards for minors", done: false, required: false },
  { id: "e6", category: "Approvals", task: "Submit IRB application", done: false, required: true },
];

export default function EthicsChecklist() {
  const [items, setItems] = useState(initialChecklist);

  const toggleItem = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const progress = Math.round((items.filter(i => i.done).length / items.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ethics & IRB Checklist</h2>
              <p className="text-sm text-[#888]">Track ethical compliance before beginning data collection.</p>
            </div>
          </div>
          <div className="text-right">
             <div className="text-3xl font-black text-emerald-400">{progress}%</div>
             <p className="text-xs font-bold uppercase tracking-wider text-[#888]">Compliant</p>
          </div>
        </div>

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

        <div className="mt-8 flex justify-between items-center pt-6 border-t border-[#333]">
           <p className="text-sm text-[#888] flex items-center gap-2">
             <AlertCircle size={16} /> All required items must be checked before proceeding.
           </p>
           <Button variant="outline" className="border-[#444] text-white bg-[#222]">
             <Download size={16} className="mr-2" /> Download IRB Packet
           </Button>
        </div>
      </div>
    </div>
  );
}

function BadgeAlert() {
  return (
    <span className="bg-rose-500/10 text-rose-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Required</span>
  );
}
