// src/components/TablaContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TeamLogo } from '@/components/TeamLogo'
import { PosicionesSkeleton } from '@/components/skeletons/PosicionesSkeleton'
import { fetchStandingsAction } from '@/app/actions/football'
import type { ApiStanding } from '@/types/api'

interface TeamStanding {
    position: number
    team: string
    logo: string
    played: number
    won: number
    draw: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    goalDiff: number
    points: number
    form: string[]
}

const LIGAS_POSICIONES = ['Liga Profesional', 'Primera Nacional', 'La Liga', 'Premier League'] as const

interface TablaContentProps {
    ligaExterna?: string
    compact?: boolean
}

export function TablaContent({ ligaExterna, compact }: TablaContentProps) {
    const [ligaInterna, setLigaInterna] = useState<string>('Liga Profesional')
    const [standings, setStandings] = useState<TeamStanding[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const liga = ligaExterna || ligaInterna

    useEffect(() => {
        const fetchStandings = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await fetchStandingsAction(liga)
                const adaptedStandings: TeamStanding[] = data.map((item: ApiStanding) => ({
                    position: item.rank,
                    team: item.team.name,
                    logo: item.team.logo,
                    played: item.all.played,
                    won: item.all.win,
                    draw: item.all.draw,
                    lost: item.all.lose,
                    goalsFor: item.all.goals.for,
                    goalsAgainst: item.all.goals.against,
                    goalDiff: item.goalsDiff,
                    points: item.points,
                    form: item.form ? item.form.split('').slice(-5) : []
                }))

                // Deduplicate by team name (keep first occurrence), aggressive normalization for accents
                const seen = new Set<string>()
                const deduped = adaptedStandings.filter(t => {
                    const key = t.team.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })

                setStandings(deduped)
            } catch (err: any) {
                console.error('Error fetching standings:', err)
                setError('No se pudieron cargar las posiciones')
            } finally {
                setLoading(false)
            }
        }
        fetchStandings()
    }, [liga])

    const getFormColor = (result: string) => {
        switch (result) {
            case 'W': return 'bg-[#16a34a] text-white'
            case 'D': return 'bg-[#6b7280] text-white'
            case 'L': return 'bg-[#dc2626] text-white'
            default: return 'bg-[var(--card-border)]'
        }
    }

    const getPositionStyle = (pos: number) => {
        if (pos <= 4) return 'text-[#16a34a]'
        if (pos <= 6) return 'text-[#2563eb]'
        if (pos >= 26) return 'text-[#dc2626]'
        return ''
    }

    return (
        <div>
            {/* Selector de Liga interno (solo si no viene de afuera) */}
            {!ligaExterna && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
                    {LIGAS_POSICIONES.map(ligaName => (
                        <button
                            key={ligaName}
                            onClick={() => setLigaInterna(ligaName)}
                            className={`px-3 py-1.5 border text-[10px] font-black capitalize tracking-widest whitespace-nowrap transition-all
                                ${ligaInterna === ligaName
                                    ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)]'
                                    : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {ligaName}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <PosicionesSkeleton />
            ) : error ? (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-8 text-center">
                    <span className="text-4xl">❌</span>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{error}</p>
                </div>
            ) : (
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-x-auto">
                        <table className="classic-table">
                            <thead className="text-[10px] text-[var(--text-muted)] border-b border-[var(--card-border)]">
                                <tr>
                                    <th className="w-8 font-normal">#</th>
                                    <th className="text-left font-normal">Equipo</th>
                                    <th className="font-normal">PJ</th>
                                    <th className="font-normal">G</th>
                                    <th className="font-normal">E</th>
                                    <th className="font-normal">P</th>
                                    <th className="hidden sm:table-cell font-normal">GF</th>
                                    <th className="hidden sm:table-cell font-normal">GC</th>
                                    <th className="font-normal">DG</th>
                                    <th className="bg-[var(--background)] font-bold text-[var(--foreground)]">Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((team, idx) => (
                                    <tr
                                        key={team.team}
                                        className="hover:bg-[var(--hover-bg)] transition-colors"
                                    >
                                        <td className={`font-mono text-xs ${getPositionStyle(team.position)}`}>
                                            {team.position}
                                        </td>
                                        <td className="text-left py-2">
                                            <div className="flex items-center gap-2">
                                                <TeamLogo src={team.logo} teamName={team.team} size={16} />
                                                <span className="font-bold whitespace-nowrap text-xs">{team.team}</span>
                                            </div>
                                        </td>
                                        <td className="font-mono text-[11px] text-[var(--text-muted)]">{team.played}</td>
                                        <td className="font-mono text-[11px] text-[#16a34a]">{team.won}</td>
                                        <td className="font-mono text-[11px] text-[var(--text-muted)]">{team.draw}</td>
                                        <td className="font-mono text-[11px] text-[#dc2626]">{team.lost}</td>
                                        <td className="font-mono text-[11px] text-[var(--text-muted)] hidden sm:table-cell">{team.goalsFor}</td>
                                        <td className="font-mono text-[11px] text-[var(--text-muted)] hidden sm:table-cell">{team.goalsAgainst}</td>
                                        <td className={`font-mono text-[11px] ${team.goalDiff >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                                            {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                                        </td>
                                        <td className="font-mono font-bold text-sm bg-[var(--background)]">
                                            {team.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Leyenda Simple */}
                        <div className="px-4 py-2 bg-[var(--background)] border-t border-[var(--card-border)] flex flex-wrap gap-4 text-[9px] text-[var(--text-muted)] font-black capitalize">
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-[#16a34a]"></span>
                                <span>Libertadores</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-[#2563eb]"></span>
                                <span>Sudamericana</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-[#dc2626]"></span>
                                <span>Descenso</span>
                            </div>
                        </div>
                    </div>
            )}

            <div className="mt-4 text-center text-[10px] text-[var(--text-muted)]">
                Datos actualizados via football-data.org · Cada 5 min
            </div>
        </div>
    )
}
