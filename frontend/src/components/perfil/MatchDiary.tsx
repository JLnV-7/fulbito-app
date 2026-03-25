// src/components/perfil/MatchDiary.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { TeamLogo } from '@/components/TeamLogo'
import { PenLine, Star, TrendingUp } from 'lucide-react'

interface MatchLogEntry {
    id: string
    equipo_local: string
    equipo_visitante: string
    logo_local?: string
    logo_visitante?: string
    goles_local?: number
    goles_visitante?: number
    liga?: string
    fecha_partido: string
    rating_partido: number
    match_type?: string
    mood?: string
    review_text?: string
    created_at: string
}

const MOOD_MAP: Record<string, string> = {
    euforia: '🤩',
    contento: '😊',
    indiferente: '😐',
    caliente: '😤',
    destruido: '😢',
    locura: '🤯',
}

interface MatchDiaryProps {
    userId: string
    isOwnProfile?: boolean
    limit?: number
}

export function MatchDiary({ userId, isOwnProfile = false, limit = 5 }: MatchDiaryProps) {
    const [logs, setLogs] = useState<MatchLogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [diaryStats, setDiaryStats] = useState({ total: 0, avgRating: 0, thisMonth: 0 })

    useEffect(() => {
        const fetchDiary = async () => {
            try {
                const { data, error } = await supabase
                    .from('match_logs')
                    .select('id, equipo_local, equipo_visitante, logo_local, logo_visitante, goles_local, goles_visitante, liga, fecha_partido, rating_partido, match_type, mood, review_text, created_at')
                    .eq('user_id', userId)
                    .eq('is_private', false)
                    .order('created_at', { ascending: false })
                    .limit(limit)

                if (data) {
                    setLogs(data)
                }

                // Fetch stats
                const { data: allLogs } = await supabase
                    .from('match_logs')
                    .select('rating_partido, created_at')
                    .eq('user_id', userId)

                if (allLogs && allLogs.length > 0) {
                    const now = new Date()
                    const thisMonth = allLogs.filter(l => {
                        const d = new Date(l.created_at)
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
                    }).length

                    const avg = allLogs.reduce((sum, l) => sum + (l.rating_partido || 0), 0) / allLogs.length

                    setDiaryStats({
                        total: allLogs.length,
                        avgRating: Math.round(avg * 10) / 10,
                        thisMonth,
                    })
                }
            } catch (err) {
                console.error('Error fetching diary:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDiary()
    }, [userId, limit])

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-[var(--hover-bg)] rounded w-32 mb-3" />
                <div className="space-y-2">
                    <div className="h-16 bg-[var(--hover-bg)] rounded-xl" />
                    <div className="h-16 bg-[var(--hover-bg)] rounded-xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            {/* Header with stats */}
            <div className="p-4 border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        📓 Diario de Partidos
                    </h3>
                    {isOwnProfile && (
                        <Link
                            href="/log"
                            className="text-[10px] font-black capitalize tracking-widest text-[var(--accent)] hover:underline flex items-center gap-1"
                        >
                            <PenLine size={12} />
                            Loguear
                        </Link>
                    )}
                </div>

                {/* Mini stats row */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-[var(--background)] rounded-xl">
                        <div className="text-lg font-black">{diaryStats.total}</div>
                        <div className="text-[9px] text-[var(--text-muted)] font-bold capitalize tracking-wider">Partidos</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--background)] rounded-xl">
                        <div className="text-lg font-black flex items-center justify-center gap-0.5">
                            {diaryStats.avgRating}
                            <Star size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-bold capitalize tracking-wider">Promedio</div>
                    </div>
                    <div className="text-center p-2 bg-[var(--background)] rounded-xl">
                        <div className="text-lg font-black flex items-center justify-center gap-0.5">
                            {diaryStats.thisMonth}
                            <TrendingUp size={12} className="text-[var(--accent)]" />
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)] font-bold capitalize tracking-wider">Este mes</div>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            {logs.length === 0 ? (
                <div className="p-8 text-center">
                    <span className="text-3xl block mb-2">📓</span>
                    <p className="text-sm text-[var(--text-muted)]">
                        {isOwnProfile ? 'Todavía no logueaste ningún partido' : 'Sin partidos logueados'}
                    </p>
                    {isOwnProfile && (
                        <Link
                            href="/log"
                            className="inline-block mt-3 px-4 py-2 bg-[var(--foreground)] text-[var(--background)] text-xs font-black capitalize tracking-widest rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Loguear mi primer partido
                        </Link>
                    )}

                    {/* Example Mock */}
                    <div className="mt-8 text-left border-t border-[var(--card-border)] border-dashed pt-4 opacity-70">
                        <span className="text-[10px] font-black capitalize text-[var(--accent)] tracking-widest mb-2 block">Visualización de Ejemplo</span>
                        <div className="flex items-center gap-3 p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)] pointer-events-none">
                            <div className="flex flex-col items-center shrink-0">
                                <span className="text-base text-center w-full">🤯</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate">Boca Juniors 1-1 River Plate</div>
                                <div className="text-[10px] text-[var(--text-muted)]">Liga Profesional · 15 sep</div>
                            </div>
                            <div className="flex items-center gap-0.5 bg-[var(--hover-bg)] px-2 py-1 rounded-full border border-[var(--card-border)] shrink-0">
                                <Star size={10} className="text-[#f59e0b] fill-[#f59e0b]" />
                                <span className="text-xs font-black">9.5</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-[var(--card-border)]">
                    {logs.map((log, i) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                href={`/log/${log.id}`}
                                className="flex items-center gap-3 p-3 hover:bg-[var(--hover-bg)] transition-colors"
                            >
                                {/* Mini team logos */}
                                <div className="flex items-center -space-x-2 shrink-0">
                                    <TeamLogo src={log.logo_local} teamName={log.equipo_local} size={24} className="ring-2 ring-[var(--card-bg)]" />
                                    <TeamLogo src={log.logo_visitante} teamName={log.equipo_visitante} size={24} className="ring-2 ring-[var(--card-bg)]" />
                                </div>

                                {/* Match info */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold truncate">
                                        {log.equipo_local} {log.goles_local != null ? `${log.goles_local}-${log.goles_visitante}` : 'vs'} {log.equipo_visitante}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                        {log.liga && (
                                            <Link 
                                                href={`/buscar?q=${encodeURIComponent(log.liga)}`}
                                                className="hover:text-[var(--accent)] hover:underline transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {log.liga}
                                            </Link>
                                        )}
                                        {log.liga && <span>·</span>}
                                        {new Date(log.fecha_partido).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                    </div>
                                </div>

                                {/* Rating + Mood */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {log.mood && MOOD_MAP[log.mood] && (
                                        <span className="text-base">{MOOD_MAP[log.mood]}</span>
                                    )}
                                    <div className="flex items-center gap-0.5 bg-[var(--background)] px-2 py-1 rounded-full border border-[var(--card-border)]">
                                        <Star size={10} className="text-[#f59e0b] fill-[#f59e0b]" />
                                        <span className="text-xs font-black">{log.rating_partido}</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* See all link */}
            {logs.length > 0 && diaryStats.total > limit && (
                <Link
                    href="/feed"
                    className="block text-center py-3 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] border-t border-[var(--card-border)] transition-colors"
                >
                    Ver todos ({diaryStats.total}) →
                </Link>
            )}
        </div>
    )
}
