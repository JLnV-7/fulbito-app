'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, TrendingUp, Users, MessageSquare } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TeamLogo } from '@/components/TeamLogo'
import { hapticFeedback } from '@/lib/helpers'

interface ComunidadContentProps {
    ligaExterna: string
}

interface RankedItem {
    name: string
    id?: string
    logo?: string
    rating: number
    count: number
}

export function ComunidadContent({ ligaExterna }: ComunidadContentProps) {
    const [topTeams, setTopTeams] = useState<RankedItem[]>([])
    const [topPlayers, setTopPlayers] = useState<RankedItem[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState<'teams' | 'players' | 'projections'>('teams')

    useEffect(() => {
        const fetchComunidadData = async () => {
            setLoading(true)
            try {
                // 1. Fetch Top Teams from match_logs
                const { data: logs } = await supabase
                    .from('match_logs')
                    .select('equipo_local, equipo_visitante, logo_local, logo_visitante, rating_partido')
                    .eq('liga', ligaExterna)

                if (logs) {
                    const teamMap = new Map<string, { total: number; count: number; logo?: string }>()
                    logs.forEach(log => {
                        const rating = Number(log.rating_partido) || 0
                        if (log.equipo_local) {
                            const cur = teamMap.get(log.equipo_local) || { total: 0, count: 0 }
                            cur.total += rating
                            cur.count++
                            if (log.logo_local) cur.logo = log.logo_local
                            teamMap.set(log.equipo_local, cur)
                        }
                        if (log.equipo_visitante) {
                            const cur = teamMap.get(log.equipo_visitante) || { total: 0, count: 0 }
                            cur.total += rating
                            cur.count++
                            if (log.logo_visitante) cur.logo = log.logo_visitante
                            teamMap.set(log.equipo_visitante, cur)
                        }
                    })
                    const sortedTeams = Array.from(teamMap.entries())
                        .map(([name, data]) => ({
                            name,
                            logo: data.logo,
                            rating: data.total / data.count,
                            count: data.count
                        }))
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 5)
                    setTopTeams(sortedTeams)
                }

                // 2. Fetch Top Players from match_log_player_ratings joined with match_logs
                // Note: Using !inner filter for liga
                const { data: playerRatings } = await supabase
                    .from('match_log_player_ratings')
                    .select(`
                        player_name,
                        rating,
                        match_logs!inner(liga)
                    `)
                    .eq('match_logs.liga', ligaExterna)

                if (playerRatings) {
                    const playerMap = new Map<string, { total: number; count: number }>()
                    playerRatings.forEach((pr: any) => {
                        const cur = playerMap.get(pr.player_name) || { total: 0, count: 0 }
                        cur.total += Number(pr.rating) || 0
                        cur.count++
                        playerMap.set(pr.player_name, cur)
                    })
                    const sortedPlayers = Array.from(playerMap.entries())
                        .map(([name, data]) => ({
                            name,
                            rating: data.total / data.count,
                            count: data.count
                        }))
                        .sort((a, b) => b.rating - a.rating)
                        .slice(0, 5)
                    setTopPlayers(sortedPlayers)
                }

            } catch (err) {
                console.error('Error fetching comunidad data:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchComunidadData()
    }, [ligaExterna])

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Summary Stats - Flat Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-[var(--card-bg)] p-4 border border-[var(--card-border)] text-center rounded-2xl">
                    <p className="text-[10px] text-[var(--text-muted)] capitalize font-bold tracking-tight mb-1">Comunidad</p>
                    <p className="text-sm font-bold capitalize">Activa</p>
                </div>
                <div className="bg-[var(--card-bg)] p-4 border border-[var(--card-border)] text-center rounded-2xl">
                    <p className="text-[10px] text-[var(--text-muted)] capitalize font-bold tracking-tight mb-1">Promedio Gral</p>
                    <p className="text-sm font-bold capitalize">4.2 / 10</p>
                </div>
            </div>

            {/* Sections Selector - Flat Bar */}
            <div className="flex border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden rounded-2xl">
                {(['teams', 'players', 'projections'] as const).map(section => (
                    <button
                        key={section}
                        onClick={() => { hapticFeedback(5); setActiveSection(section); }}
                        className={`flex-1 py-4 text-[10px] font-bold capitalize tracking-tight transition-colors
                            ${activeSection === section
                                ? 'bg-[var(--foreground)] text-[var(--background)]'
                                : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'}`}
                    >
                        {section === 'teams' ? 'Equipos' : section === 'players' ? 'Jugadores' : 'Tendencias'}
                    </button>
                ))}
            </div>

            <div className="min-h-[300px]">
                {activeSection === 'teams' && (
                    <RankingList items={topTeams} title="TOP EQUIPOS" color="var(--foreground)" />
                )}

                {activeSection === 'players' && (
                    <>
                        {topPlayers.length > 0 ? (
                            <RankingList items={topPlayers} title="TOP JUGADORES" color="var(--foreground)" isPlayer />
                        ) : (
                            <EmptyState message="Sin votos suficientes." />
                        )}
                    </>
                )}

                {activeSection === 'projections' && (
                    <div className="py-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] border-dashed rounded-3xl">
                        <TrendingUp size={30} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-xs font-bold capitalize tracking-tight mb-2">Crowd Wisdom</h3>
                        <p className="text-[10px] text-[var(--text-muted)] max-w-xs mx-auto mb-4 font-medium capitalize tracking-tight">
                            Analizando tendencias globales de la comunidad...
                        </p>
                        <div className="inline-block px-3 py-1 bg-[var(--background)] border border-[var(--card-border)] rounded-full">
                            <span className="text-[8px] font-bold capitalize tracking-tight">Procesando Data</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function RankingList({ items, title, titleColor = 'var(--foreground)', isPlayer = false }: { items: RankedItem[], title: string, color?: string, isPlayer?: boolean, titleColor?: string }) {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden rounded-3xl">
            <div className="px-5 py-3 border-b border-[var(--card-border)] bg-[var(--background)] flex justify-between items-center">
                <h3 className="text-[10px] font-bold capitalize tracking-tight">
                    {title}
                </h3>
                <span className="text-[8px] text-[var(--text-muted)] capitalize font-bold tracking-tight">Líderes de Opinión</span>
            </div>

            <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-[var(--card-border)]">
                    {items.map((item, idx) => (
                        <tr key={item.name} className="hover:bg-[var(--background)] transition-colors">
                            <td className="px-5 py-4 text-xs font-bold text-[var(--text-muted)] w-8 text-center">{idx + 1}</td>
                            <td className="px-2 py-4">
                                <div className="flex items-center gap-3">
                                    {!isPlayer && item.logo && (
                                        <div className="w-8 h-8 flex items-center justify-center bg-[var(--background)] border border-[var(--card-border)] rounded-lg">
                                            <img src={item.logo} alt="" className="w-6 h-6 object-contain opacity-80" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold capitalize tracking-tight truncate">{item.name}</p>
                                        <p className="text-[8px] text-[var(--text-muted)] font-bold capitalize tracking-tight">{item.count} Reseñas</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-5 py-4 text-right">
                                <span className="inline-block px-3 py-1 bg-[var(--accent-green)] text-black text-[10px] font-bold rounded-full">
                                    {item.rating.toFixed(1)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] border-dashed" style={{ borderRadius: 'var(--radius)' }}>
            <p className="text-[10px] text-[var(--text-muted)] font-black capitalize tracking-widest">{message}</p>
        </div>
    )
}
