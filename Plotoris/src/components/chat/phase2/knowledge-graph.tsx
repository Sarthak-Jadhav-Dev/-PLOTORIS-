"use client";

import { useState, useEffect, useCallback } from "react";
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import { Loader2, RefreshCw, Network } from "lucide-react";
import { Button } from "@/components/ui/button";

// Custom Node to give a sleek aesthetic
function CustomNode({ data }: { data: any }) {
  let bgColor = "bg-[#1a1a1a]";
  let borderColor = "border-[#333]";
  let textColor = "text-white";

  switch (data.type) {
    case "concept":
      bgColor = "bg-indigo-500/10";
      borderColor = "border-indigo-500/50";
      textColor = "text-indigo-400";
      break;
    case "method":
      bgColor = "bg-emerald-500/10";
      borderColor = "border-emerald-500/50";
      textColor = "text-emerald-400";
      break;
    case "author":
      bgColor = "bg-rose-500/10";
      borderColor = "border-rose-500/50";
      textColor = "text-rose-400";
      break;
    case "metric":
      bgColor = "bg-amber-500/10";
      borderColor = "border-amber-500/50";
      textColor = "text-amber-400";
      break;
  }

  return (
    <div className={`px-4 py-2 shadow-xl rounded-lg border ${bgColor} ${borderColor} min-w-[120px] text-center`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-[#888]" />
      <div className={`text-xs font-bold ${textColor} uppercase tracking-wider mb-1 opacity-70`}>
        {data.type || "Entity"}
      </div>
      <div className="font-semibold text-white text-sm">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-[#888]" />
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
};

export default function KnowledgeGraph({ projectId }: { projectId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeTextProvider = localStorage.getItem(`plotoris_active_text_provider_${projectId}`) || "gemini";
      const activeEmbeddingProvider = localStorage.getItem(`plotoris_active_embedding_provider_${projectId}`) || "gemini";
      const textKey = localStorage.getItem(`plotoris_${activeTextProvider}_key_${projectId}`) || "";
      const embeddingKey = localStorage.getItem(`plotoris_${activeEmbeddingProvider}_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (textKey) {
        headers["x-api-key"] = textKey;
        headers["x-api-provider"] = activeTextProvider;
      }
      if (embeddingKey) {
        headers["x-embedding-key"] = embeddingKey;
        headers["x-embedding-provider"] = activeEmbeddingProvider;
      }

      const res = await fetch("/api/phase2/knowledge-graph", {
        method: "POST",
        headers,
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Add edge markers
      const formattedEdges = (data.edges || []).map((e: any) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#4f46e5' },
        labelStyle: { fill: '#fff', fontWeight: 600, fontSize: 10 },
        labelBgStyle: { fill: '#1a1a1a', fillOpacity: 0.8 },
      }));

      setNodes(data.nodes || []);
      setEdges(formattedEdges);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, setNodes, setEdges]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden h-[700px] flex flex-col relative">
      <div className="p-4 border-b border-[#333] bg-[#111] flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Network size={20} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Knowledge Graph</h2>
            <p className="text-sm text-[#888]">Visualizing entities and relationships from your corpus.</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchGraph}
          disabled={isLoading}
          className="border-[#333] bg-[#1a1a1a] hover:bg-[#222] text-white"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
          Refresh
        </Button>
      </div>

      <div className="flex-1 w-full bg-[#0d0d0d] relative">
        {isLoading && nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-[#888]">
            <Loader2 size={32} className="animate-spin mb-4 text-emerald-500" />
            <p>Analyzing corpus & generating graph...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center z-10 text-rose-500">
            <p>Error: {error}</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls className="!bg-[#1a1a1a] !border-[#333] !fill-white" />
            <Background color="#333" gap={16} size={1} />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
