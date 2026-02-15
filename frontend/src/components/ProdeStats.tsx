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
        } catch (err) {
            console.error('Error fetching stats:', err)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6 animate-pulse">
                <div className="h-4 bg-[var(--background)] rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-[var(--background)] rounded w-1/3"></div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 rounded-2xl border border-[#10b981]/30 p-6">
                <div className="text-center">
                    <span className="text-4xl mb-3 block">🚀</span>
                    <h3 className="font-bold mb-1">¡Empezá a pronosticar!</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                        Hacé tu primer pronóstico y empezá a sumar puntos
                    </p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 rounded-2xl border border-[#10b981]/30 p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#10b981] uppercase tracking-tighter flex items-center gap-2">
                    📊 Mis Estadísticas
                </h3>
                {stats.posicion > 0 && (
                    <div className="flex items-center gap-1 bg-[#ffd700]/20 px-3 py-1 rounded-full">
                        <span className="text-[#ffd700]">🏆</span>
                        <span className="text-xs font-bold">#{stats.posicion}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                    <div className="text-3xl font-black text-[#10b981]">{stats.puntos_totales}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Puntos</div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-black">{stats.partidos_jugados}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase">Partidos</div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#10b981]/20 grid grid-cols-3 gap-2 text-center">
                <div>
                    <div className="text-lg font-bold text-[#10b981]">{stats.aciertos_exactos}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">Exactos</div>
                </div>
                <div>
                    <div className="text-lg font-bold text-[#3b82f6]">{stats.aciertos_ganador_diferencia}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">Gan+Dif</div>
                </div>
                <div>
                    <div className="text-lg font-bold text-[#6366f1]">{stats.aciertos_ganador}</div>
                    <div className="text-[9px] text-[var(--text-muted)]">Ganador</div>
                </div>
            </div>
        </motion.div>
    )
}
