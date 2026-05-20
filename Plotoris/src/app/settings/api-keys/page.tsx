"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Key, Copy, Trash2, Plus, Database, HardDrive, CheckCircle2, Loader2 } from "lucide-react";

interface ApiKey {
  id: string;
  provider: string;
  key_value: string;
  storage: "database" | "local";
  created_at?: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [provider, setProvider] = useState("OpenAI");
  const [keyValue, setKeyValue] = useState("");
  const [storage, setStorage] = useState<"database" | "local">("database");

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setIsLoading(true);
    let allKeys: ApiKey[] = [];

    // 1. Fetch Local Keys
    try {
      const localStr = localStorage.getItem("localApiKeys");
      if (localStr) {
        allKeys = JSON.parse(localStr);
      }
    } catch (e) {
      console.error("Failed to parse local keys");
    }

    // 2. Fetch DB Keys
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const dbKeys = data.data.map((k: any) => ({ ...k, storage: "database" }));
        allKeys = [...allKeys, ...dbKeys];
      }
    } catch (e) {
      console.error("Failed to fetch DB keys");
    }

    setKeys(allKeys);
    setIsLoading(false);
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim()) return;

    setIsAdding(true);

    if (storage === "local") {
      const newKey: ApiKey = {
        id: "local_" + crypto.randomUUID(),
        provider,
        key_value: keyValue,
        storage: "local",
      };
      const existingLocal = keys.filter(k => k.storage === "local");
      localStorage.setItem("localApiKeys", JSON.stringify([...existingLocal, newKey]));
      setKeys([...keys, newKey]);
      resetForm();
    } else {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/keys", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ provider, keyValue })
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setKeys([...keys, { ...data.data, storage: "database" }]);
          resetForm();
        } else {
          alert(data.message || "Failed to add key to DB. Check if api_keys table exists.");
        }
      } catch (err: unknown) {
        console.error(err);
      }
    }
    setIsAdding(false);
  };

  const resetForm = () => {
    setKeyValue("");
    setProvider("OpenAI");
    setStorage("database");
  };

  const handleDelete = async (id: string, keyStorage: "local" | "database") => {
    if (keyStorage === "local") {
      const newKeys = keys.filter(k => k.id !== id);
      const newLocalKeys = newKeys.filter(k => k.storage === "local");
      localStorage.setItem("localApiKeys", JSON.stringify(newLocalKeys));
      setKeys(newKeys);
    } else {
      try {
        const token = localStorage.getItem("token");
        await fetch(`/api/keys?id=${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        setKeys(keys.filter(k => k.id !== id));
      } catch {
        console.error("Failed to delete DB key");
      }
    }
  };

  const handleCopy = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskKey = (key: string) => {
    if (key.length < 8) return "••••••••";
    return `${key.substring(0, 3)}...${key.substring(key.length - 4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold mb-1">API Keys</h2>
        <p className="text-text-secondary text-sm">Manage API keys for external models (OpenAI, Anthropic, etc).</p>
      </div>

      {/* Add Key Form */}
      <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-text-muted">Add New Key</h3>
        <form onSubmit={handleAddKey} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-surface-raised border border-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-orange-primary/50 transition-colors"
            >
              {["OpenAI", "Anthropic", "HuggingFace", "Cohere", "Custom"].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-muted mb-1.5">API Key</label>
            <input
              type="password"
              placeholder="sk-..."
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              className="w-full bg-surface-raised border border-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-orange-primary/50 transition-colors font-mono"
            />
          </div>

          <div className="sm:col-span-2 mt-2">
            <label className="block text-xs font-medium text-text-muted mb-2">Storage Location</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStorage("database")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  storage === "database"
                    ? "border-orange-primary bg-orange-primary/10 text-orange-primary"
                    : "border-border bg-surface-raised text-text-secondary hover:border-orange-primary/50 hover:text-text-primary"
                }`}
              >
                <Database size={24} className="mb-2" />
                <span className="text-sm font-medium">Database</span>
                <span className="text-[10px] opacity-70 mt-1 text-center">Syncs across devices</span>
              </button>
              
              <button
                type="button"
                onClick={() => setStorage("local")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  storage === "local"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-500"
                    : "border-border bg-surface-raised text-text-secondary hover:border-emerald-500/50 hover:text-text-primary"
                }`}
              >
                <HardDrive size={24} className="mb-2" />
                <span className="text-sm font-medium">Local Browser</span>
                <span className="text-[10px] opacity-70 mt-1 text-center">Stays only on this device</span>
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end mt-4">
            <button
              type="submit"
              disabled={isAdding || !keyValue.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-orange-primary to-orange-dark text-white font-medium hover:shadow-lg hover:shadow-orange-primary/20 disabled:opacity-50 transition-all duration-300"
            >
              {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Add Key
            </button>
          </div>
        </form>
      </div>

      {/* Keys List */}
      <div>
        <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-text-muted">Your Keys</h3>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 size={24} className="text-orange-primary animate-spin" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center p-8 border border-dashed border-border rounded-2xl bg-surface-raised/30">
            <Key size={32} className="mx-auto text-text-muted mb-3 opacity-50" />
            <p className="text-text-secondary text-sm">No API keys added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border group hover:border-border-hover transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${key.storage === "database" ? "bg-orange-primary/10 text-orange-primary" : "bg-emerald-500/10 text-emerald-500"}`}>
                    <Key size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{key.provider}</p>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        key.storage === "database" ? "border-orange-primary/20 text-orange-primary bg-orange-primary/5" : "border-emerald-500/20 text-emerald-500 bg-emerald-500/5"
                      }`}>
                        {key.storage}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted font-mono mt-0.5">{maskKey(key.key_value)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleCopy(key.key_value, key.id)}
                    className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-raised transition-colors"
                    title="Copy Key"
                  >
                    {copiedId === key.id ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(key.id, key.storage)}
                    className="p-2 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete Key"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
