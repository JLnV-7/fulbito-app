'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Gift, Target, Clock } from 'lucide-react'

// Simulamos los contests (en real iría a Supabase)
const DAILY_CONTESTS = [
    {
        id: 1,
        title: "Experto en Clásicos",
        description: "Acertá el resultado exacto del Superclásico",
        reward: "500 XP + Insignia 'Oráculo'",
        participants: 12450,
        timeLeft: "04:22:10",
        type: "score"
    },
    {
        id: 2,
        title: "Cazatalentos",
        description: "Votá a 3 jugadores Sub-20 con nota > 8",
        reward: "200 XP",
        participants: 5320,
        timeLeft: "12:00:00",
        type: "voting"
    }
]

export function DailyContestWidget() {
    const [joined, setJoined] = useState<number[]>([])

    const handleJoin = (id: number) => {
        if (!joined.includes(id)) {
            setJoined([...joined, id])
            // Acá habría llamada a api para unirse
        }
    }

    return (
        <div className="mb-6 px-4 md:px-0">
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-[#fbbf24]" />
                <h2 className="text-lg font-black tracking-tight">Contests Diarios</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                {DAILY_CONTESTS.map(contest => {
                    const isJoined = joined.includes(contest.id)
                    return (
                        <motion.div
                            key={contest.id}
                            className={`min-w-[280px] md:min-w-[320px] rounded-2xl p-4 shrink-0 snap-center border relative overflow-hidden transition-all
                                ${isJoined
                                    ? 'bg-[#10b981]/10 border-[#10b981]/40'
                                    : 'bg-gradient-to-br from-[var(--card-bg)] to-[var(--background)] border-[var(--card-border)]'}
                            `}
                            whileHover={{ y: -2 }}
                        >
                            {/* Bg decoration */}
                            <div className="absolute -right-6 -top-6 text-6xl opacity-5 pointer-events-none">
                                {contest.type === 'score' ? '🎯' : '⭐'}
                            </div>

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <h3 className="font-black text-sm text-[var(--foreground)] pr-8">{contest.title}</h3>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-[#ff6b6b] bg-[#ff6b6b]/10 px-2 py-1 rounded-md">
                                    <Clock size={10} />
                                    {contest.timeLeft}
                                </div>
                            </div>

                            <p className="text-xs text-[var(--text-muted)] mb-4 h-8 leading-snug">
                                {contest.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#fbbf24]">
                                    <Gift size={14} />
                                    {contest.reward}
                                </div>
                                <span className="text-[10px] text-[var(--text-muted)]">
                                    {contest.participants.toLocaleString()} anotados
                                </span>
                            </div>

                            <button
                                onClick={() => handleJoin(contest.id)}
                                disabled={isJoined}
                                className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all
                                    ${isJoined
                                        ? 'bg-[#10b981] text-white'
                                        : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'}
                                `}
                            >
                                {isJoined ? 'Participando ✅' : 'Unirse al Contest'}
                            </button>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
