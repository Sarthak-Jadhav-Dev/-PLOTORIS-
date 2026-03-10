"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  Users,
  BookOpen,
  Network,
  Zap,
  ArrowRight,
  Sparkles,
  Search,
  FileText,
  Lightbulb,
  ChevronRight,
  FileSpreadsheet,
  Cpu,
  Share2,
  GitMerge,
  CheckCircle,
  Globe,
  Share,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import SpotlightCard from "@/components/spotlight-card";
import AnimatedText from "@/components/animated-text";
import AnimatedCounter from "@/components/animated-counter";

const features = [
  {
    icon: Brain,
    title: "AI Research Assistant",
    description:
      "Leverage advanced AI to analyze research papers, summarize findings, and surface critical insights instantly. Capable of reading and reasoning across hundreds of papers in seconds.",
  },
  {
    icon: BarChart3,
    title: "Smart Data Analysis",
    description:
      "Visualize complex datasets with intelligent charts and graphs. Let AI discover patterns, anomalies, and statistical relationships you might miss in raw data.",
  },
  {
    icon: Users,
    title: "Collaborative Workspace",
    description:
      "Real-time collaboration with your research team. Share annotations, notes, highlights, and discoveries. Works across institutions and time zones seamlessly.",
  },
  {
    icon: BookOpen,
    title: "Citation Generator",
    description:
      "Auto-generate citations in any format — APA, MLA, Chicago, IEEE. Perfect bibliographies with one-click export to Word, LaTeX, or Zotero.",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description:
      "Map relationships between papers, authors, institutions, and concepts. Discover hidden connections and trace how ideas evolve over time.",
  },
  {
    icon: Zap,
    title: "Real-time Insights",
    description:
      "Get instant AI-powered insights as you read. Automatically highlights key findings, methodologies, and conclusions — making deep reading faster than ever.",
  },
  {
    icon: FileSpreadsheet,
    title: "Automated Literature Reviews",
    description:
      "Generate structured literature reviews in minutes. Our AI synthesizes findings across dozens of papers into a coherent, citation-backed narrative summary.",
  },
  {
    icon: Cpu,
    title: "Custom AI Models",
    description:
      "Fine-tune AI models on your own domain data. Whether you research genomics, economics, or materials science — Plotoris adapts to your scientific vocabulary.",
  },
  {
    icon: Share2,
    title: "Export & Integration",
    description:
      "Seamlessly export to Notion, Google Docs, Overleaf, and more. Integrate with your existing research stack without breaking your workflow.",
  },
];

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Upload & Search",
    description:
      "Upload your own PDFs or search our database of 2.5M+ publications. Import directly from arXiv, PubMed, Semantic Scholar, or any DOI.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "AI Analyzes",
    description:
      "Our multimodal AI reads text, tables, charts, and equations — extracting claims, methodology, datasets, limitations, and cross-references to related work.",
  },
  {
    icon: Lightbulb,
    step: "03",
    title: "Discover Insights",
    description:
      "Explore interactive knowledge graphs, AI-generated summaries, and comparative analyses. Get tailored paper recommendations based on your reading goals.",
  },
  {
    icon: Share,
    step: "04",
    title: "Export & Share",
    description:
      "Compile findings into polished reports. Export annotated papers, literature reviews, and citation lists to Word, PDF, LaTeX, or your collaboration tools.",
  },
];

const aboutPoints = [
  {
    icon: FlaskConical,
    title: "Built by Researchers",
    body: "Plotoris was founded by students and  engineers who were frustrated with outdated academic tooling. We built the platform we always wished existed.",
  },
  {
    icon: Globe,
    title: "Global Knowledge Access",
    body: "We index papers from 150+ data sources — open-access repositories, institutional archives, and preprint servers — giving you the broadest possible view of human knowledge.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy & Data Security",
    body: "Your research is your intellectual property. We never train on your private documents without permission.",
  },
  {
    icon: GitMerge,
    title: "Continuously Evolving",
    body: "Plotoris ships new AI capabilities, integrations, and quality-of-life improvements every week — driven by direct feedback from our global research community.",
  },
  {
    icon: CheckCircle,
    title: "Trusted Accuracy",
    body: "Benchmarked against expert human reviewers, Plotoris achieves 99% factual accuracy on citation extraction and 97% on key-claim identification across scientific domains.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    body: "Distributed inference and intelligent results in milliseconds — even for complex multi-paper analyses. Speed is a feature, not an afterthought.",
  },
];

const stats = [
  // // { value: , suffix: "+", label: "Papers Analyzed" },
  // { value: 85000, suffix: "+", label: "Active Researchers" },
  // { value: 100, suffix: "+", label: "Data Sources" },
  { value: 99, suffix: "%", label: "Accuracy Rate" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] as const },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export default function HomePage() {
  return (
    <main className="relative">
      <Navbar />

      {/* ========================================
          HERO SECTION
          ======================================== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster=""
        >
          <source
            src="https://cdn.coverr.co/videos/coverr-an-abstract-animation-of-particles-3052/1080p.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/70 to-background z-1" />

        {/* Radial Glow */}
        <div className="absolute inset-0 hero-gradient z-2" />

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-orange-primary/10 rounded-full blur-[120px] animate-float z-2" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-orange-dark/8 rounded-full blur-[150px] animate-float z-2" style={{ animationDelay: "3s" }} />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center mt-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-primary/30 bg-orange-primary/5 mb-8"
          >
            <Sparkles size={14} className="text-orange-primary" />
            <span className="text-sm font-medium text-orange-light ">
              AI-Powered Research Platform
            </span>
          </motion.div>

          {/* Main Heading */}
          <AnimatedText
            text="Research, Reimagined with AI"
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.1] justify-center mb-6"
          />

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Analyze millions of papers, extract insights, and accelerate your
            discoveries. The all-in-one platform that transforms how you research.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/signup" className="btn-primary px-8! py-4! text-base! rounded-xl! group flex items-center gap-2">
              <span className="flex items-center gap-2">
                Start Researching Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <a href="#features" className="btn-secondary px-8! py-4! text-base! rounded-xl!">
              Explore Features
            </a>
          </motion.div>

          {/* Floating trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-16 flex items-center justify-center gap-8 text-text-muted text-sm"
          >
            <span className="flex items-center gap-2">
              <FileText size={14} /> Millions of Papers
            </span>
            <span className="w-1 h-1 rounded-full bg-text-muted" />
            <span className="flex items-center gap-2">
              <Users size={14} /> 100's of Researchers
            </span>
            <span className="w-1 h-1 rounded-full bg-text-muted hidden sm:block" />
            <span className="hidden sm:flex items-center gap-2">
              <Zap size={14} /> Real-time AI Agents and Agentic AI
            </span>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="w-6 h-10 rounded-full border-2 border-text-muted/30 flex items-start justify-center p-1.5">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-orange-primary"
            />
          </div>
        </motion.div>
      </section>

      {/* ========================================
          FEATURES SECTION
          ======================================== */}
      <section id="features" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 section-gradient" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-orange-primary uppercase tracking-widest"
            >
              Features
            </motion.span>
            <AnimatedText
              text="Everything You Need to Research Smarter"
              className="text-4xl md:text-5xl font-bold mt-4 justify-center leading-tight"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary mt-6 max-w-2xl mx-auto text-lg"
            >
              Powerful AI tools designed specifically for researchers,
              scientists, and academics.
            </motion.p>
          </div>

          {/* Features Grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeInUp}>
                <SpotlightCard>
                  <div className="w-12 h-12 rounded-xl bg-orange-primary/10 border border-orange-primary/20 flex items-center justify-center mb-5">
                    <feature.icon size={22} className="text-orange-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================
          STATS SECTION
          ======================================== */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-linear-to-r from-orange-primary/5 via-orange-dark/10 to-orange-primary/5" />
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-primary/40 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-extrabold text-gradient mb-2">
                  <AnimatedCounter
                    target={stat.value}
                    suffix={stat.suffix}
                    duration={2.5}
                  />
                </div>
                <p className="text-sm text-text-secondary font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================
          HOW IT WORKS SECTION
          ======================================== */}
      <section id="how-it-works" className="relative py-32 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-orange-primary uppercase tracking-widest"
            >
              How It Works
            </motion.span>
            <AnimatedText
              text="Four Steps to Better Research"
              className="text-4xl md:text-5xl font-bold mt-4 justify-center leading-tight"
            />
          </div>

          {/* Steps */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative"
          >
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                variants={fadeInUp}
                className="relative text-center group"
              >
                {/* Step Number */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-surface-raised border border-border mb-6 z-10">
                  <span className="text-3xl font-extrabold text-gradient">
                    {step.step}
                  </span>
                  <div className="absolute inset-0 rounded-2xl bg-orange-primary/5 animate-glow-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
                </div>

                <div className="w-12 h-12 rounded-xl bg-orange-primary/10 border border-orange-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-primary/20 transition-colors">
                  <step.icon size={22} className="text-orange-primary" />
                </div>

                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================
          ABOUT SECTION
          ======================================== */}
      <section id="about" className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 section-gradient" />
        <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-primary/30 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-20">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-sm font-semibold text-orange-primary uppercase tracking-widest"
            >
              About Plotoris
            </motion.span>
            <AnimatedText
              text="Built for the Future of Science"
              className="text-4xl md:text-5xl font-bold mt-4 justify-center leading-tight"
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-text-secondary mt-6 max-w-3xl mx-auto text-lg leading-relaxed"
            >
              We believe ground-breaking research shouldn&apos;t be slowed down by
              outdated tools. Plotoris is an AI-native platform that radically
              accelerates how scientists, students, and institutions discover,
              analyze, and communicate knowledge — from a lone PhD student to a
              global research institution.
            </motion.p>
          </div>

          {/* About Points Grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {aboutPoints.map((point) => (
              <motion.div key={point.title} variants={fadeInUp}>
                <SpotlightCard>
                  <div className="w-12 h-12 rounded-xl bg-orange-primary/10 border border-orange-primary/20 flex items-center justify-center mb-5">
                    <point.icon size={22} className="text-orange-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-3">
                    {point.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {point.body}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================
          CTA SECTION
          ======================================== */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-linear-to-br from-orange-primary/10 via-transparent to-orange-dark/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-primary/5 rounded-full blur-[200px]" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AnimatedText
              text="Ready to Transform Your Research?"
              className="text-4xl md:text-6xl font-extrabold justify-center leading-tight mb-6"
            />
            <p className="text-lg text-text-secondary max-w-xl mx-auto mb-10 leading-relaxed">
              Join thousands of researchers already using Plotoris to accelerate
              their work. Start for free, upgrade when you&apos;re ready.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="btn-primary px-10! py-4! text-base! rounded-xl! group flex items-center gap-2 glow-orange"
              >
                <span className="flex items-center gap-2">
                  Get Started for Free
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/chat"
                className="btn-secondary px-10! py-4! text-base! rounded-xl!"
              >
                Try the AI Chat
              </Link>
            </div>

            {/* Trust badges */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-xs text-text-muted"
            >
              No credit card required • Free plan available • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
