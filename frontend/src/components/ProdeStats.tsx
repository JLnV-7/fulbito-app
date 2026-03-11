// src/components/ProdeStats.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'

interface Stats {
    puntos_totales: number
    partidos_jugados: number
    aciertos_exactos: number
    aciertos_ganador_diferencia: number
    aciertos_ganador: number
    posicion: number
}

export function ProdeStats() {
    const { user } = useAuth()
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) fetchStats()
    }, [user])

    const fetchStats = async () => {
        try {
            // Obtener stats del usuario
            const { data: rankingData, error } = await supabase
                .from('ranking_prode')
                .select('*')
                .eq('user_id', user?.id)
                .single()

            if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows

            // Obtener posición
            let posicion = 0
            if (rankingData) {
                const { count } = await supabase
                    .from('ranking_prode')
                    .select('*', { count: 'exact', head: true })
                    .gt('puntos_totales', rankingData.puntos_totales)

                posicion = (count || 0) + 1
            }

            setStats(rankingData ? { ...rankingData, posicion } : null)
        } catch (err: any) {
            console.error('Error fetching stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 animate-pulse" style={{ borderRadius: 'var(--radius)' }}>
                <div className="h-4 bg-[var(--background)] w-1/2 mb-4" style={{ borderRadius: 'var(--radius)' }}></div>
                <div className="h-8 bg-[var(--background)] w-1/3" style={{ borderRadius: 'var(--radius)' }}></div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-8 rounded-3xl shadow-sm text-center">
                <span className="text-5xl mb-4 block">🎯</span>
                <h3 className="text-xl font-bold mb-2 tracking-tight">¡EMPEZÁ A PRONOSTICAR!</h3>
                <p className="text-sm text-[var(--text-muted)] font-medium max-w-[200px] mx-auto">
                    Predecí los resultados y sumá puntos en el ranking global.
                </p>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl shadow-sm"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-bold text-[var(--text-muted)] capitalize tracking-tight flex items-center gap-2">
                    📊 Estadísticas
                </h3>
                {stats.posicion > 0 && (
                    <div className="flex items-center gap-1.5 bg-[var(--accent-green)]/10 text-[var(--accent-green)] px-3 py-1 rounded-full border border-[var(--accent-green)]/20 shadow-sm">
                        <span className="text-[10px] capitalize font-bold tracking-tight">Pos #{stats.posicion}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                    <div className="text-4xl font-bold text-[var(--foreground)] tabular-nums tracking-tighter">{stats.puntos_totales}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold capitalize tracking-tight">Puntos</div>
                </div>
                <div className="text-center">
                    <div className="text-4xl font-bold tracking-tighter">{stats.partidos_jugados}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold capitalize tracking-tight">Partidos</div>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--card-border)] grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-xl font-bold text-[var(--accent-green)]">{stats.aciertos_exactos}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold capitalize tracking-tight">Exactos</div>
                </div>
                <div>
                    <div className="text-xl font-bold text-blue-500">{stats.aciertos_ganador_diferencia}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold capitalize tracking-tight">Gan+Dif</div>
                </div>
                <div>
                    <div className="text-xl font-bold text-[var(--foreground)]">{stats.aciertos_ganador}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-bold capitalize tracking-tight">Ganador</div>
                </div>
            </div>
        </motion.div>
    )
}
