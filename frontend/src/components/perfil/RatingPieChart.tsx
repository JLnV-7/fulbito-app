'use client'

import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '@/lib/supabase'
import { Star } from 'lucide-react'

interface RatingPieChartProps {
    userId: string
}

const RATING_COLORS: Record<number, string> = {
    5: '#10b981', // Verde FutLog (Excelente)
    4: '#34d399', // Verde Claro (Muy bueno)
    3: '#fbbf24', // Amarillo (Regular)
    2: '#fb923c', // Naranja (Malo)
    1: '#ef4444', // Rojo (Pésimo)
}

const RATING_LABELS: Record<number, string> = {
    5: 'Obra Maestra',
    4: 'Muy Bueno',
    3: 'Regular',
    2: 'Malo',
    1: 'Desastre',
}

export function RatingPieChart({ userId }: RatingPieChartProps) {
    const [data, setData] = useState<{ rating: number; count: number }[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ average: 0, total: 0 })

    useEffect(() => {
        if (!userId) return

        const fetchRatings = async () => {
            try {
                // Fetch only ratings from match_logs
                const { data: logs, error } = await supabase
                    .from('match_logs')
                    .select('rating')
                    .eq('user_id', userId)

                if (error) throw error

                if (!logs || logs.length === 0) {
                    setLoading(false)
                    return
                }

                // Calculate distribution
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

                // Format for Recharts
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
            <div className="h-[200px] flex items-center justify-center animate-pulse">
                <div className="w-32 h-32 rounded-full border-4 border-[var(--card-border)] border-t-[var(--accent-green)] animate-spin" />
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

    // Find highest percentage for the central text display later if we want it
    const topRating = [...data].sort((a, b) => b.count - a.count)[0]
    const topPercentage = Math.round((topRating.count / stats.total) * 100)

    return (
        <div className="flex flex-col md:flex-row items-center gap-6 py-2">

            {/* Pie Chart */}
            <div className="w-[180px] h-[180px] relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={2}
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
                                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-2 shadow-xl text-center">
                                            <div className="flex justify-center gap-0.5 mb-1 text-amber-400 text-xs">
                                                {'★'.repeat(data.rating)}
                                            </div>
                                            <p className="text-xs font-bold text-[var(--foreground)]">{data.count} partidos</p>
                                        </div>
                                    )
                                }
                                return null
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Stat */}
                <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                    <span className="text-2xl font-black text-[var(--foreground)] leading-none">{stats.average}</span>
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase mt-1">Promedio</span>
                </div>
            </div>

            {/* Legend / Stats Info */}
            <div className="flex-1 w-full space-y-2.5">
                <p className="text-xs text-[var(--text-muted)] border-b border-[var(--card-border)] pb-2 mb-3 font-medium">
                    Basado en <span className="font-bold text-[var(--foreground)]">{stats.total} partidos rateados</span>. Tu calificación más común es {topRating.rating} estrellas ({topPercentage}%).
                </p>

                {data.map((item) => (
                    <div key={item.rating} className="flex items-center gap-3 text-sm">
                        <div className="flex gap-0.5 w-16 shrink-0 justify-end" style={{ color: RATING_COLORS[item.rating] }}>
                            {'★'.repeat(item.rating)}
                            <span className="text-[var(--card-border)]">{'★'.repeat(5 - item.rating)}</span>
                        </div>
                        <div className="flex-1 h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${(item.count / stats.total) * 100}%`,
                                    backgroundColor: RATING_COLORS[item.rating]
                                }}
                            />
                        </div>
                        <div className="w-8 shrink-0 text-right text-xs font-bold text-[var(--text-muted)]">
                            {item.count}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    )
}
