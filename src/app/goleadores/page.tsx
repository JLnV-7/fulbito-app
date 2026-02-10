// src/app/goleadores/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { motion } from 'framer-motion'
import { TeamLogo } from '@/components/TeamLogo'
import { ShareableCard } from '@/components/ShareableCard'
import { fetchTopScorersAction } from '@/app/actions/football'
import type { ApiScorer } from '@/types/api'
import Image from 'next/image'

interface Goleador {
    position: number
    name: string
    team: string
    teamLogo: string
    goals: number
    assists: number
    matches: number
    nationality: string
}

const LIGAS_CONFIG: Record<string, { id: number; season: number }> = {
    'Liga Profesional': { id: 128, season: 2025 },
    'La Liga': { id: 140, season: 2024 },
    'Premier League': { id: 39, season: 2024 },
}

export default function GoleadoresPage() {
    const [liga, setLiga] = useState('Liga Profesional')
    const [goleadores, setGoleadores] = useState<Goleador[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchGoleadores()
    }, [liga])

    const fetchGoleadores = async () => {
        setLoading(true)
        try {
            const data = await fetchTopScorersAction(liga)

            // Adaptar respuesta API
            const adaptedGoleadores: Goleador[] = data.map((item: ApiScorer, idx: number) => ({
                position: idx + 1,
                name: item.player.name,
                team: item.statistics[0].team.name,
                teamLogo: item.statistics[0].team.logo,
                goals: item.statistics[0].goals.total || 0,
                assists: item.statistics[0].goals.assists || 0,
                matches: item.statistics[0].games.appearences || 0,
                nationality: item.player.nationality === 'Argentina' ? '🇦🇷' : item.player.nationality
            })).slice(0, 20) // Top 20

            setGoleadores(adaptedGoleadores)
        } catch (error) {
            console.error('Error loading top scorers:', error)
        } finally {
            setLoading(false)
        }
    }



    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header */}
                <div className="px-6 py-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-black mb-2">⚽ Goleadores</h1>
                        <p className="text-[var(--text-muted)] text-sm">
                            Los máximos artilleros de cada liga
                        </p>
                    </div>
                </div>

                {/* Selector de Liga */}
                <div className="px-6 mb-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {Object.keys(LIGAS_CONFIG).map(ligaName => (
                                <button
                                    key={ligaName}
                                    onClick={() => setLiga(ligaName)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all
                                        ${liga === ligaName
                                            ? 'bg-[#ffd700] text-black'
                                            : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)]'
                                        }`}
                                >
                                    {ligaName}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabla de goleadores */}
                <div className="px-6">
                    <div className="max-w-4xl mx-auto">
                        {loading ? (
                            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-8 text-center animate-pulse">
                                <span className="text-4xl">⚽</span>
                                <p className="mt-2 text-xs text-[var(--text-muted)]">Cargando goleadores...</p>
                            </div>
                        ) : (
                            <ShareableCard title={`Goleadores - ${liga}`} filename={`goleadores-${liga.toLowerCase().replace(/ /g, '-')}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[var(--background)] border-b border-[var(--card-border)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                        <div className="col-span-1 text-center">#</div>
                                        <div className="col-span-5">Jugador</div>
                                        <div className="col-span-3">Equipo</div>
                                        <div className="col-span-1 text-center">⚽</div>
                                        <div className="col-span-1 text-center">🅰️</div>
                                        <div className="col-span-1 text-center">PJ</div>
                                    </div>

                                    {/* Rows */}
                                    {goleadores.map((goleador, idx) => (
                                        <motion.div
                                            key={goleador.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className={`grid grid-cols-12 gap-2 px-4 py-3 items-center
                                            ${idx % 2 === 0 ? 'bg-[var(--card-bg)]' : 'bg-[var(--background)]/30'}
                                            ${idx < 3 ? 'border-l-4 border-l-[#ffd700]' : ''}
                                            hover:bg-[var(--background)]/50 transition-colors`}
                                        >
                                            {/* Posición */}
                                            <div className={`col-span-1 text-center font-black text-lg
                                            ${idx === 0 ? 'text-[#ffd700]' : idx === 1 ? 'text-[#c0c0c0]' : idx === 2 ? 'text-[#cd7f32]' : 'text-[var(--text-muted)]'}`}>
                                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : goleador.position}
                                            </div>

                                            {/* Jugador */}
                                            <div className="col-span-5">
                                                <span className="font-bold text-sm">{goleador.name}</span>
                                            </div>

                                            {/* Equipo */}
                                            <div className="col-span-3 flex items-center gap-2">
                                                <div className="relative w-5 h-5 flex-shrink-0">
                                                    <TeamLogo
                                                        src={goleador.teamLogo}
                                                        teamName={goleador.team}
                                                        size={20}
                                                    />
                                                </div>
                                                <span className="text-xs text-[var(--text-muted)] truncate">{goleador.team}</span>
                                            </div>

                                            {/* Goles */}
                                            <div className="col-span-1 text-center font-black text-lg text-[#10b981]">
                                                {goleador.goals}
                                            </div>

                                            {/* Asistencias */}
                                            <div className="col-span-1 text-center text-[var(--text-muted)]">
                                                {goleador.assists}
                                            </div>

                                            {/* Partidos */}
                                            <div className="col-span-1 text-center text-[var(--text-muted)] text-xs">
                                                {goleador.matches}
                                            </div>
                                        </motion.div>
                                    ))}

                                    {/* Footer */}
                                    <div className="px-4 py-3 bg-[var(--background)] border-t border-[var(--card-border)] text-center">
                                        <p className="text-[10px] text-[var(--text-muted)]">
                                            ⚠️ Datos de demostración. Conectar API para stats reales.
                                        </p>
                                    </div>
                                </motion.div>
                            </ShareableCard>
                        )}
                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
