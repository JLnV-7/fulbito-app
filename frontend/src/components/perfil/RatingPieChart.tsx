'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Star } from 'lucide-react'

interface RatingPieChartProps {
    userId: string
}

const RATING_COLORS: Record<number, string> = {
    5: '#10b981', // Emerald
    4: '#3b82f6', // Blue
    3: '#f59e0b', // Amber
    2: '#f97316', // Orange
    1: '#ef4444', // Red
}

const RATING_LABELS: Record<number, string> = {
    5: 'Obra Maestra',
    4: 'Muy Bueno',
    3: 'Regular',
    2: 'Malo',
    1: 'Desastre',
}

export function RatingPieChart({ userId }: RatingPieChartProps) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ average: 0, total: 0 })

    useEffect(() => {
        if (!userId) return

        const fetchRatings = async () => {
            try {
                const { data: logs, error } = await supabase
                    .from('match_logs')
                    .select('rating')
                    .eq('user_id', userId)

                if (error) throw error

                if (!logs || logs.length === 0) {
                    setLoading(false)
                    return
                }

                const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                let sum = 0
                let totalWithRating = 0

                logs.forEach(log => {
                    if (log.rating && log.rating >= 1 && log.rating <= 5) {
                        distribution[log.rating] += 1
                        sum += log.rating
                        totalWithRating += 1
                    }
                })

                if (totalWithRating === 0) {
                    setLoading(false)
                    return
                }

                const chartData = [5, 4, 3, 2, 1]
                    .filter(r => distribution[r] > 0)
                    .map(r => ({
                        rating: r,
                        count: distribution[r],
                        label: RATING_LABELS[r]
                    }))

                setData(chartData)
                setStats({
                    average: Number((sum / totalWithRating).toFixed(1)),
                    total: totalWithRating
                })

            } catch (err) {
                console.error('Error fetching ratings:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchRatings()
    }, [userId])

    if (loading) {
        return (
            <div className="h-[200px] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-[var(--accent)]/20 border-t-[var(--accent)] rounded-full animate-spin" />
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-[var(--text-muted)]">
                <Star className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm">No hay suficientes ratings para mostrar gráficas.</p>
            </div>
        )
    }

    const topRating = [...data].sort((a, b) => b.count - a.count)[0]
    const topPercentage = Math.round((topRating.count / stats.total) * 100)

    return (
        <div className="flex flex-col md:flex-row items-center gap-8 py-4">
            <div className="w-[200px] h-[200px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="count"
                            stroke="transparent"
                        >
                            {data.map((entry) => (
                                <Cell key={`cell-${entry.rating}`} fill={RATING_COLORS[entry.rating]} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload
                                    return (
                                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-3 rounded-2xl shadow-xl text-center">
                                            <p className="text-sm font-bold text-[var(--foreground)] mb-1">{data.label}</p>
                                            <p className="text-xs text-[var(--text-muted)]">{data.count} partidos</p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                    <span className="text-3xl font-bold text-[var(--foreground)]">{stats.average}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium capitalize tracking-wider">Promedio</span>
                </div>
            </div>

            <div className="flex-1 w-full space-y-4">
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    Basado en <span className="text-[var(--foreground)] font-semibold">{stats.total} partidos</span> evaluados. Tu calificación más común es <span className="text-[var(--foreground)] font-semibold">{topRating.label}</span> ({topPercentage}%).
                </p>

                <div className="space-y-3">
                    {data.map((item) => (
                        <div key={item.rating} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-[var(--text-muted)] flex gap-1 items-center">
                                    <span className="text-amber-400">★</span> {item.rating} {RATING_LABELS[item.rating]}
                                </span>
                                <span className="text-[var(--foreground)]">{item.count}</span>
                            </div>
                            <div className="w-full h-2 bg-[var(--background)] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.count / stats.total) * 100}%` }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: RATING_COLORS[item.rating] }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
