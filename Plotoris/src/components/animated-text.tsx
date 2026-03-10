"use client";

import { motion } from "framer-motion";

interface AnimatedTextProps {
    text: string;
    className?: string;
    delay?: number;
}

export default function AnimatedText({ text, className = "", delay = 0 }: AnimatedTextProps) {
    const words = text.split(" ");

    const container = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: delay,
            },
        },
    };

    const child = {
        hidden: {
            opacity: 0,
            y: 30,
            filter: "blur(8px)",
        },
        visible: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: {
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1] as const,
            },
        },
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className={`flex flex-wrap ${className}`}
        >
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    variants={child}
                    className="mr-[0.3em] inline-block"
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
}
