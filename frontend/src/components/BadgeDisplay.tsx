// src/components/BadgeDisplay.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { BADGES, getUnlockedBadges, getBadgeProgress, getNextBadges, type Badge, type BadgeStats } from '@/lib/badges'

interface BadgeDisplayProps {
    stats: BadgeStats
    compact?: boolean
}

export function BadgeDisplay({ stats, compact = false }: BadgeDisplayProps) {
    const [showAll, setShowAll] = useState(false)
    const [lastUnlockedCount, setLastUnlockedCount] = useState<number | null>(null)
    const unlocked = getUnlockedBadges(stats)
    const nextBadges = getNextBadges(stats)
    const unlockedIds = new Set(unlocked.map(b => b.id))

    useEffect(() => {
        if (lastUnlockedCount !== null && unlocked.length > lastUnlockedCount) {
            // New badge unlocked!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f59e0b', '#16a34a', '#2563eb']
            })
        }
        setLastUnlockedCount(unlocked.length)
    }, [unlocked.length])

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
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4" style={{ borderRadius: 'var(--radius)' }}>
            <div className="flex items-center justify-between mb-4 border-b border-[var(--card-border)] pb-2 border-dashed">
                <h3 className="text-[10px] font-black capitalize tracking-widest flex items-center gap-2">
                    🏅 Logros
                    <span className="text-[9px] font-bold text-[var(--text-muted)] border border-[var(--card-border)] px-1.5 py-0.5 ml-1">
                        {unlocked.length}/{BADGES.length}
                    </span>
                </h3>
                {BADGES.length > 8 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="text-[9px] font-black capitalize text-[var(--accent)] hover:underline flex items-center gap-1"
                    >
                        {showAll ? 'Menos' : 'Ver todos'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
                {displayBadges.map((badge) => {
                    const isUnlocked = unlockedIds.has(badge.id)
                    const progress = getBadgeProgress(badge, stats)

                    return (
                        <div
                            key={badge.id}
                            className={`relative flex items-center gap-2 p-2 border transition-all ${isUnlocked
                                ? 'bg-[var(--background)] border-[var(--foreground)]/20'
                                : 'bg-[var(--background)] border-[var(--card-border)] opacity-40'
                                }`}
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <div className={`text-xl shrink-0 ${!isUnlocked ? 'grayscale brightness-50' : ''}`}>
                                {isUnlocked ? badge.icon : '🔒'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-black capitalize tracking-tighter truncate">{badge.name}</div>
                                <div className="text-[8px] text-[var(--text-muted)] font-bold truncate leading-tight">{badge.description}</div>
                                {!isUnlocked && (
                                    <div className="mt-1">
                                        <div className="h-1 bg-[var(--card-border)] overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--foreground)] transition-all duration-500"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {isUnlocked && (
                                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[var(--foreground)] border border-[var(--background)] flex items-center justify-center">
                                    <span className="text-[var(--background)] text-[8px] font-black">✓</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
