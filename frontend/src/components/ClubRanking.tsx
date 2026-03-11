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
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
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
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-8 text-center">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-xs text-[var(--text-muted)] italic">
                    Todavía no hay suficientes reseñas
                </p>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--card-border)]">
                <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center justify-between">
                    Ranking de Clubes
                    <span className="text-[10px] text-[var(--text-muted)] font-normal">Top 20</span>
                </h3>
            </div>

            <table className="w-full text-left border-collapse">
                <thead className="bg-[var(--background)]">
                    <tr className="border-b border-[var(--card-border)]">
                        <th className="px-4 py-2 text-[10px] font-bold capitalize text-[var(--text-muted)] w-10 text-center">#</th>
                        <th className="px-4 py-2 text-[10px] font-bold capitalize text-[var(--text-muted)]">Equipo</th>
                        <th className="px-4 py-2 text-[10px] font-bold capitalize text-[var(--text-muted)] text-right">Logs</th>
                        <th className="px-4 py-2 text-[10px] font-bold capitalize text-[var(--text-muted)] text-center">Rating</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)]">
                    {clubs.map((club, idx) => (
                        <tr key={club.equipo} className="hover:bg-[var(--background)] transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-center text-[var(--text-muted)] w-10">
                                {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    {club.logo && (
                                        <img src={club.logo} alt="" className="w-6 h-6 object-contain" />
                                    )}
                                    <span className="text-sm font-semibold truncate max-w-[120px]">{club.equipo}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-[var(--text-muted)] text-right">
                                {club.total_logs}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span
                                    className="inline-block px-2 py-1 text-xs font-bold text-white rounded-lg shadow-sm"
                                    style={{ backgroundColor: getRatingColor(club.avg_rating) }}
                                >
                                    {club.avg_rating.toFixed(1)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
