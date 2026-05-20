"use client";

import { useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
} from "reactflow";
import "reactflow/dist/style.css";

const initialNodes = [
  {
    id: "1",
    type: "input",
    data: { label: "IV: Social Media Usage" },
    position: { x: 100, y: 200 },
    style: { background: "#1a1a1a", color: "#60a5fa", border: "1px solid #3b82f6", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "2",
    type: "output",
    data: { label: "DV: Academic Performance" },
    position: { x: 500, y: 200 },
    style: { background: "#1a1a1a", color: "#34d399", border: "1px solid #10b981", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "3",
    data: { label: "Control: Age / Demographics" },
    position: { x: 300, y: 100 },
    style: { background: "#1a1a1a", color: "#a1a1aa", border: "1px solid #52525b", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "4",
    data: { label: "Moderator: Self-Discipline" },
    position: { x: 300, y: 350 },
    style: { background: "#1a1a1a", color: "#fbbf24", border: "1px solid #f59e0b", borderRadius: "8px", padding: "10px" },
  }
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true, label: "Negative Impact", style: { stroke: "#ef4444" } },
  { id: "e3-2", source: "3", target: "2", type: "dashed", style: { stroke: "#52525b" } },
  { id: "e4-e12", source: "4", target: "2", label: "Moderates", type: "smoothstep", style: { stroke: "#f59e0b" } },
];

export default function VariableMapper() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

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
