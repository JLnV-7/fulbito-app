// src/components/WeeklyChallenges.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, CheckCircle2, Zap, Flame, Trophy } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Challenge {
    id: string
    title: string
    description: string
    target: number
    current: number
    xpReward: number
    icon: React.ElementType
}

export function WeeklyChallenges() {
    const { user } = useAuth()
    const [challenges, setChallenges] = useState<Challenge[]>([])

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getWeekNumber = () => {
            const d = new Date()
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
            return Math.ceil((((Number(d) - Number(yearStart)) / 86400000) + 1) / 7)
        }

        const fetchProgress = async () => {
            const weekNum = getWeekNumber()
            let c1Progress = 0
            let c2Progress = 0
            let c3Progress = 0

            if (user) {
                try {
                    // Check start of current week
                    const d = new Date()
                    const day = d.getDay()
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
                    const startOfWeek = new Date(d.setDate(diff))
                    startOfWeek.setHours(0, 0, 0, 0)
                    const isoStart = startOfWeek.toISOString()

                    // Challenge 1: Votar el rating en 3 partidos distintos (votaciones)
                    const { count: c1Count } = await supabase
                        .from('votaciones')
                        .select('partido_id', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .gte('created_at', isoStart)

                    // Challenge 2: Loguear 1 partido con reseña escrita (match_logs)
                    const { count: c2Count } = await supabase
                        .from('match_logs')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .gte('created_at', isoStart)
                        .neq('review_text', '')
                        .not('review_text', 'is', null)

                    // Challenge 3: Agregar 5 predicciones al Prode (pronosticos)
                    const { count: c3Count } = await supabase
                        .from('pronosticos')
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', user.id)
                        .gte('created_at', isoStart)

                    c1Progress = c1Count || 0
                    c2Progress = c2Count || 0
                    c3Progress = c3Count || 0
                } catch (error) {
                    console.error("Error fetching challenges progress", error)
                }
            }

            const realChallenges: Challenge[] = [
                {
                    id: `c1-${weekNum}`,
                    title: 'Tribunero Fiel',
                    description: 'Votá el rating de la comunidad en 3 partidos distintos.',
                    target: 3,
                    current: c1Progress,
                    xpReward: 150,
                    icon: Flame
                },
                {
                    id: `c2-${weekNum}`,
                    title: 'Analista Táctico',
                    description: 'Loguear 1 partido con una reseña escrita completa.',
                    target: 1,
                    current: c2Progress,
                    xpReward: 300,
                    icon: PenLineIcon
                },
                {
                    id: `c3-${weekNum}`,
                    title: 'Gurú del Prode',
                    description: 'Agregá 5 predicciones al Prode de esta fecha.',
                    target: 5,
                    current: c3Progress,
                    xpReward: 200,
                    icon: Target
                }
            ]

            setChallenges(realChallenges)
            setLoading(false)
        }

        fetchProgress()
    }, [user])

    function PenLineIcon(props: any) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
        )
    }

    // Calculate total progress
    const completedCount = challenges.filter(c => c.current >= c.target).length
    const totalXP = challenges.reduce((acc, c) => acc + (c.current >= c.target ? c.xpReward : 0), 0)

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
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#10b981]/10 rounded-full text-[#10b981] font-bold text-xs border border-[#10b981]/20">
                    <Zap size={12} className="fill-[#10b981]" />
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
                            strokeDashoffset={163 - (163 * completedCount) / challenges.length}
                            className="text-[#f59e0b] transition-all duration-1000"
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-sm font-black">{completedCount}/{challenges.length}</span>
                    </div>
                </div>
                <div>
                    <h4 className="font-bold text-sm">Progreso de la Semana</h4>
                    <div className="text-xs mt-1">
                        {completedCount === challenges.length && challenges.length > 0
                            ? <span className="text-[var(--text-muted)]">Completaste todos los desafíos de la semana.</span>
                            : user && completedCount === 0 && challenges.some(c => c.current === 0)
                                ? (
                                    <div className="mt-2 text-left">
                                        <p className="text-[var(--text-muted)] mb-2">Todavía no completaste desafíos esta semana. Empezá ahora: rateá un partido o hacé un prode para desbloquear tu primer badge.</p>
                                        <a href="/" className="inline-block px-3 py-1.5 bg-[#ff6b6b] text-white rounded-lg font-bold text-[10px] hover:bg-[#ff5252] transition-colors">
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
                {challenges.map((challenge, idx) => {
                    const isCompleted = challenge.current >= challenge.target
                    const progressPercent = Math.min((challenge.current / challenge.target) * 100, 100)

                    return (
                        <motion.div
                            key={challenge.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-3 rounded-xl flex items-center gap-4 transition-all
                ${isCompleted ? 'bg-[#10b981]/5 border border-[#10b981]/20' : 'bg-transparent border border-transparent'}
              `}
                        >
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${isCompleted ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[var(--hover-bg)] text-[var(--text-muted)]'}
              `}>
                                {isCompleted ? <CheckCircle2 size={20} className="fill-[#10b981] text-[var(--card-bg)]" /> : <challenge.icon size={20} />}
                            </div>

                            {/* Text */}
                            <div className="flex-1 min-w-0">
                                <h5 className={`text-sm font-bold truncate ${isCompleted ? 'text-[var(--foreground)] opacity-80 line-through decoration-[#10b981]/50' : 'text-[var(--foreground)]'}`}>
                                    {challenge.title}
                                </h5>
                                <p className="text-xs text-[var(--text-muted)] truncate mb-1.5">{challenge.description}</p>

                                {/* Progress Bar */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progressPercent}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                            className={`h-full rounded-full ${isCompleted ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-bold tabular-nums whitespace-nowrap ${isCompleted ? 'text-[#10b981]' : 'text-[var(--text-muted)]'}`}>
                                        {challenge.current} / {challenge.target}
                                    </span>
                                </div>
                            </div>

                            {/* Reward Badge */}
                            <div className={`px-2 py-1 rounded-md text-[10px] font-bold border shrink-0
                ${isCompleted
                                    ? 'bg-[var(--card-bg)] text-[#10b981] border-[#10b981]/30 opacity-50'
                                    : 'bg-[var(--background)] text-[#f59e0b] border-[#f59e0b]/30'
                                }
              `}>
                                {challenge.xpReward} XP
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
