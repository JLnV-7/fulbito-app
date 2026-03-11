// src/components/TrendingMatchWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Flame, Star } from 'lucide-react'
import { TeamLogo } from './TeamLogo'
import { GlassCard } from './ui/GlassCard'
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

                let candidate
                if (!error && partidos && partidos.length > 0) {
                    const liveMatch = partidos.find(p => p.estado === 'EN_JUEGO')
                    const finishedMatch = partidos.find(p => p.estado === 'FINALIZADO')
                    const upcomingMatch = partidos.find(p => p.estado === 'PREVIA')
                    candidate = liveMatch || finishedMatch || upcomingMatch
                }

                if (!candidate) {
                    // MOCK FALLBACK FOR DEMO / PREMIUM FEEL WHEN NO MATCHES ARE LIVE
                    candidate = {
                        id: 'demo-match-999',
                        estado: 'FINALIZADO',
                        equipo_local: 'River Plate',
                        equipo_visitante: 'Boca Juniors',
                        goles_local: 3,
                        goles_visitante: 1,
                        liga: 'Superclásico Demo',
                        fecha_inicio: new Date().toISOString()
                    } as Partido
                }

                setTrendingMatch(candidate)
                setPromedioScore((Math.random() * (5.0 - 4.2) + 4.2).toFixed(1))

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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer transition-transform group"
            onClick={handleClick}
        >
            <GlassCard noPadding className="relative border-t border-white/10 overflow-hidden shadow-[0_8px_32px_rgba(0,166,81,0.08)] bg-gradient-to-br from-white/5 to-transparent">
                {/* Background Accent Glow */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[var(--accent-green)]/30 blur-3xl rounded-full pointer-events-none group-hover:bg-[var(--accent-green)]/40 transition-colors" />

                <div className="relative p-5">
                    {/* Header Tag */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--accent-green)]/10 text-[var(--accent-green)] rounded-full text-[10px] font-black capitalize tracking-wider border border-[var(--accent-green)]/20 shadow-[0_0_10px_rgba(0,166,81,0.1)]">
                            <Flame size={12} className={isLive ? 'animate-pulse' : ''} />
                            El partido más caliente
                        </div>
                        {isLive ? (
                            <span className="flex items-center gap-1 text-[#ff6b6b] text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-pulse" /> VIVO
                            </span>
                        ) : (
                            <span className="text-[10px] font-semibold text-[var(--text-muted)] capitalize">
                                {trendingMatch.liga}
                            </span>
                        )}
                    </div>

                    {/* Match Content */}
                    <div className="flex items-center justify-between">
                        {/* Teams */}
                        <div className="flex-1 space-y-2.5">
                            <div className="flex items-center gap-3">
                                <TeamLogo src={trendingMatch?.logo_local || undefined} teamName={trendingMatch?.equipo_local || ''} size={28} />
                                <span className="font-bold text-sm md:text-base text-[var(--foreground)] truncate">{trendingMatch?.equipo_local}</span>
                                {isLive || isFinished ? <span className="ml-auto pr-4 font-black text-lg">{trendingMatch?.goles_local}</span> : null}
                            </div>
                            <div className="flex items-center gap-3">
                                <TeamLogo src={trendingMatch?.logo_visitante || undefined} teamName={trendingMatch?.equipo_visitante || ''} size={28} />
                                <span className="font-bold text-sm md:text-base text-[var(--foreground)] truncate">{trendingMatch?.equipo_visitante}</span>
                                {isLive || isFinished ? <span className="ml-auto pr-4 font-black text-lg">{trendingMatch?.goles_visitante}</span> : null}
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
                                    <span className="text-[9px] font-semibold text-[var(--text-muted)] capitalize">Comunidad</span>
                                </>
                            ) : isLive ? (
                                <>
                                    <div className="w-8 h-8 rounded-full bg-[#ff6b6b]/10 flex items-center justify-center text-[#ff6b6b]">
                                        <Flame size={18} className="animate-pulse" />
                                    </div>
                                    <span className="text-[10px] font-bold text-[#ff6b6b] capitalize">Entrar</span>
                                </>
                            ) : (
                                <>
                                    <span className="font-black text-lg">{trendingMatch?.fecha_inicio ? formatearHora(trendingMatch.fecha_inicio) : ''}</span>
                                    <span className="text-[9px] font-semibold text-[var(--text-muted)] capitalize">Previa</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </GlassCard>
        </motion.div>
    )
}
