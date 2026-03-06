// src/components/AdvancedStats.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CollapsibleSection } from './CollapsibleSection'

interface TeamStats {
    name: string
    logo: string
    possession: string | number
    shots: string | number
    shots_on_target: string | number
    corners: string | number
    fouls: string | number
    yellow_cards: string | number
    red_cards: string | number
    offsides: string | number
    passes_total: string | number
    passes_accurate: string | number
    expected_goals: string | number
}

interface StatsData {
    local: TeamStats
    visitante: TeamStats
}

interface AdvancedStatsProps {
    fixtureId: number | string
}

interface StatRow {
    label: string
    icon: string
    local: number
    visitante: number
    format?: 'percent' | 'number' | 'xg'
}

export function AdvancedStats({ fixtureId }: AdvancedStatsProps) {
    const [data, setData] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/partido/${fixtureId}/statistics`)
                const json = await res.json()
                setData(json.stats)
            } catch (err) {
                console.error('Error loading stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [fixtureId])

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span>📊</span>
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase">Estadísticas Avanzadas</h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-6 bg-[var(--background)] rounded animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (!data) return null

    const parseNum = (v: string | number): number => {
        if (typeof v === 'number') return v
        const n = parseFloat(String(v).replace('%', ''))
        return isNaN(n) ? 0 : n
    }

    const rows: StatRow[] = [
        { label: 'Posesión', icon: '🎯', local: parseNum(data.local.possession), visitante: parseNum(data.visitante.possession), format: 'percent' },
        { label: 'xG', icon: '📈', local: parseNum(data.local.expected_goals), visitante: parseNum(data.visitante.expected_goals), format: 'xg' },
        { label: 'Tiros', icon: '🥅', local: parseNum(data.local.shots), visitante: parseNum(data.visitante.shots) },
        { label: 'Al arco', icon: '🎯', local: parseNum(data.local.shots_on_target), visitante: parseNum(data.visitante.shots_on_target) },
        { label: 'Corners', icon: '🏁', local: parseNum(data.local.corners), visitante: parseNum(data.visitante.corners) },
        { label: 'Pases', icon: '📋', local: parseNum(data.local.passes_total), visitante: parseNum(data.visitante.passes_total) },
        { label: 'Pases prec.', icon: '✅', local: parseNum(data.local.passes_accurate), visitante: parseNum(data.visitante.passes_accurate) },
        { label: 'Faltas', icon: '⚠️', local: parseNum(data.local.fouls), visitante: parseNum(data.visitante.fouls) },
        { label: 'Offsides', icon: '🚩', local: parseNum(data.local.offsides), visitante: parseNum(data.visitante.offsides) },
    ]

    // Filter out rows where both values are 0
    const activeRows = rows.filter(r => r.local > 0 || r.visitante > 0)

    if (activeRows.length === 0) return null

    return (
        <CollapsibleSection title="Estadísticas Avanzadas" icon={<span className="text-xl">📊</span>} defaultOpen={false}>

            {/* Team names header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--background)]">
                <div className="flex items-center gap-2">
                    {data.local.logo && (
                        <img src={data.local.logo} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span className="text-[10px] font-bold truncate max-w-[80px]">{data.local.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold truncate max-w-[80px]">{data.visitante.name}</span>
                    {data.visitante.logo && (
                        <img src={data.visitante.logo} alt="" className="w-5 h-5 object-contain" />
                    )}
                </div>
            </div>

            {/* Stats rows */}
            <div className="px-4 py-2 space-y-3">
                {activeRows.map((row, idx) => {
                    const total = row.local + row.visitante
                    const localPct = total > 0 ? (row.local / total) * 100 : 50
                    const visitantePct = total > 0 ? (row.visitante / total) * 100 : 50

                    const formatValue = (v: number) => {
                        if (row.format === 'percent') return `${v}%`
                        if (row.format === 'xg') return v.toFixed(2)
                        return String(v)
                    }

                    const localWins = row.local > row.visitante
                    const visitanteWins = row.visitante > row.local

                    return (
                        <motion.div
                            key={row.label}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            {/* Label */}
                            <div className="flex items-center justify-between mb-1">
                                <span className={`text-[11px] font-bold tabular-nums ${localWins ? 'text-[#10b981]' : 'text-[var(--text-muted)]'}`}>
                                    {formatValue(row.local)}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                    {row.icon} {row.label}
                                </span>
                                <span className={`text-[11px] font-bold tabular-nums ${visitanteWins ? 'text-[#6366f1]' : 'text-[var(--text-muted)]'}`}>
                                    {formatValue(row.visitante)}
                                </span>
                            </div>

                            {/* Bar */}
                            <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
                                <motion.div
                                    initial={{ width: '50%' }}
                                    animate={{ width: `${localPct}%` }}
                                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                                    className="rounded-full"
                                    style={{ backgroundColor: localWins ? '#10b981' : 'var(--card-border)' }}
                                />
                                <motion.div
                                    initial={{ width: '50%' }}
                                    animate={{ width: `${visitantePct}%` }}
                                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                                    className="rounded-full"
                                    style={{ backgroundColor: visitanteWins ? '#6366f1' : 'var(--card-border)' }}
                                />
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </CollapsibleSection>
    )
}
