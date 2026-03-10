import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const footerLinks = {
    Product: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#" },
        { label: "API", href: "#" },
        { label: "Documentation", href: "#" },
    ],
    Company: [
        { label: "About", href: "#about" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
    ],
    Legal: [
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Cookie Policy", href: "#" },
    ],
};

const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
    return (
        <footer className="relative bg-surface border-t border-border">
            {/* Gradient divider */}
            <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-primary to-transparent" />

            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-3 mb-4">
                            <Image src="/plotoris.png" alt="Plotoris Logo" width={36} height={36} className="w-9 h-9 object-contain" />
                            <span className="text-lg font-bold">
                                Ploto<span className="text-gradient">ris</span>
                            </span>
                        </Link>
                        <p className="text-text-secondary text-sm leading-relaxed max-w-sm mb-6">
                            The AI-powered research platform that helps you analyze papers,
                            extract insights, and accelerate your workflow.
                        </p>
                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-9 h-9 rounded-lg bg-surface-raised border border-border flex items-center justify-center text-text-muted hover:text-orange-primary hover:border-orange-primary/50 transition-all duration-300"
                                >
                                    <social.icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
                                {title}
                            </h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm text-text-muted hover:text-orange-primary transition-colors duration-300"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-text-muted">
                        © {new Date().getFullYear()} Plotoris. All rights reserved.
                    </p>
                    <p className="text-xs text-text-muted">
                        Built with passion for researchers worldwide.
                    </p>
                </div>
            </div>
        </footer>
    );
}
