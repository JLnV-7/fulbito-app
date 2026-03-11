'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Trophy, Gift, Target, Clock } from 'lucide-react'
import { GlassCard } from './ui/GlassCard'

const LIVE_CONTESTS = [
    { id: 101, local: 'Boca Juniors', visitante: 'River Plate', hora: 'Hoy, 21:00' },
    { id: 102, local: 'Racing Club', visitante: 'Independiente', hora: 'Hoy, 19:30' }
]

const PICKEM_OPTIONS = [
    { id: 'p1', name: 'M. Borja', team: 'River', imgUrl: 'https://api.sofascore.app/api/v1/player/345464/image' },
    { id: 'p2', name: 'E. Cavani', team: 'Boca', imgUrl: 'https://api.sofascore.app/api/v1/player/16362/image' }
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
                <div className="min-w-[320px] max-w-sm p-6 shrink-0 snap-center relative border-2 border-[var(--foreground)] bg-[var(--card-bg)] flex flex-col justify-center shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="absolute -right-4 -top-4 text-6xl opacity-10 pointer-events-none filter grayscale">⭐</div>

                    <h3 className="font-black text-xl text-[var(--foreground)] mb-2 capitalize italic tracking-tighter">Reto de clásicos</h3>
                    <p className="text-sm text-[var(--foreground)] mb-6 leading-tight border-l-2 border-[var(--foreground)] pl-3">
                        Predecí el resultado de los 5 clásicos de la fecha. Si acertás 3 o más ganás el <span className="font-black bg-[var(--foreground)] text-[var(--background)] px-1.5 py-0.5">Badge Oráculo</span> y +500 XP.
                    </p>

                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black capitalize tracking-widest text-[var(--foreground)] mb-1">
                            <span>{predictedCount} de 5 listos</span>
                            <span>{Math.round((predictedCount / 5) * 100)}%</span>
                        </div>
                        <div className="w-full bg-[var(--card-border)] h-3 overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                            <motion.div
                                className="h-full bg-[var(--foreground)]"
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
                            className="min-w-[280px] p-5 shrink-0 snap-center flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)]"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 rounded-full capitalize tracking-wider">
                                    {match.hora}
                                </span>
                            </div>

                            <div className="flex items-center justify-between mb-6 px-2 text-sm font-black">
                                <span className="w-[40%] text-right truncate">{match.local}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">VS</span>
                                <span className="w-[40%] text-left truncate">{match.visitante}</span>
                            </div>

                            <div className="flex gap-1.5 h-11 mt-auto">
                                <button
                                    onClick={() => handlePredict(match.id, 'L')}
                                    className={`flex-1 text-xs font-black transition-all border
                                        ${currentPred === 'L' ? 'bg-[#16a34a] text-white border-[#16a34a]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]'}
                                    `}
                                    style={{ borderRadius: 'var(--radius)' }}
                                >L</button>
                                <button
                                    onClick={() => handlePredict(match.id, 'E')}
                                    className={`flex-1 text-xs font-black transition-all border
                                        ${currentPred === 'E' ? 'bg-[#d97706] text-white border-[#d97706]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]'}
                                    `}
                                    style={{ borderRadius: 'var(--radius)' }}
                                >E</button>
                                <button
                                    onClick={() => handlePredict(match.id, 'V')}
                                    className={`flex-1 text-xs font-black transition-all border
                                        ${currentPred === 'V' ? 'bg-[#dc2626] text-white border-[#dc2626]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]'}
                                    `}
                                    style={{ borderRadius: 'var(--radius)' }}
                                >V</button>
                            </div>
                        </div>
                    )
                })}

                {/* PICK'EM RAPIDO CARD */}
                <div className="min-w-[280px] p-5 shrink-0 snap-center border-2 border-[var(--foreground)] bg-[var(--card-bg)] flex flex-col relative overflow-visible mt-8" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 grayscale scale-125"><Target size={40} /></div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-[var(--background)] bg-[var(--foreground)] px-2.5 py-1 capitalize tracking-widest italic">
                            Pick'em Rápido
                        </span>
                    </div>
                    <h4 className="font-black text-sm mb-1 capitalize italic tracking-tighter">¿Quién será la Figura?</h4>
                    <p className="text-[11px] text-[var(--text-muted)] mb-4 font-bold border-l border-[var(--card-border)] pl-2">Mejor SofaScore de la fecha.</p>

                    <div className="flex gap-2 h-20 mt-auto z-10 pt-4 relative">
                        {PICKEM_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setPickem(opt.id)}
                                className={`flex flex-col items-center justify-end flex-1 text-xs font-black transition-all border relative pb-1
                                    ${pickem === opt.id ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]'}
                                `}
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                {/* Img out of bounds top overlay */}
                                <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 w-[70px] h-[70px] transition-transform duration-300 origin-bottom grayscale
                                                ${pickem === opt.id ? 'scale-[1.15] grayscale-0' : 'scale-100 hover:scale-[1.1]'}`}>
                                    <Image
                                        src={opt.imgUrl}
                                        alt={opt.name}
                                        fill
                                        className="object-contain"
                                        sizes="70px"
                                        unoptimized
                                    />
                                </div>
                                <span className={`text-[10px] truncate w-full px-1 text-center font-black z-10 relative ${pickem === opt.id ? 'text-[var(--background)]' : 'text-[var(--text-muted)]'}`}>{opt.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* BEST BALL SEMANAL CARD */}
                <div className="min-w-[280px] p-5 shrink-0 snap-center border border-[var(--card-border)] bg-[var(--card-bg)] flex flex-col relative overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="absolute top-0 right-0 p-3 opacity-10 grayscale"><Trophy size={40} /></div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-[var(--foreground)] bg-[var(--card-border)] px-2.5 py-1 capitalize tracking-widest italic">
                            Best Ball Semanal
                        </span>
                    </div>
                    <h4 className="font-black text-sm mb-1 capitalize italic tracking-tighter">Goleada de la Fecha</h4>
                    <p className="text-[11px] text-[var(--text-muted)] mb-4 font-bold">¿Quién marcará más goles hoy?</p>

                    <div className="flex flex-col gap-1.5 mt-auto z-10 w-full">
                        {BESTBALL_OPTIONS.map(team => (
                            <button
                                key={team.id}
                                onClick={() => setBestBall(team.id)}
                                className={`flex items-center justify-between w-full h-10 px-4 text-xs font-black transition-all border
                                    ${bestBall === team.id ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]' : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]'}
                                `}
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                <span>{team.name}</span>
                                <span className={`text-[10px] font-black ${bestBall === team.id ? 'text-[var(--background)]' : 'text-[var(--foreground)]'}`}>{team.odds}</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
