"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AccountPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser({
          name: payload.name || "Unknown User",
          email: payload.email || "Unknown Email",
        });
      } catch (e) {
        console.error("Error decoding token");
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-orange-primary/30 border-t-orange-primary rounded-full animate-spin" />
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold mb-1">Account Details</h2>
        <p className="text-text-secondary text-sm">Manage your personal information and subscription.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-orange-primary to-orange-dark flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-orange-primary/20 shrink-0">
          {initials}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full">
          {/* Name Field */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-text-muted mb-2">
              <User size={16} />
              <span className="text-xs uppercase tracking-wider font-semibold">Full Name</span>
            </div>
            <p className="font-medium text-text-primary">{user.name}</p>
          </div>

          {/* Email Field */}
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-text-muted mb-2">
              <Mail size={16} />
              <span className="text-xs uppercase tracking-wider font-semibold">Email Address</span>
            </div>
            <p className="font-medium text-text-primary">{user.email}</p>
          </div>

          {/* Role / Tier Field */}
          <div className="bg-surface rounded-xl border border-border p-4 sm:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-text-muted mb-2">
                  <Shield size={16} />
                  <span className="text-xs uppercase tracking-wider font-semibold">Current Plan</span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-text-primary text-lg">Free Researcher</p>
                  <span className="flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <CheckCircle2 size={12} /> Active
                  </span>
                </div>
              </div>
              <button className="px-4 py-2 text-sm font-medium bg-surface-raised hover:bg-surface-overlay border border-border rounded-lg transition-colors">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Danger Zone */}
      <div className="mt-12 pt-8 border-t border-border">
        <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-text-secondary mb-4">Permanently delete your account and all of your content.</p>
        <button className="px-4 py-2 text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded-lg transition-colors">
          Delete Account
        </button>
      </div>
    </motion.div>
  );
}
