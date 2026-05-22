"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface DatasetMetadata {
  filename: string;
  rowCount: number;
  columns: string[];
}

export default function DatasetUploader({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDataset, setActiveDataset] = useState<DatasetMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const res = await fetch(`/api/phase5/dataset?project_id=${projectId}`);
        const data = await res.json();
        if (data.metadata) {
          setActiveDataset({
            filename: data.metadata.filename,
            rowCount: data.metadata.rowCount,
            columns: data.metadata.columns
          });
        }
      } catch (err) {
        console.error("Failed to load dataset metadata", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) fetchDataset();
  }, [projectId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit.");
      return;
    }

    setError(null);
    setIsUploading(true);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results: any) => {
          if (results.errors.length && !results.data.length) {
            setError("Failed to parse CSV file.");
            setIsUploading(false);
            return;
          }
          await saveDataset(file.name, results.data);
        },
        error: (err: any) => {
          setError(`CSV Parse Error: ${err.message}`);
          setIsUploading(false);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
          await saveDataset(file.name, jsonData);
        } catch (err: any) {
          setError(`Excel Parse Error: ${err.message}`);
          setIsUploading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Unsupported file format. Please upload .csv or .xlsx");
      setIsUploading(false);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const saveDataset = async (filename: string, data: any[]) => {
    try {
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      const rowCount = data.length;

      const res = await fetch("/api/phase5/dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          filename,
          rowCount,
          columns,
          data
        })
      });

      if (!res.ok) {
        let errStr = "Failed to save dataset to database";
        try {
          const errData = await res.json();
          errStr = errData.error || errStr;
        } catch(e) {}
        throw new Error(errStr);
      }

      setActiveDataset({ filename, rowCount, columns });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-[#111] border border-[#222] rounded-xl">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden relative group transition-all">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Database className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                Active Dataset
                {activeDataset && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              </h3>
              <p className="text-sm text-[#888]">
                {activeDataset ? "Ready for analysis & validation" : "Upload data to begin"}
              </p>
            </div>
          </div>
          
          <div>
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-[#1a1a1a] border-[#333] hover:bg-[#222] text-white"
            >
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {activeDataset ? "Replace Dataset" : "Upload Dataset"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {activeDataset ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-[#161616] border border-[#2a2a2a] rounded-lg">
              <p className="text-xs text-[#666] mb-1">Filename</p>
              <p className="text-sm text-white font-medium truncate" title={activeDataset.filename}>
                {activeDataset.filename}
              </p>
            </div>
            <div className="p-3 bg-[#161616] border border-[#2a2a2a] rounded-lg">
              <p className="text-xs text-[#666] mb-1">Total Records</p>
              <p className="text-sm text-white font-medium">{activeDataset.rowCount.toLocaleString()} rows</p>
            </div>
            <div className="p-3 bg-[#161616] border border-[#2a2a2a] rounded-lg">
              <p className="text-xs text-[#666] mb-1">Variables</p>
              <p className="text-sm text-white font-medium">{activeDataset.columns.length} columns</p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#333] rounded-xl p-8 text-center bg-[#0a0a0a]">
            <FileSpreadsheet className="w-8 h-8 mx-auto text-[#555] mb-3" />
            <p className="text-sm text-[#aaa] mb-1">No dataset uploaded yet.</p>
            <p className="text-xs text-[#666]">Supported formats: .csv, .xlsx (Max 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
