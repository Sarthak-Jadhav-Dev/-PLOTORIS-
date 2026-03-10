"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                        ? "glass-card-strong shadow-lg shadow-black/30"
                        : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-primary to-orange-dark flex items-center justify-center font-bold text-white text-lg group-hover:shadow-lg group-hover:shadow-orange-primary/30 transition-all duration-300">
                                P
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-light to-orange-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <span className="relative z-10">P</span>
                            </div>
                            <span className="text-xl font-bold tracking-tight">
                                Ploto<span className="text-gradient">ris</span>
                            </span>
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="text-sm font-medium text-text-secondary hover:text-orange-primary transition-colors duration-300 relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-primary group-hover:w-full transition-all duration-300" />
                                </a>
                            ))}
                        </div>

                        {/* Desktop CTA */}
                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-300"
                            >
                                Log In
                            </Link>
                            <Link href="/signup" className="btn-primary !py-2.5 !px-6 !text-sm !rounded-lg">
                                <span>Get Started</span>
                            </Link>
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            className="md:hidden text-text-primary p-2"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 pt-24 px-6 glass-card-strong md:hidden"
                    >
                        <div className="flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="text-2xl font-semibold text-text-primary hover:text-orange-primary transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="h-px bg-border my-2" />
                            <Link
                                href="/login"
                                onClick={() => setMobileOpen(false)}
                                className="text-lg text-text-secondary hover:text-text-primary transition-colors"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/signup"
                                onClick={() => setMobileOpen(false)}
                                className="btn-primary text-center !text-lg"
                            >
                                <span>Get Started</span>
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
