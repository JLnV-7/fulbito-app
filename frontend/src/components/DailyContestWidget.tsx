'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Gift, Target, Clock } from 'lucide-react'

const LIVE_CONTESTS = [
    { id: 101, local: 'Boca Juniors', visitante: 'River Plate', hora: 'Hoy, 21:00' },
    { id: 102, local: 'Racing Club', visitante: 'Independiente', hora: 'Hoy, 19:30' },
    { id: 103, local: 'San Lorenzo', visitante: 'Huracán', hora: 'Mañana, 17:00' },
    { id: 104, local: 'Estudiantes', visitante: 'Gimnasia', hora: 'Mañana, 19:00' },
    { id: 105, local: 'Rosario Central', visitante: 'Newell\'s', hora: 'Dom, 16:30' }
]

export function DailyContestWidget() {
    const [predictions, setPredictions] = useState<Record<number, 'L' | 'E' | 'V'>>({})
    const predictedCount = Object.keys(predictions).length

    const handlePredict = (matchId: number, result: 'L' | 'E' | 'V') => {
        setPredictions(prev => ({ ...prev, [matchId]: result }))
    }

    return (
        <div className="mb-6 px-4 md:px-0">
            <div className="flex items-center gap-2 mb-4">
                <Trophy size={18} className="text-[#fbbf24]" />
                <h2 className="text-lg font-black tracking-tight">Contests Diarios</h2>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                <div className="min-w-[320px] max-w-sm rounded-[24px] bg-gradient-to-br from-[#10b981] to-[#059669] p-6 shrink-0 snap-center relative overflow-hidden shadow-lg border border-white/10 flex flex-col justify-center">
                    <div className="absolute -right-6 -top-6 text-8xl opacity-10 pointer-events-none">⭐</div>

                    <h3 className="font-black text-xl text-white mb-2 leading-tight">Reto de clásicos</h3>
                    <p className="text-sm text-white/90 mb-6 leading-relaxed">
                        Predecí el resultado de los 5 clásicos de la fecha. Si acertás 3 o más ganás el <span className="font-bold whitespace-nowrap bg-black/20 px-2 py-0.5 rounded-md">Badge Oráculo</span> y +500 XP.
                    </p>

                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-white mb-1">
                            <span>{predictedCount} de 5 listos</span>
                            <span>{Math.round((predictedCount / 5) * 100)}%</span>
                        </div>
                        <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-amber-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${(predictedCount / 5) * 100}%` }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                            />
                        </div>
                    </div>
                </div>

                {LIVE_CONTESTS.map(match => {
                    const currentPred = predictions[match.id]
                    return (
                        <div
                            key={match.id}
                            className="min-w-[280px] rounded-[24px] p-5 shrink-0 snap-center border border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col shadow-sm"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    {match.hora}
                                </span>
                            </div>

                            <div className="flex items-center justify-between mb-6 px-2 text-sm font-black">
                                <span className="w-[40%] text-right truncate">{match.local}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">VS</span>
                                <span className="w-[40%] text-left truncate">{match.visitante}</span>
                            </div>

                            <div className="flex gap-2 h-11 mt-auto">
                                <button
                                    onClick={() => handlePredict(match.id, 'L')}
                                    className={`flex-1 rounded-xl text-xs font-bold transition-all border
                                        ${currentPred === 'L' ? 'bg-[#10b981] text-white border-[#10b981]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-white/20'}
                                    `}
                                >L</button>
                                <button
                                    onClick={() => handlePredict(match.id, 'E')}
                                    className={`flex-1 rounded-xl text-xs font-bold transition-all border
                                        ${currentPred === 'E' ? 'bg-[#ffb020] text-black border-[#ffb020]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-white/20'}
                                    `}
                                >E</button>
                                <button
                                    onClick={() => handlePredict(match.id, 'V')}
                                    className={`flex-1 rounded-xl text-xs font-bold transition-all border
                                        ${currentPred === 'V' ? 'bg-[#ff6b6b] text-white border-[#ff6b6b]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-white/20'}
                                    `}
                                >V</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
