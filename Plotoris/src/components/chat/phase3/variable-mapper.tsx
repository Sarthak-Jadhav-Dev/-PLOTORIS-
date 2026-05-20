"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node
} from "reactflow";
import "reactflow/dist/style.css";
import { Loader2, AlertTriangle, Network } from "lucide-react";

interface VariableMapperProps {
  projectId: string;
  hypothesis: any;
}

export default function VariableMapper({ projectId, hypothesis }: VariableMapperProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVariableMap = async () => {
    if (!hypothesis) return;
    setIsGenerating(true);
    setError(null);
    try {
      const geminiKey = localStorage.getItem(`plotoris_gemini_key_${projectId}`) || "";
      const headers: any = { "Content-Type": "application/json" };
      if (geminiKey) headers["x-gemini-key"] = geminiKey;

      const res = await fetch("/api/phase3/variable-map", {
        method: "POST",
        headers,
        body: JSON.stringify({ hypothesis: hypothesis, project_id: projectId })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate variable map");
      }

      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (hypothesis && nodes.length === 0 && !isGenerating) {
      fetchVariableMap();
    }
  }, [hypothesis]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  if (!hypothesis) {
    return (
      <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center p-8 text-center border border-[#333] rounded-2xl">
        <Network size={48} className="text-[#333] mb-4" />
        <h3 className="text-white font-medium mb-2">No Hypothesis Available</h3>
        <p className="text-[#888] text-sm max-w-md">Generate a hypothesis in the Builder tab first to visualize its variable relationships.</p>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center p-8 text-center border border-[#333] rounded-2xl">
        <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
        <p className="text-white font-medium animate-pulse">AI is generating your variable map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center p-8 text-center border border-[#333] rounded-2xl">
        <AlertTriangle size={32} className="text-rose-500 mb-4" />
        <p className="text-white font-medium mb-2">Error Generating Map</p>
        <p className="text-[#888] text-sm mb-4">{error}</p>
        <button onClick={fetchVariableMap} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-4 left-4 z-10 bg-[#000000]/80 backdrop-blur-md border border-[#333] p-4 rounded-xl shadow-2xl">
        <h3 className="text-white font-bold mb-1">Variable Conceptual Map</h3>
        <p className="text-xs text-[#888]">Drag to rearrange. Connect nodes to define relationships.</p>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        className="bg-[#050505]"
      >
        <Controls className="bg-[#111] border-[#333] fill-white" />
        <MiniMap nodeColor="#333" maskColor="rgba(0,0,0,0.8)" className="bg-[#111] border-[#333]" />
        <Background color="#222" gap={16} />
      </ReactFlow>
    </div>
  );
}
