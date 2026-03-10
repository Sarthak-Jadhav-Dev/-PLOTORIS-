"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const benefits = [
    "Access to 2.5M+ research papers",
    "AI-powered insights & summaries",
    "Collaborative research workspace",
    "Smart citation generator",
];

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen flex">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-primary/15 rounded-full blur-[150px] animate-float" />
                <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-orange-dark/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: "2s" }} />

                {/* Mesh pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,107,0,0.5) 1px, transparent 0)`,
                        backgroundSize: "40px 40px",
                    }}
                />

                {/* Content */}
                <div className="relative z-10 max-w-md px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Link href="/" className="flex items-center gap-3 mb-12">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-primary to-orange-dark flex items-center justify-center font-bold text-white text-xl">
                                P
                            </div>
                            <span className="text-2xl font-bold">
                                Ploto<span className="text-gradient">ris</span>
                            </span>
                        </Link>

                        <h1 className="text-4xl font-extrabold leading-tight mb-4">
                            Start your<br />
                            <span className="text-gradient">Research Journey.</span>
                        </h1>
                        <p className="text-text-secondary text-lg leading-relaxed mb-10">
                            Join thousands of researchers accelerating their discoveries with AI.
                        </p>

                        {/* Benefits */}
                        <div className="space-y-4">
                            {benefits.map((benefit, i) => (
                                <motion.div
                                    key={benefit}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircle2 size={20} className="text-orange-primary flex-shrink-0" />
                                    <span className="text-sm text-text-secondary">{benefit}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel — Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background relative">
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-primary/5 rounded-full blur-[200px]" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="relative z-10 w-full max-w-md"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-primary to-orange-dark flex items-center justify-center font-bold text-white text-lg">
                                P
                            </div>
                            <span className="text-xl font-bold">
                                Ploto<span className="text-gradient">ris</span>
                            </span>
                        </Link>
                    </div>

                    <h2 className="text-3xl font-bold mb-2">Create Account</h2>
                    <p className="text-text-secondary mb-8">
                        Get started with your free research account
                    </p>

                    {/* Social Signup */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface-raised text-sm font-medium hover:border-border-hover hover:bg-surface-overlay transition-all duration-300">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-surface-raised text-sm font-medium hover:border-border-hover hover:bg-surface-overlay transition-all duration-300">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs text-text-muted uppercase tracking-wider">or sign up with email</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Form */}
                    <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-orange-primary/50 focus:ring-1 focus:ring-orange-primary/20 transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type="email"
                                    placeholder="you@university.edu"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-orange-primary/50 focus:ring-1 focus:ring-orange-primary/20 transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 characters"
                                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-orange-primary/50 focus:ring-1 focus:ring-orange-primary/20 transition-all duration-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="terms"
                                className="w-4 h-4 mt-0.5 rounded border-border bg-surface-raised accent-orange-primary"
                            />
                            <label htmlFor="terms" className="text-sm text-text-secondary">
                                I agree to the{" "}
                                <a href="#" className="text-orange-primary hover:text-orange-light transition-colors">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="text-orange-primary hover:text-orange-light transition-colors">
                                    Privacy Policy
                                </a>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn-primary w-full !py-4 !rounded-xl !text-base group"
                        >
                            <span className="flex items-center justify-center gap-2">
                                Create Account
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-sm text-text-secondary mt-8">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-orange-primary hover:text-orange-light font-medium transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
