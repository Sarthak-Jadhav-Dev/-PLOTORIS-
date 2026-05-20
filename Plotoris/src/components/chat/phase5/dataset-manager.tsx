"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSpreadsheet, Upload, UploadCloud, Table2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_DATA = {
  columns: ["participant_id", "age", "gender", "social_media_hours", "gpa", "stress_score"],
  rows: [
    ["P001", "21", "F", "4.5", "3.8", "62"],
    ["P002", "23", "M", "6.2", "3.1", "78"],
    ["P003", "20", "F", "2.1", "3.9", "45"],
    ["P004", "25", "M", "8.0", "2.8", "88"],
    ["P005", "22", "F", "3.3", "3.6", "55"],
    ["P006", "24", "M", "7.5", "2.9", "82"],
  ],
  types: ["string", "numeric", "categorical", "numeric", "numeric", "numeric"],
};

export default function DatasetManager() {
  const [uploaded, setUploaded] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) setUploaded(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {!uploaded ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-[#1a1a1a] border-2 border-dashed border-[#444] hover:border-blue-500 rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-colors"
        >
          <UploadCloud size={52} className="text-[#555] mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Import Dataset</h2>
          <p className="text-[#888] text-sm mb-6 text-center">Drag and drop a CSV, Excel, or JSON file here</p>
          <input type="file" accept=".csv,.xlsx,.json,.tsv" className="hidden" id="dataset-upload" onChange={() => setUploaded(true)} />
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => document.getElementById("dataset-upload")?.click()}>
            <Upload size={16} className="mr-2" /> Browse Files
          </Button>
        </div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Dataset Meta */}
            <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileSpreadsheet size={24} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">research_dataset.csv</h2>
                  <p className="text-xs text-[#888]">6 rows · 6 columns · 4.2 KB · Imported just now</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-[#444] text-white hover:bg-[#222] text-xs">
                  <Tag size={14} className="mr-2" /> Generate Dictionary
                </Button>
              </div>
            </div>

            {/* Column Type Row */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl p-4 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {MOCK_DATA.columns.map((col, i) => (
                  <div key={i} className="bg-[#0d0d0d] border border-[#333] rounded-lg px-3 py-2 min-w-[120px]">
                    <p className="text-xs font-bold text-white truncate">{col}</p>
                    <span className={`text-[9px] uppercase font-bold tracking-wider mt-1 inline-block px-1 rounded ${
                      MOCK_DATA.types[i] === "numeric" ? "bg-blue-500/10 text-blue-400" :
                      MOCK_DATA.types[i] === "categorical" ? "bg-fuchsia-500/10 text-fuchsia-400" :
                      "bg-slate-500/10 text-slate-400"
                    }`}>
                      {MOCK_DATA.types[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Grid */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-[#333]">
                <Table2 size={16} className="text-blue-400" />
                <h3 className="text-sm font-bold text-white">Preview (showing 6 of 6 rows)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#111] border-b border-[#333]">
                    <tr>
                      {MOCK_DATA.columns.map((col, i) => (
                        <th key={i} className="px-4 py-3 text-left text-xs font-bold text-[#888] uppercase tracking-wider whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_DATA.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-[#222] hover:bg-[#111] transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className={`px-4 py-3 whitespace-nowrap ${ci === 0 ? "text-[#888] font-mono text-xs" : "text-white"}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
