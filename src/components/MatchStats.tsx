// src/components/MatchStats.tsx
'use client'

import { motion } from 'framer-motion'

interface Stat {
    label: string
    home: number
    away: number
    isPercentage?: boolean
}

interface MatchStatsProps {
    stats?: Stat[]
    loading?: boolean
}

export function MatchStats({ stats, loading = false }: MatchStatsProps) {
    // Demo stats si no hay datos reales
    const defaultStats: Stat[] = [
        { label: 'Posesión', home: 55, away: 45, isPercentage: true },
        { label: 'Tiros totales', home: 14, away: 8 },
        { label: 'Tiros al arco', home: 6, away: 3 },
        { label: 'Corners', home: 7, away: 4 },
        { label: 'Faltas', home: 12, away: 15 },
        { label: 'Tarjetas amarillas', home: 2, away: 3 },
        { label: 'Fuera de juego', home: 2, away: 1 },
        { label: 'Pases completados', home: 412, away: 356 },
    ]

    const displayStats = stats || defaultStats

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6">
                <div className="animate-pulse space-y-4">
                    {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="h-8 bg-[var(--background)] rounded-lg"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden"
        >
            {/* Header */}
            <div className="px-4 py-3 bg-[var(--background)] border-b border-[var(--card-border)]">
                <h3 className="text-sm font-bold">📊 Estadísticas del Partido</h3>
            </div>

            {/* Stats Grid */}
            <div className="p-4 space-y-4">
                {displayStats.map((stat, idx) => {
                    const total = stat.home + stat.away
                    const homePercent = total > 0 ? (stat.home / total) * 100 : 50
                    const awayPercent = 100 - homePercent

                    const homeWins = stat.home > stat.away
                    const awayWins = stat.away > stat.home

                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="space-y-2"
                        >
                            {/* Values Row */}
                            <div className="flex justify-between items-center text-sm">
                                <span className={`font-bold min-w-[40px] ${homeWins ? 'text-[#10b981]' : ''}`}>
                                    {stat.isPercentage ? `${stat.home}%` : stat.home}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                    {stat.label}
                                </span>
                                <span className={`font-bold min-w-[40px] text-right ${awayWins ? 'text-[#10b981]' : ''}`}>
                                    {stat.isPercentage ? `${stat.away}%` : stat.away}
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="flex h-2 rounded-full overflow-hidden bg-[var(--background)]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${homePercent}%` }}
                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                    className={`rounded-l-full ${homeWins ? 'bg-[#ff6b6b]' : 'bg-[#ff6b6b]/50'}`}
                                />
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${awayPercent}%` }}
                                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                                    className={`rounded-r-full ${awayWins ? 'bg-[#3b82f6]' : 'bg-[#3b82f6]/50'}`}
                                />
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Footer note */}
            <div className="px-4 py-2 bg-[var(--background)] border-t border-[var(--card-border)]">
                <p className="text-[9px] text-[var(--text-muted)] text-center">
                    📡 Stats actualizadas en tiempo real
                </p>
            </div>
        </motion.div>
    )
}
