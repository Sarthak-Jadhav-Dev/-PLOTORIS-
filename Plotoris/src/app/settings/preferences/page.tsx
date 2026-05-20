"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Plus, X, Loader2 } from "lucide-react";

const availableInterests = [
  "Computer Science", "Biology", "Physics", "Medicine", 
  "Economics", "Psychology", "Engineering", "Mathematics",
  "Artificial Intelligence", "Quantum Computing", "Genetics"
];

export default function PreferencesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profession, setProfession] = useState("");
  const [education, setEducation] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setProfession(data.data.profession || "");
        setEducation(data.data.education || "");
        if (data.data.fields_of_interest) {
          setInterests(data.data.fields_of_interest.split(",").map((s: string) => s.trim()).filter(Boolean));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          profession,
          education,
          fieldsOfInterest: interests.join(", ")
        })
      });
      // Could add a toast notification here
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="text-orange-primary animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold mb-1">Research Preferences</h2>
        <p className="text-text-secondary text-sm">Customize how Plotoris tailors its AI analysis for you.</p>
      </div>

      <div className="space-y-6">
        {/* Profession */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Profession</label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            className="w-full bg-surface-raised border border-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-orange-primary/50 transition-colors"
          >
            <option value="" disabled>Select Profession</option>
            {["Student", "Teacher", "Researcher", "Publisher", "Industry Professional", "Other"].map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Education */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Highest Education Level</label>
          <select
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="w-full bg-surface-raised border border-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-orange-primary/50 transition-colors"
          >
            <option value="" disabled>Select Education Level</option>
            {["High School", "Bachelor's Degree", "Master's Degree", "Ph.D.", "Postdoctoral", "Other"].map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Fields of Interest */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Fields of Interest</label>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {interests.map(interest => (
              <span key={interest} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-primary/10 border border-orange-primary/20 text-orange-primary text-sm">
                {interest}
                <button onClick={() => setInterests(interests.filter(i => i !== interest))} className="hover:text-red-400">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <form onSubmit={handleAddInterest} className="flex gap-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add a new field (e.g. Neuroscience)"
              className="flex-1 bg-surface-raised border border-border text-text-primary text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-orange-primary/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!newInterest.trim()}
              className="px-4 py-3 bg-surface-overlay hover:bg-surface border border-border rounded-xl text-text-primary disabled:opacity-50 transition-colors"
            >
              <Plus size={18} />
            </button>
          </form>

          {/* Quick Add Suggestions */}
          <div className="mt-4">
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wider font-semibold">Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {availableInterests.filter(i => !interests.includes(i)).slice(0, 6).map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setInterests([...interests, suggestion])}
                  className="px-3 py-1.5 rounded-full bg-surface-raised border border-border hover:border-orange-primary/30 text-text-secondary hover:text-text-primary text-xs transition-colors flex items-center gap-1"
                >
                  <Plus size={12} /> {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border flex justify-end">
        <button
          onClick={savePreferences}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-linear-to-r from-orange-primary to-orange-dark text-white font-medium hover:shadow-lg hover:shadow-orange-primary/20 disabled:opacity-50 transition-all duration-300"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          Save Changes
        </button>
      </div>
    </motion.div>
  );
}
