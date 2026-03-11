'use client'

import { Target, CheckCircle2, Zap, Flame, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useWeeklyChallenges } from '@/hooks/useWeeklyChallenges'

function PenLineIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
    )
}

export function WeeklyChallenges() {
    const { user } = useAuth()
    const { challenges, loading, completedCount, totalXP } = useWeeklyChallenges()

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-[var(--card-border)]/10 animate-pulse rounded-2xl" />
                ))}
            </div>
        )
    }

    const getIcon = (id: string) => {
        if (id.includes('c1')) return Flame
        if (id.includes('c2')) return PenLineIcon
        return Target
    }

    return (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[var(--card-border)] bg-[var(--background)]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#f59e0b]/10 rounded-lg text-[#f59e0b]">
                        <Trophy size={18} />
                    </div>
                    <h3 className="font-black tracking-wide text-[var(--foreground)]">DESAFÍOS SEMANALES</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent)]/10 rounded-full text-[var(--accent)] font-bold text-xs border border-[var(--accent)]/20">
                    <Zap size={12} className="fill-[var(--accent)]" />
                    +{totalXP} XP
                </div>
            </div>

            {/* Progress Recap */}
            <div className="px-5 py-4 flex items-center gap-4 bg-gradient-to-r from-[var(--hover-bg)] to-transparent">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="none" className="text-[var(--card-border)]" />
                        <circle
                            cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="4" fill="none"
                            strokeDasharray="163"
                            strokeDashoffset={163 - (163 * (completedCount || 0)) / (challenges?.length || 1)}
                            className="text-[#f59e0b] transition-all duration-1000"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-sm font-black">{completedCount}/{challenges?.length}</span>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-sm">Progreso de la Semana</h4>
                    <div className="text-xs mt-1">
                        {completedCount === challenges?.length && challenges?.length > 0
                            ? <span className="text-[var(--text-muted)]">Completaste todos los desafíos de la semana.</span>
                            : user && completedCount === 0 && challenges?.some(c => c.current === 0)
                                ? (
                                    <div className="mt-2 text-left">
                                        <p className="text-[var(--text-muted)] mb-2">Todavía no completaste desafíos esta semana. Empezá ahora: rateá un partido o hacé un prode para desbloquear tu primer badge.</p>
                                        <a href="/" className="inline-block px-3 py-1.5 bg-[var(--accent)] text-white rounded-lg font-bold text-[10px] hover:opacity-90 transition-colors">
                                            Ir a partidos recientes →
                                        </a>
                                    </div>
                                )
                                : <span className="text-[var(--text-muted)]">Ganá XP extra para subir de nivel más rápido.</span>}
                    </div>
                </div>
            </div>

            {/* Quests List */}
            <div className="p-2 space-y-1">
                {challenges?.map((challenge, idx) => {
                    const isCompleted = challenge.current >= challenge.target
                    const progressPercent = Math.min((challenge.current / challenge.target) * 100, 100)
                    const Icon = getIcon(challenge.id)

                    return (
                        <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-3 flex items-center gap-4 transition-all border border-dashed
                ${isCompleted ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]' : 'bg-transparent border-[var(--card-border)]'}
              `}
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {/* Icon */}
                            <div className={`w-10 h-10 flex items-center justify-center shrink-0
                ${isCompleted ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[var(--hover-bg)] text-[var(--text-muted)]'}
              `} style={{ borderRadius: 'var(--radius)' }}>
                                {isCompleted ? <CheckCircle2 size={18} className="font-black" /> : <Icon size={18} />}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <h5 className={`text-[11px] font-black capitalize tracking-tight truncate ${isCompleted ? 'opacity-90 line-through' : ''}`}>
                                    {challenge.title}
                                </h5>
                                <p className={`text-[9px] capitalize font-bold truncate mb-1.5 ${isCompleted ? 'opacity-70' : 'text-[var(--text-muted)]'}`}>{challenge.description}</p>

                                {/* Progress Bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-[var(--background)] border border-[var(--card-border)] overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercent}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className={`h-full ${isCompleted ? 'bg-[var(--background)]' : 'bg-[#f59e0b]'}`}
                                        />
                                    </div>
                                    <span className={`text-[9px] font-black tabular-nums whitespace-nowrap capitalize ${isCompleted ? 'opacity-90' : 'text-[var(--text-muted)]'}`}>
                                        {challenge.current} / {challenge.target}
                                    </span>
                                </div>
                            </div>

                            {/* Reward Badge */}
                            <div className={`px-2 py-1 text-[9px] font-black border shrink-0 capitalize tracking-widest
                 ${isCompleted
                                    ? 'bg-[var(--background)] text-[var(--foreground)] border-[var(--background)] opacity-80'
                                    : 'bg-[var(--background)] text-[#f59e0b] border-[#f59e0b]/30'
                                }
              `} style={{ borderRadius: 'var(--radius)' }}>
                                {challenge.xpReward} XP
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

