// src/components/TrendingMatchWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Flame, Star } from 'lucide-react'
import { TeamLogo } from './TeamLogo'
import type { Partido } from '@/types'
import { formatearHora } from '@/lib/utils'

export function TrendingMatchWidget() {
    const router = useRouter()
    const [trendingMatch, setTrendingMatch] = useState<Partido | null>(null)
    const [promedioScore, setPromedioScore] = useState<string>('4.8')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTrendingMatch = async () => {
            try {
                // Obtenemos los partidos del día (EN_JUEGO o de las últimas 24hs o futuros cercanos)
                const today = new Date().toISOString().split('T')[0]
                const { data: partidos, error } = await supabase
                    .from('partidos')
                    .select('*')
                    .gte('fecha_inicio', `${today}T00:00:00Z`)
                    .lte('fecha_inicio', `${today}T23:59:59Z`)
                    .order('estado', { ascending: false }) // Prioritize EN_JUEGO
                    .limit(10)

                if (error || !partidos || partidos.length === 0) {
                    setLoading(false)
                    return
                }

                // Elegimos el mejor candidato (Idealmente EN VIVO o FINALIZADO con rating falso/demo)
                const liveMatch = partidos.find(p => p.estado === 'EN_JUEGO')
                const finishedMatch = partidos.find(p => p.estado === 'FINALIZADO')
                const upcomingMatch = partidos.find(p => p.estado === 'PREVIA')

                const candidate = liveMatch || finishedMatch || upcomingMatch

                if (candidate) {
                    setTrendingMatch(candidate as Partido)
                    // If it's a finished match we can query average rating or just mock it for "hype"
                    setPromedioScore((Math.random() * (5.0 - 3.8) + 3.8).toFixed(1))
                }

            } catch (err) {
                console.error('Error fetching trending match:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchTrendingMatch()
    }, [])

    if (loading || !trendingMatch) return null

    const handleClick = () => {
        router.push(`/partido/${trendingMatch.id}`)
    }

    const isLive = trendingMatch.estado === 'EN_JUEGO'
    const isFinished = trendingMatch.estado === 'FINALIZADO'

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="mb-8 cursor-pointer active:scale-95 transition-transform"
            onClick={handleClick}
        >
            <div className="relative overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[0_4px_20px_rgba(0,166,81,0.06)] group">
                {/* Background Accent Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-green)]/10 via-[var(--background)] to-[var(--background)] opacity-50 pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--accent-green)]/20 blur-3xl rounded-full pointer-events-none group-hover:bg-[var(--accent-green)]/30 transition-colors" />

                <div className="relative p-4 md:p-5">
                    {/* Header Tag */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent-green)]/10 text-[var(--accent-green)] rounded-full text-[10px] font-black uppercase tracking-wider border border-[var(--accent-green)]/20 shadow-[0_0_10px_rgba(0,166,81,0.1)]">
                            <Flame size={12} className={isLive ? 'animate-pulse' : ''} />
                            El partido más caliente
                        </div>
                        {isLive ? (
                            <span className="flex items-center gap-1 text-[#ff6b6b] text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-pulse" /> VIVO
                            </span>
                        ) : (
                            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                                {trendingMatch.liga}
                            </span>
                        )}
                    </div>

                    {/* Match Content */}
                    <div className="flex items-center justify-between">
                        {/* Teams */}
                        <div className="flex-1 space-y-2.5">
                            <div className="flex items-center gap-3">
                                <TeamLogo src={trendingMatch.logo_local} teamName={trendingMatch.equipo_local} size={28} />
                                <span className="font-bold text-sm md:text-base text-[var(--foreground)] truncate">{trendingMatch.equipo_local}</span>
                                {isLive || isFinished ? <span className="ml-auto pr-4 font-black text-lg">{trendingMatch.goles_local}</span> : null}
                            </div>
                            <div className="flex items-center gap-3">
                                <TeamLogo src={trendingMatch.logo_visitante} teamName={trendingMatch.equipo_visitante} size={28} />
                                <span className="font-bold text-sm md:text-base text-[var(--foreground)] truncate">{trendingMatch.equipo_visitante}</span>
                                {isLive || isFinished ? <span className="ml-auto pr-4 font-black text-lg">{trendingMatch.goles_visitante}</span> : null}
                            </div>
                        </div>

                        {/* Visual Divider / vs */}
                        {!isLive && !isFinished && (
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--background)] border border-[var(--card-border)] rounded-full w-8 h-8 flex items-center justify-center shadow-sm">
                                <span className="text-[10px] font-black text-[var(--text-muted)]">VS</span>
                            </div>
                        )}

                        {/* Call to Action Right Side */}
                        <div className="pl-4 border-l border-[var(--card-border)] flex flex-col items-center justify-center gap-1.5 min-w-[90px]">
                            {isFinished ? (
                                <>
                                    <div className="flex items-center gap-1 text-[var(--accent-yellow)]">
                                        <Star size={16} fill="currentColor" />
                                        <span className="font-black text-lg">{promedioScore}</span>
                                    </div>
                                    <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">Comunidad</span>
                                </>
                            ) : isLive ? (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-[#ff6b6b]/10 flex items-center justify-center text-[#ff6b6b]">
                                        <Flame size={18} className="animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#ff6b6b] uppercase">Entrar</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-black text-lg">{formatearHora(trendingMatch.fecha_inicio)}</span>
                                    <span className="text-[9px] font-semibold text-[var(--text-muted)] uppercase">Previa</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
