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


        } else {
            // Already at highest tier
            setTargetPoints(5000)
            setTierName('GOAT')
            setProgress((currentPoints / 5000) * 100)
        }
    }, [currentPoints])

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 overflow-hidden relative" style={{ borderRadius: 'var(--radius)' }}>

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--background)] text-[var(--foreground)] border border-[var(--card-border)] flex items-center justify-center" style={{ borderRadius: 'var(--radius)' }}>
                        <Target size={20} />
                    </div>
                    <div>
                        <h4 className="font-black text-[10px] capitalize tracking-widest text-[var(--foreground)]">Tu meta esta semana</h4>
                        <p className="text-[10px] text-[var(--text-muted)] font-black capitalize tracking-widest italic">
                            Rumbo a: <span className="text-[#16a34a]">{tierName}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xl font-black text-[var(--foreground)]">{currentPoints}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold ml-1">/ {targetPoints} pts</span>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-4 bg-[var(--background)] border border-[var(--card-border)] p-0.5 overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-[#16a34a] relative"
                >
                    {/* Minimal indicator */}
                    <div className="absolute inset-y-0 right-0 w-px bg-white/40" />

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
                <p className="text-[10px] text-[var(--text-muted)] italic font-bold">
                    {progress > 75
                        ? '¡Estás a nada de subir! Seguí sumando.'
                        : 'Meté un par de aciertos y subís de rango.'}
                </p>
                {rank && (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--background)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                        <Trophy size={10} className="text-[var(--foreground)]" />
                        <span className="text-[9px] font-black capitalize tracking-widest text-[var(--foreground)]">Top #{rank}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
