// src/components/ClubRanking.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface ClubData {
    equipo: string
    avg_rating: number
    total_logs: number
    logo?: string
}

export function ClubRanking() {
    const [clubs, setClubs] = useState<ClubData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                // Get match logs grouped by equipo_local and equipo_visitante teams
                const { data: logs } = await supabase
                    .from('match_logs')
                    .select('equipo_local, equipo_visitante, rating, logo_local, logo_visitante')

                if (!logs || logs.length === 0) {
                    setLoading(false)
                    return
                }

                // Aggregate ratings per team
                const teamMap = new Map<string, { total: number; count: number; logo?: string }>()

                logs.forEach(log => {
                    // Local team
                    if (log.equipo_local) {
                        const current = teamMap.get(log.equipo_local) || { total: 0, count: 0 }
                        current.total += log.rating || 0
                        current.count++
                        if (log.logo_local) current.logo = log.logo_local
                        teamMap.set(log.equipo_local, current)
                    }

                    // Visitante team
                    if (log.equipo_visitante) {
                        const current = teamMap.get(log.equipo_visitante) || { total: 0, count: 0 }
                        current.total += log.rating || 0
                        current.count++
                        if (log.logo_visitante) current.logo = log.logo_visitante
                        teamMap.set(log.equipo_visitante, current)
                    }
                })

                // Convert to array and sort
                const ranking: ClubData[] = Array.from(teamMap.entries())
                    .filter(([_, data]) => data.count >= 2) // Min 2 logs
                    .map(([equipo, data]) => ({
                        equipo,
                        avg_rating: data.total / data.count,
                        total_logs: data.count,
                        logo: data.logo,
                    }))
                    .sort((a, b) => b.avg_rating - a.avg_rating)
                    .slice(0, 20) // Top 20

                setClubs(ranking)
            } catch (err) {
                console.error('Error fetching club ranking:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchRanking()
    }, [])

    const getMedal = (index: number) => {
        if (index === 0) return '🥇'
        if (index === 1) return '🥈'
        if (index === 2) return '🥉'
        return `${index + 1}`
    }

    const getRatingColor = (rating: number) => {
        if (rating >= 8) return '#10b981'
        if (rating >= 6) return '#fbbf24'
        if (rating >= 4) return '#f59e0b'
        return '#ef4444'
    }

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6">
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-12 bg-[var(--background)] rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    if (clubs.length === 0) {
        return (
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-8 text-center">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-sm text-[var(--text-muted)]">
                    Todavía no hay suficientes reseñas para armar el ranking
                </p>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--card-border)]">
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                    🏆 Ranking de Clubes
                    <span className="text-[10px] bg-[var(--background)] px-2 py-0.5 rounded-full font-normal">
                        por la comunidad
                    </span>
                </h3>
            </div>

            <div className="divide-y divide-[var(--card-border)]">
                {clubs.map((club, idx) => (
                    <motion.div
                        key={club.equipo}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--background)] transition-colors"
                    >
                        {/* Rank */}
                        <span className={`text-sm font-bold w-7 text-center ${idx < 3 ? 'text-lg' : 'text-[var(--text-muted)]'}`}>
                            {getMedal(idx)}
                        </span>

                        {/* Logo */}
                        {club.logo ? (
                            <img src={club.logo} alt={club.equipo} className="w-7 h-7 object-contain" />
                        ) : (
                            <div className="w-7 h-7 bg-[var(--background)] rounded-full flex items-center justify-center text-xs">
                                ⚽
                            </div>
                        )}

                        {/* Team name */}
                        <span className="flex-1 text-sm font-bold truncate">{club.equipo}</span>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[var(--text-muted)]">
                                {club.total_logs} {club.total_logs === 1 ? 'log' : 'logs'}
                            </span>
                            <div
                                className="px-2.5 py-1 rounded-lg text-xs font-bold text-white min-w-[40px] text-center"
                                style={{ backgroundColor: getRatingColor(club.avg_rating) }}
                            >
                                {club.avg_rating.toFixed(1)}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
