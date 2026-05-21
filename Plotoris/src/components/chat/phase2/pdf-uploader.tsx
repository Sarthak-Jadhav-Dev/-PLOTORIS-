"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PdfUploader({ projectId, onUploadComplete }: { projectId: string, onUploadComplete: (paper?: any) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState("uploading");
    setStatusMessage("Parsing PDF and generating embeddings...");

    // Simulate API call to our new LangChain endpoint
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("project_id", projectId);
      
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
      const headers: any = {};
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase2/upload-paper", {
        method: "POST",
        headers,
        body: formData,
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      
      setUploadState("success");
      setStatusMessage("Paper successfully processed and embedded.");
      setTimeout(() => onUploadComplete(data.paper), 2000);
    } catch (err) {
      setUploadState("error");
      setStatusMessage("Failed to process the PDF. Check your OpenAI API key.");
    }
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl shadow-xl max-w-2xl mx-auto mt-10">
      <h2 className="text-xl font-bold text-white mb-2 text-center">Upload Research Paper</h2>
      <p className="text-sm text-[#888] text-center mb-8">
        Upload a PDF to automatically extract metadata, summarize findings, and embed it into the semantic search database.
      </p>

      {uploadState === "idle" && (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#444] hover:border-blue-500 bg-[#0d0d0d] rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors"
        >
          <UploadCloud size={48} className="text-[#666] mb-4" />
          <p className="text-white font-medium mb-1">Drag and drop your PDF here</p>
          <p className="text-xs text-[#888] mb-4">or click to browse files</p>
          <input 
            type="file" 
            accept=".pdf" 
            className="hidden" 
            id="pdf-upload"
            onChange={(e) => {
              if (e.target.files?.[0]) setFile(e.target.files[0]);
            }}
          />
          <Button variant="outline" className="bg-[#222] border-[#444] hover:bg-[#333] text-white" onClick={() => document.getElementById('pdf-upload')?.click()}>
            Browse Files
          </Button>
        </div>
      )}

      {file && uploadState === "idle" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex items-center justify-between bg-[#222] p-4 rounded-lg border border-[#333]">
          <div className="flex items-center gap-3">
            <div className="bg-rose-500/10 p-2 rounded text-rose-500">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-white font-medium">{file.name}</p>
              <p className="text-xs text-[#888]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700 text-white">
            Upload & Analyze
          </Button>
        </motion.div>
      )}

      {uploadState === "uploading" && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 size={40} className="animate-spin text-blue-500 mb-4" />
          <p className="text-white font-medium animate-pulse">{statusMessage}</p>
        </div>
      )}

      {uploadState === "success" && (
        <div className="flex flex-col items-center justify-center py-10">
          <CheckCircle2 size={40} className="text-green-500 mb-4" />
          <p className="text-white font-medium">{statusMessage}</p>
          <p className="text-xs text-[#888] mt-2">Returning to dashboard...</p>
        </div>
      )}

      {uploadState === "error" && (
        <div className="flex flex-col items-center justify-center py-10">
          <AlertCircle size={40} className="text-red-500 mb-4" />
          <p className="text-white font-medium">{statusMessage}</p>
          <Button variant="outline" onClick={() => setUploadState("idle")} className="mt-4 border-[#444] text-white">
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
