"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function SpotlightCard({ children, className = "" }: SpotlightCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className={`relative overflow-hidden rounded-2xl border border-border bg-surface-raised p-8 transition-colors duration-500 hover:border-orange-primary/30 ${className}`}
        >
            {/* Spotlight gradient */}
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 107, 0, 0.1), transparent 60%)`,
                }}
            />
            {/* Top edge glow */}
            <div
                className="pointer-events-none absolute top-0 left-0 right-0 h-px transition-opacity duration-500"
                style={{
                    opacity: isHovered ? 1 : 0,
                    background: `radial-gradient(300px circle at ${mousePosition.x}px 0px, rgba(255, 107, 0, 0.5), transparent 60%)`,
                }}
            />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}
