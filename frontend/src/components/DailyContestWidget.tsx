'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Gift, Target, Clock } from 'lucide-react'

const LIVE_CONTESTS = [
    { id: 101, local: 'Boca Juniors', visitante: 'River Plate', hora: 'Hoy, 21:00' },
    { id: 102, local: 'Racing Club', visitante: 'Independiente', hora: 'Hoy, 19:30' }
]

const PICKEM_OPTIONS = [
    { id: 'p1', name: 'M. Borja', team: 'River', img: '🇨🇴' },
    { id: 'p2', name: 'E. Cavani', team: 'Boca', img: '🇺🇾' }
]

const BESTBALL_OPTIONS = [
    { id: 't1', name: 'Talleres', odds: '+3.5', color: '#002244' },
    { id: 't2', name: 'Vélez', odds: '+2.5', color: '#00529F' }
]

export function DailyContestWidget() {
    const [predictions, setPredictions] = useState<Record<number, 'L' | 'E' | 'V'>>({})
    const [pickem, setPickem] = useState<string | null>(null)
    const [bestBall, setBestBall] = useState<string | null>(null)

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

                {/* PICK'EM RAPIDO CARD */}
                <div className="min-w-[280px] rounded-[24px] p-5 shrink-0 snap-center border border-[#8b5cf6]/30 bg-gradient-to-b from-[#8b5cf6]/10 to-[var(--card-bg)] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><Target size={40} /></div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-[#8b5cf6] bg-[#8b5cf6]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Pick'em Rápido
                        </span>
                    </div>
                    <h4 className="font-black text-sm mb-1 leading-tight">¿Quién será la Figura?</h4>
                    <p className="text-[11px] text-[var(--text-muted)] mb-4">Elegí al jugador con mejor SofaScore de la fecha.</p>

                    <div className="flex gap-2 h-14 mt-auto z-10">
                        {PICKEM_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setPickem(opt.id)}
                                className={`flex flex-col items-center justify-center flex-1 rounded-xl text-xs font-bold transition-all border
                                    ${pickem === opt.id ? 'bg-[#8b5cf6] text-white border-[#8b5cf6] scale-105 shadow-md shadow-[#8b5cf6]/20' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[#8b5cf6]/30'}
                                `}
                            >
                                <span className="text-xl mb-0.5">{opt.img}</span>
                                <span className="text-[9px] truncate w-full px-1">{opt.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* BEST BALL SEMANAL CARD */}
                <div className="min-w-[280px] rounded-[24px] p-5 shrink-0 snap-center border border-[#ec4899]/30 bg-gradient-to-b from-[#ec4899]/10 to-[var(--card-bg)] flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-20"><Trophy size={40} /></div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-[#ec4899] bg-[#ec4899]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Best Ball Semanal
                        </span>
                    </div>
                    <h4 className="font-black text-sm mb-1 leading-tight">Goleada de la Fecha</h4>
                    <p className="text-[11px] text-[var(--text-muted)] mb-4">¿Qué equipo marcará más goles este finde?</p>

                    <div className="flex flex-col gap-2 mt-auto z-10 w-full">
                        {BESTBALL_OPTIONS.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setBestBall(team.id)}
                                className={`flex items-center justify-between w-full h-10 px-4 rounded-xl text-xs font-bold transition-all border
                                    ${bestBall === team.id ? 'bg-[#ec4899] text-white border-[#ec4899] shadow-md shadow-[#ec4899]/20' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[#ec4899]/30'}
                                `}
                            >
                                <span>{team.name}</span>
                                <span className={`text-[10px] font-black opacity-60 ${bestBall === team.id ? 'text-white' : 'text-[#ec4899]'}`}>{team.odds}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
