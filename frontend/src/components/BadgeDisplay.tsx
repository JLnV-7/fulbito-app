// src/components/BadgeDisplay.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ChevronDown, ChevronUp } from 'lucide-react'
import { BADGES, getUnlockedBadges, getBadgeProgress, getNextBadges, type Badge, type BadgeStats } from '@/lib/badges'

interface BadgeDisplayProps {
    stats: BadgeStats
    compact?: boolean
}

export function BadgeDisplay({ stats, compact = false }: BadgeDisplayProps) {
    const [showAll, setShowAll] = useState(false)
    const unlocked = getUnlockedBadges(stats)
    const nextBadges = getNextBadges(stats)
    const unlockedIds = new Set(unlocked.map(b => b.id))

    if (compact) {
        // Compact mode: just show unlocked badge icons in a row
        return (
            <div className="flex flex-wrap gap-1.5">
                {unlocked.length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)]">Sin logros aún</span>
                ) : (
                    unlocked.map(badge => (
                        <span
                            key={badge.id}
                            title={`${badge.name}: ${badge.description}`}
                            className="text-lg cursor-default hover:scale-125 transition-transform"
                        >
                            {badge.icon}
                        </span>
                    ))
                )}
            </div>
        )
    }

    const displayBadges = showAll ? BADGES : [...unlocked, ...nextBadges.filter(b => !unlockedIds.has(b.id))].slice(0, 8)

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    🏅 Logros
                    <span className="text-xs font-normal text-[var(--text-muted)]">
                        {unlocked.length}/{BADGES.length}
                    </span>
                </h3>
                {BADGES.length > 8 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors"
                    >
                        {showAll ? <><ChevronUp size={12} /> Menos</> : <><ChevronDown size={12} /> Ver todos</>}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <AnimatePresence mode="popLayout">
                    {displayBadges.map((badge, i) => {
                        const isUnlocked = unlockedIds.has(badge.id)
                        const progress = getBadgeProgress(badge, stats)

                        return (
                            <motion.div
                                key={badge.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.03 }}
                                className={`relative flex items-center gap-2.5 p-3 rounded-xl border transition-all ${isUnlocked
                                        ? 'bg-[#f59e0b]/5 border-[#f59e0b]/20'
                                        : 'bg-[var(--background)] border-[var(--card-border)] opacity-60'
                                    }`}
                            >
                                <div className={`text-2xl shrink-0 ${!isUnlocked ? 'grayscale' : ''}`}>
                                    {isUnlocked ? badge.icon : <Lock size={18} className="text-[var(--text-muted)]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold truncate">{badge.name}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] truncate">{badge.description}</div>
                                    {!isUnlocked && (
                                        <div className="mt-1.5">
                                            <div className="h-1 bg-[var(--card-border)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-[#f59e0b] rounded-full transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="text-[9px] text-[var(--text-muted)] mt-0.5">{progress}%</div>
                                        </div>
                                    )}
                                </div>
                                {isUnlocked && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#10b981] rounded-full flex items-center justify-center">
                                        <span className="text-white text-[8px]">✓</span>
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>
        </div>
    )
}
