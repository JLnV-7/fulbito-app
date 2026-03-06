// src/components/ranking/RankingGoal.tsx
'use client'

import { motion } from 'framer-motion'
import { Trophy, Target, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

interface RankingGoalProps {
    currentPoints: number
    rank?: number
}

export function RankingGoal({ currentPoints, rank }: RankingGoalProps) {
    const [progress, setProgress] = useState(0)
    const [targetPoints, setTargetPoints] = useState(0)
    const [tierName, setTierName] = useState('')

    useEffect(() => {
        // Define tiers
        const tiers = [
            { name: 'Principiante', min: 0, max: 100 },
            { name: 'Aficionado', min: 101, max: 250 },
            { name: 'Experto', min: 251, max: 500 },
            { name: 'Maestro', min: 501, max: 1000 },
            { name: 'Leyenda', min: 1001, max: 2500 }
        ]

        const currentTier = tiers.find(t => currentPoints <= t.max) || tiers[tiers.length - 1]
        const nextTier = tiers[tiers.indexOf(currentTier) + 1] || null

        if (nextTier) {
            setTargetPoints(nextTier.max)
            setTierName(nextTier.name)
            const p = (currentPoints / nextTier.max) * 100
            setProgress(Math.min(100, p))

            // Confetti if close to next tier (>90%)
            if (p > 90 && p < 100) {
                confetti({
                    particleCount: 20,
                    spread: 40,
                    origin: { y: 0.8 },
                    colors: ['#10b981', '#f59e0b']
                })
            }
        } else {
            // Already at highest tier
            setTargetPoints(5000)
            setTierName('GOAT')
            setProgress((currentPoints / 5000) * 100)
        }
    }, [currentPoints])

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-green)]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] rounded-xl flex items-center justify-center">
                        <Target size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-[var(--foreground)]">Tu meta esta semana</h4>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                            Rumbo a: <span className="text-[var(--accent-green)]">{tierName}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-black text-[var(--foreground)]">{currentPoints}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold ml-1">/ {targetPoints} pts</span>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-4 bg-[var(--background)] rounded-full border border-[var(--card-border)] p-0.5 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[var(--accent-green)] to-[#10b981] rounded-full relative"
                >
                    {/* Glossy effect */}
                    <div className="absolute inset-0 bg-white/20 h-1/2 rounded-full" />

                    {progress > 90 && (
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 -translate-x-1"
                        >
                            <Sparkles size={10} className="text-white" />
                        </motion.div>
                    )}
                </motion.div>
            </div>

            <div className="mt-3 flex justify-between items-center">
                <p className="text-[10px] text-[var(--text-muted)] italic">
                    {progress > 75
                        ? '¡Estás a nada de subir! Seguí sumando.'
                        : 'Meté un par de aciertos y subís de rango.'}
                </p>
                {rank && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--hover-bg)] rounded-lg border border-[var(--card-border)]">
                        <Trophy size={10} className="text-[var(--accent-yellow)]" />
                        <span className="text-[10px] font-bold">Top #{rank}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
