// src/components/TablaContent.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TeamLogo } from '@/components/TeamLogo'
import { ShareableCard } from '@/components/ShareableCard'
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
}

export function TablaContent({ ligaExterna }: TablaContentProps) {
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
                setStandings(adaptedStandings)
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
            case 'W': return 'bg-[#10b981] text-white'
            case 'D': return 'bg-[#6b7280] text-white'
            case 'L': return 'bg-[#ef4444] text-white'
            default: return 'bg-[var(--card-border)]'
        }
    }

    const getPositionStyle = (pos: number) => {
        if (pos <= 4) return 'text-[#10b981] font-black'
        if (pos <= 6) return 'text-[#3b82f6] font-bold'
        if (pos >= 18) return 'text-[#ef4444] font-bold'
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
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                                ${ligaInterna === ligaName
                                    ? 'bg-[#10b981] text-white'
                                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            {ligaName}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <PosicionesSkeleton />
            ) : error ? (
                <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-8 text-center">
                    <span className="text-4xl">❌</span>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{error}</p>
                </div>
            ) : (
                <ShareableCard title={`Tabla - ${liga}`} filename={`posiciones-${liga.toLowerCase().replace(/ /g, '-')}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden"
                    >
                        {/* Header de la tabla */}
                        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[var(--background)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--card-border)]">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-4">Equipo</div>
                            <div className="col-span-1 text-center">PJ</div>
                            <div className="col-span-1 text-center">G</div>
                            <div className="col-span-1 text-center">E</div>
                            <div className="col-span-1 text-center">P</div>
                            <div className="col-span-1 text-center">DG</div>
                            <div className="col-span-1 text-center">Pts</div>
                            <div className="col-span-1 text-center hidden md:block">Forma</div>
                        </div>

                        {/* Filas */}
                        {standings.map((team, idx) => (
                            <motion.div
                                key={team.team}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm
                                ${idx % 2 === 0 ? 'bg-[var(--card-bg)]' : 'bg-[var(--background)]/30'}
                                hover:bg-[var(--background)]/50 transition-colors`}
                            >
                                <div className={`col-span-1 text-center ${getPositionStyle(team.position)}`}>
                                    {team.position}
                                </div>
                                <div className="col-span-4 flex items-center gap-2 truncate">
                                    <TeamLogo src={team.logo} teamName={team.team} size={24} />
                                    <span className="font-bold truncate text-xs md:text-sm">{team.team}</span>
                                </div>
                                <div className="col-span-1 text-center text-[var(--text-muted)]">{team.played}</div>
                                <div className="col-span-1 text-center text-[#10b981]">{team.won}</div>
                                <div className="col-span-1 text-center text-[#6b7280]">{team.draw}</div>
                                <div className="col-span-1 text-center text-[#ef4444]">{team.lost}</div>
                                <div className={`col-span-1 text-center font-bold ${team.goalDiff >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                    {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                                </div>
                                <div className="col-span-1 text-center font-black text-lg">{team.points}</div>
                                <div className="col-span-1 flex gap-0.5 justify-center">
                                    {team.form.slice(-3).map((result, i) => (
                                        <span
                                            key={i}
                                            className={`w-4 h-4 rounded-sm md:flex items-center justify-center text-[8px] font-black hidden md:inline-flex ${getFormColor(result)}`}
                                        >
                                            {result}
                                        </span>
                                    ))}
                                    <div className="flex gap-0.5 md:hidden">
                                        {team.form.slice(-3).map((result, i) => (
                                            <span
                                                key={i}
                                                className={`w-2 h-2 rounded-full ${result === 'W' ? 'bg-[#10b981]' : result === 'D' ? 'bg-[#6b7280]' : 'bg-[#ef4444]'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Leyenda */}
                        <div className="px-4 py-3 bg-[var(--background)] border-t border-[var(--card-border)] flex flex-wrap gap-4 text-[10px] text-[var(--text-muted)]">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#10b981] rounded-sm"></span>
                                <span>Clasificación Continental</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#3b82f6] rounded-sm"></span>
                                <span>Copa Secundaria</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#ef4444] rounded-sm"></span>
                                <span>Descenso</span>
                            </div>
                        </div>
                    </motion.div>
                </ShareableCard>
            )}

            <div className="mt-4 text-center text-[10px] text-[var(--text-muted)]">
                Datos actualizados via API-Football · Actualización cada 2hs
            </div>
        </div>
    )
}
