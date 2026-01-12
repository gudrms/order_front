'use client';

import { motion } from 'framer-motion';

interface ScrollAnimationProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}

export default function ScrollAnimation({ children, className = '', delay = 0 }: ScrollAnimationProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
