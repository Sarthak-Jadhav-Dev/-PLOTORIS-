"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Sliders, Key, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Account", href: "/settings/account", icon: User },
    { name: "Preferences", href: "/settings/preferences", icon: Sliders },
    { name: "API Keys", href: "/settings/api-keys", icon: Key },
  ];

  return (
    <div className="min-h-screen bg-background text-text-primary p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/chat"
            className="p-2 rounded-xl bg-surface-raised hover:bg-surface-overlay transition-colors border border-border"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-text-secondary">Manage your account and preferences.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                      isActive
                        ? "text-orange-primary font-medium"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
                    }`}
                  >
                    <Icon size={18} className={isActive ? "text-orange-primary" : "text-text-muted"} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-orange-primary/10 border border-orange-primary/20 rounded-xl z-0"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 bg-surface-raised/40 backdrop-blur-xl border border-border rounded-3xl p-6 md:p-8 shadow-xl min-h-[500px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
