import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Users, BookOpen, ShieldCheck, Globe, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-orange-primary/30 selection:text-orange-100 overflow-x-hidden">
            <Navbar />
            
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-40 pb-24 px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
                    
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 relative z-10 leading-[1.1]">
                        Empowering the Future of <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
                            Scientific Discovery
                        </span>
                    </h1>
                    <p className="text-[#a1a1aa] text-xl max-w-3xl mx-auto mb-10 relative z-10 leading-relaxed">
                        Plotoris is built by researchers, for researchers. We believe that accelerating discovery requires powerful, intuitive, and highly accurate AI tools that respect the rigorous standards of the scientific method.
                    </p>
                    <div className="flex items-center gap-4 relative z-10">
                        <Link href="/login" className="px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2">
                            Start Researching <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>

                {/* Stats Section matching screenshot */}
                <section className="bg-[#fbf7f4] py-24 border-y border-[#e5e5e5]">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-6xl md:text-7xl font-black text-[#fd7b2e] tracking-tight mb-3">99%</span>
                                <span className="text-[#888] font-semibold tracking-wide uppercase text-sm">Accuracy Rate</span>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-6xl md:text-7xl font-black text-[#fd7b2e] tracking-tight mb-3">50M+</span>
                                <span className="text-[#888] font-semibold tracking-wide uppercase text-sm">Papers Analyzed</span>
                            </div>
                            <div className="flex flex-col items-center justify-center">
                                <span className="text-6xl md:text-7xl font-black text-[#fd7b2e] tracking-tight mb-3">10k+</span>
                                <span className="text-[#888] font-semibold tracking-wide uppercase text-sm">Active Researchers</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="py-32 px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <div className="inline-block px-4 py-1.5 rounded-full border border-[#333] bg-[#111] text-orange-400 text-sm font-semibold mb-6">
                                Our Mission
                            </div>
                            <h2 className="text-4xl font-bold mb-8 tracking-tight">Focus on insights, not manual formatting.</h2>
                            <p className="text-[#a1a1aa] text-lg mb-6 leading-relaxed">
                                The pace of scientific publication has outstripped human capacity to keep up. Important breakthroughs are buried in noise, and researchers spend countless hours formatting, organizing, and synthesizing data instead of thinking critically.
                            </p>
                            <p className="text-[#a1a1aa] text-lg leading-relaxed">
                                Our mission is to provide an end-to-end intelligent workspace that handles the heavy lifting of literature review, data extraction, and paper drafting. By automating the tedious parts of the research lifecycle, Plotoris allows you to focus on generating novel insights.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-6 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                            
                            <div className="bg-[#111] border border-[#222] p-8 rounded-3xl hover:border-[#333] transition-colors relative z-10">
                                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-6">
                                    <Users size={24} className="text-orange-primary" />
                                </div>
                                <h3 className="text-white font-semibold text-lg mb-3">Community Driven</h3>
                                <p className="text-[#888] leading-relaxed">Built with direct feedback from PhDs and postdocs globally.</p>
                            </div>
                            <div className="bg-[#111] border border-[#222] p-8 rounded-3xl hover:border-[#333] transition-colors mt-12 relative z-10">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
                                    <ShieldCheck size={24} className="text-blue-400" />
                                </div>
                                <h3 className="text-white font-semibold text-lg mb-3">Privacy First</h3>
                                <p className="text-[#888] leading-relaxed">Your intellectual property is yours. We never train on private data.</p>
                            </div>
                            <div className="bg-[#111] border border-[#222] p-8 rounded-3xl hover:border-[#333] transition-colors -mt-12 relative z-10">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6">
                                    <BookOpen size={24} className="text-emerald-400" />
                                </div>
                                <h3 className="text-white font-semibold text-lg mb-3">Open Science</h3>
                                <p className="text-[#888] leading-relaxed">Supporting open access integrations seamlessly.</p>
                            </div>
                            <div className="bg-[#111] border border-[#222] p-8 rounded-3xl hover:border-[#333] transition-colors relative z-10">
                                <div className="w-12 h-12 bg-fuchsia-500/10 rounded-xl flex items-center justify-center mb-6">
                                    <Globe size={24} className="text-fuchsia-400" />
                                </div>
                                <h3 className="text-white font-semibold text-lg mb-3">Global Impact</h3>
                                <p className="text-[#888] leading-relaxed">Used by top universities across 50+ countries worldwide.</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden border-t border-[#1a1a1a]">
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
                    <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative z-10">
                        <h2 className="text-4xl font-bold mb-6">Ready to accelerate your research?</h2>
                        <p className="text-[#a1a1aa] text-xl mb-10">Join thousands of researchers who are already using Plotoris to discover, analyze, and publish faster.</p>
                        <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-orange-primary text-white font-semibold rounded-full hover:bg-orange-600 transition-colors">
                            Create Free Account
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
