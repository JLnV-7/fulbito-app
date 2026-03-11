// src/components/StatsRadar.tsx
'use client'

import { motion } from 'framer-motion'

interface RadarStat {
    label: string
    value: number   // 0-100 (normalized)
    raw: string     // Display value
}

interface StatsRadarProps {
    stats: RadarStat[]
    size?: number
}

export function StatsRadar({ stats, size = 220 }: StatsRadarProps) {
    if (stats.length < 3) return null

    const cx = size / 2
    const cy = size / 2
    const maxR = (size / 2) - 30
    const levels = 4
    const angleStep = (2 * Math.PI) / stats.length

    // Get point on radar for a stat
    const getPoint = (index: number, value: number) => {
        const angle = angleStep * index - Math.PI / 2
        const r = (value / 100) * maxR
        return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
        }
    }

    // Build the data polygon path
    const dataPath = stats.map((s, i) => {
        const { x, y } = getPoint(i, s.value)
        return `${i === 0 ? 'M' : 'L'}${x},${y}`
    }).join(' ') + ' Z'

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4" style={{ borderRadius: 'var(--radius)' }}>
            <h3 className="text-[10px] font-black text-[var(--text-muted)] capitalize tracking-widest mb-3 flex items-center gap-2 italic">
                📊 Tu Radar
            </h3>

            <div className="flex justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background circles */}
                    {Array.from({ length: levels }, (_, i) => {
                        const r = ((i + 1) / levels) * maxR
                        const points = stats.map((_, j) => {
                            const angle = angleStep * j - Math.PI / 2
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
                        }).join(' ')
                        return (
                            <polygon
                                key={i}
                                points={points}
                                fill="none"
                                stroke="var(--card-border)"
                                strokeWidth={0.5}
                                opacity={0.5}
                            />
                        )
                    })}

                    {/* Axis lines */}
                    {stats.map((_, i) => {
                        const { x, y } = getPoint(i, 100)
                        return (
                            <line
                                key={i}
                                x1={cx}
                                y1={cy}
                                x2={x}
                                y2={y}
                                stroke="var(--card-border)"
                                strokeWidth={0.5}
                                opacity={0.3}
                            />
                        )
                    })}

                    {/* Data polygon */}
                    <motion.path
                        d={dataPath}
                        fill="var(--foreground)"
                        fillOpacity={0.1}
                        stroke="var(--foreground)"
                        strokeWidth={2}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                    />

                    {/* Data points */}
                    {stats.map((s, i) => {
                        const { x, y } = getPoint(i, s.value)
                        return (
                            <motion.circle
                                key={i}
                                cx={x}
                                cy={y}
                                r={2.5}
                                fill="var(--foreground)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                            />
                        )
                    })}

                    {/* Labels */}
                    {stats.map((s, i) => {
                        const { x, y } = getPoint(i, 120)
                        return (
                            <g key={`label-${i}`}>
                                <text
                                    x={x}
                                    y={y - 6}
                                    textAnchor="middle"
                                    fill="var(--text-muted)"
                                    fontSize={9}
                                    fontWeight={600}
                                >
                                    {s.label}
                                </text>
                                <text
                                    x={x}
                                    y={y + 6}
                                    textAnchor="middle"
                                    fill="var(--foreground)"
                                    fontSize={10}
                                    fontWeight={800}
                                >
                                    {s.raw}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}

/** Helper: build radar stats from profile data */
export function buildRadarStats(data: {
    partidos_vistos: number
    total_votos: number
    promedio_general: number
    prode_puntos?: number
    badges_count?: number
    friend_matches_votes?: number
}): RadarStat[] {
    return [
        {
            label: 'Partidos',
            value: Math.min(100, (data.partidos_vistos / 50) * 100),
            raw: String(data.partidos_vistos)
        },
        {
            label: 'Votos',
            value: Math.min(100, (data.total_votos / 100) * 100),
            raw: String(data.total_votos)
        },
        {
            label: 'Rating',
            value: (data.promedio_general / 10) * 100,
            raw: data.promedio_general.toFixed(1)
        },
        {
            label: 'Prode',
            value: Math.min(100, ((data.prode_puntos || 0) / 50) * 100),
            raw: String(data.prode_puntos || 0)
        },
        {
            label: 'Social',
            value: Math.min(100, ((data.friend_matches_votes || 0) / 20) * 100),
            raw: String(data.friend_matches_votes || 0),
        },
    ]
}
