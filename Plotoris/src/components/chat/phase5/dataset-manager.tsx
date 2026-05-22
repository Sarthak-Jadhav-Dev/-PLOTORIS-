"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, ExternalLink, Loader2, Save,
  Database, BookOpen, Code2, FileText, Globe, GripVertical, X, Check, FolderKanban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

const RESOURCE_TYPES = [
  { id: "dataset", label: "Dataset", icon: Database, color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { id: "colab", label: "Colab", icon: Code2, color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: "jupyter", label: "Jupyter", icon: Code2, color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { id: "paper", label: "Paper", icon: BookOpen, color: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  { id: "api", label: "API", icon: Globe, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { id: "other", label: "Other", icon: FileText, color: "bg-[#333] text-[#888] border-[#444]" },
];

interface ResourceCard {
  id: string;
  title: string;
  url: string;
  type: string;
  description: string;
  createdAt: string;
}

interface KanbanColumn {
  id: string;
  name: string;
  cards: ResourceCard[];
}

const getTypeStyle = (typeId: string) => RESOURCE_TYPES.find(t => t.id === typeId) || RESOURCE_TYPES[RESOURCE_TYPES.length - 1];

export default function DatasetManager({ projectId }: { projectId: string }) {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // New column form
  const [showColumnForm, setShowColumnForm] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  // New card form state per column
  const [activeCardForm, setActiveCardForm] = useState<string | null>(null);
  const [newCard, setNewCard] = useState({ title: "", url: "", type: "dataset", description: "" });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "column" | "card"; colId: string; cardId?: string } | null>(null);

  // Load on mount
  useEffect(() => {
    const loadBoard = async () => {
      try {
        const res = await fetch(`/api/phase5/dataset-kanban?project_id=${projectId}`);
        const data = await res.json();
        if (data.columns) setColumns(data.columns);
      } catch (err) { console.error(err); }
      finally { setIsLoading(false); }
    };
    if (projectId) loadBoard();
  }, [projectId]);

  const saveBoard = useCallback(async (cols: KanbanColumn[]) => {
    setIsSaving(true);
    try {
      await fetch("/api/phase5/dataset-kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: projectId, columns: cols }),
      });
      setIsDirty(false);
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  }, [projectId]);

  const addColumn = () => {
    if (!newColumnName.trim()) return;
    const col: KanbanColumn = { id: `col_${Date.now()}`, name: newColumnName.trim(), cards: [] };
    const updated = [...columns, col];
    setColumns(updated);
    setNewColumnName("");
    setShowColumnForm(false);
    setIsDirty(true);
    saveBoard(updated);
  };

  const deleteColumn = (colId: string) => {
    const updated = columns.filter(c => c.id !== colId);
    setColumns(updated);
    setDeleteConfirm(null);
    saveBoard(updated);
  };

  const addCard = (colId: string) => {
    if (!newCard.title.trim()) return;
    const card: ResourceCard = {
      id: `card_${Date.now()}`,
      title: newCard.title.trim(),
      url: newCard.url.trim(),
      type: newCard.type,
      description: newCard.description.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = columns.map(c =>
      c.id === colId ? { ...c, cards: [...c.cards, card] } : c
    );
    setColumns(updated);
    setNewCard({ title: "", url: "", type: "dataset", description: "" });
    setActiveCardForm(null);
    saveBoard(updated);
  };

  const deleteCard = (colId: string, cardId: string) => {
    const updated = columns.map(c =>
      c.id === colId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c
    );
    setColumns(updated);
    setDeleteConfirm(null);
    saveBoard(updated);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[#444]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FolderKanban size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Research Resource Board</h2>
            <p className="text-sm text-[#888]">Organize datasets, notebooks, and resources in a Kanban board.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <Button
              onClick={() => saveBoard(columns)}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Board
            </Button>
          )}
          <Button
            onClick={() => setShowColumnForm(true)}
            className="bg-[#222] border border-[#444] hover:bg-[#333] text-white gap-2"
          >
            <Plus size={14} /> Add Column
          </Button>
        </div>
      </div>

      {/* Add Column Form */}
      <AnimatePresence>
        {showColumnForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 bg-[#111] border border-[#333] rounded-xl p-4">
              <input
                autoFocus
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addColumn(); if (e.key === "Escape") setShowColumnForm(false); }}
                placeholder="Column name (e.g., Datasets, Colab Notebooks, Papers...)"
                className="flex-1 bg-[#0d0d0d] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <Button onClick={addColumn} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                <Check size={14} /> Create
              </Button>
              <Button onClick={() => setShowColumnForm(false)} variant="ghost" className="text-[#666] hover:text-white">
                <X size={14} />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban Board */}
      {columns.length === 0 ? (
        <div className="border-2 border-dashed border-[#222] rounded-2xl p-16 text-center">
          <FolderKanban size={48} className="text-[#333] mx-auto mb-4" />
          <p className="text-white font-medium mb-2">No columns yet</p>
          <p className="text-[#666] text-sm mb-6">Create your first column to start organizing research resources.</p>
          <Button onClick={() => setShowColumnForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus size={14} /> Add Your First Column
          </Button>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start">
          {columns.map((col) => (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="shrink-0 w-72 bg-[#111] border border-[#222] rounded-2xl flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#222]">
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-[#444]" />
                  <span className="font-semibold text-white text-sm">{col.name}</span>
                  <span className="text-[10px] text-[#666] bg-[#1a1a1a] rounded-full px-2 py-0.5">{col.cards.length}</span>
                </div>
                {deleteConfirm?.type === "column" && deleteConfirm.colId === col.id ? (
                  <div className="flex gap-1">
                    <button onClick={() => deleteColumn(col.id)} className="text-[10px] text-rose-400 hover:text-rose-300 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">Delete</button>
                    <button onClick={() => setDeleteConfirm(null)} className="text-[10px] text-[#666] hover:text-white px-1.5 py-0.5 rounded">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirm({ type: "column", colId: col.id })} className="text-[#444] hover:text-rose-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <AnimatePresence>
                  {col.cards.map((card) => {
                    const typeStyle = getTypeStyle(card.type);
                    const TypeIcon = typeStyle.icon;
                    return (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 group hover:border-[#333] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white leading-tight">{card.title}</p>
                            {card.description && (
                              <p className="text-xs text-[#666] mt-0.5 line-clamp-2">{card.description}</p>
                            )}
                          </div>
                          {deleteConfirm?.type === "card" && deleteConfirm.cardId === card.id ? (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => deleteCard(col.id, card.id)} className="text-[9px] text-rose-400 px-1 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">✕</button>
                              <button onClick={() => setDeleteConfirm(null)} className="text-[9px] text-[#666] px-1 py-0.5 rounded">✓</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm({ type: "card", colId: col.id, cardId: card.id })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#444] hover:text-rose-400 shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className={`text-[9px] font-semibold border px-1.5 py-0 ${typeStyle.color}`}>
                            <TypeIcon size={9} className="mr-1 inline" />
                            {typeStyle.label}
                          </Badge>
                          {card.url && (
                            <a
                              href={card.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors"
                            >
                              Open <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Add Card Form / Button */}
              <div className="p-3 border-t border-[#222]">
                <AnimatePresence mode="wait">
                  {activeCardForm === col.id ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      <input
                        autoFocus
                        value={newCard.title}
                        onChange={e => setNewCard({ ...newCard, title: e.target.value })}
                        placeholder="Resource title..."
                        className="w-full bg-[#0d0d0d] border border-[#333] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        value={newCard.url}
                        onChange={e => setNewCard({ ...newCard, url: e.target.value })}
                        placeholder="URL / Link (optional)"
                        className="w-full bg-[#0d0d0d] border border-[#333] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={newCard.type}
                        onChange={e => setNewCard({ ...newCard, type: e.target.value })}
                        className="w-full bg-[#0d0d0d] border border-[#333] text-white text-xs rounded-lg px-3 py-2 focus:outline-none"
                      >
                        {RESOURCE_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                      <textarea
                        value={newCard.description}
                        onChange={e => setNewCard({ ...newCard, description: e.target.value })}
                        placeholder="Short description (optional)"
                        rows={2}
                        className="w-full bg-[#0d0d0d] border border-[#333] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 resize-none"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => addCard(col.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8">
                          <Check size={12} className="mr-1" /> Add
                        </Button>
                        <Button onClick={() => { setActiveCardForm(null); setNewCard({ title: "", url: "", type: "dataset", description: "" }); }} variant="ghost" className="text-[#666] hover:text-white h-8 px-2">
                          <X size={12} />
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setActiveCardForm(col.id)}
                      className="w-full flex items-center gap-2 text-[#555] hover:text-[#888] text-xs py-1 transition-colors"
                    >
                      <Plus size={13} /> Add resource
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}

          {/* Add Column Inline */}
          <button
            onClick={() => setShowColumnForm(true)}
            className="shrink-0 w-72 h-20 border-2 border-dashed border-[#222] hover:border-[#333] rounded-2xl flex items-center justify-center gap-2 text-[#444] hover:text-[#666] transition-colors"
          >
            <Plus size={16} /> New Column
          </button>
        </div>
      )}
    </div>
  );
}
