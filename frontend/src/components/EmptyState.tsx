// src/components/EmptyState.tsx
'use client'

import { motion } from 'framer-motion'

interface EmptyStateProps {
    icon?: string
    title: string
    description: string
    actionLabel?: string
    onAction?: () => void
    variant?: 'default' | 'search' | 'calendar' | 'stats' | 'error'
}

const illustrations: Record<string, string> = {
    default: '📭',
    search: '🔍',
    calendar: '📅',
    stats: '📊',
    error: '⚠️',
}

export function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-10 text-center"
        >
            {/* Animated icon */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1
                }}
                className="relative mb-6"
            >
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[var(--background)] to-[var(--card-border)]/30 
                              rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-5xl">{icon || illustrations[variant]}</span>
                </div>

                {/* Decorative rings */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute inset-0 -z-10"
                >
                    <div className="w-32 h-32 mx-auto border border-[var(--card-border)]/30 rounded-full 
                                  absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="w-40 h-40 mx-auto border border-[var(--card-border)]/15 rounded-full 
                                  absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
                </motion.div>
            </motion.div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-xl font-black mb-2">{title}</h3>
                <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                    {description}
                </p>
            </motion.div>

            {/* Action button */}
            {actionLabel && onAction && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={onAction}
                    className="mt-6 px-6 py-3 bg-[#ff6b6b] text-white font-bold rounded-xl
                             hover:bg-[#ee5a5a] transition-all hover:scale-105 active:scale-95"
                >
                    {actionLabel}
                </motion.button>
            )}
        </motion.div>
    )
}
