'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { GlassCard } from './ui/GlassCard'

export function ProgresoHoyWidget() {
    const { user } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState({
        prodes: 0,
        badges: 0,
        rango: 0
    })

    useEffect(() => {
        if (!user) return

        const getStats = async () => {
            try {
                // Today's prodes
                const startOfDay = new Date()
                startOfDay.setHours(0, 0, 0, 0)

                const { count: prodesCount } = await supabase
                    .from('pronosticos')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('created_at', startOfDay.toISOString())

                // Ranking Position
                const { data: rankData } = await supabase
                    .from('ranking_prode')
                    .select('puntos_totales')
                    .eq('user_id', user.id)
                    .single()

                let posicion = 0
                if (rankData) {
                    const { count: higherRanked } = await supabase
                        .from('ranking_prode')
                        .select('*', { count: 'exact', head: true })
                        .gt('puntos_totales', rankData.puntos_totales)

                    posicion = (higherRanked || 0) + 1
                }

                // New Badges Today (Optional depending on how user_badges stores them)
                const { count: badgesCount } = await supabase
                    .from('user_badges')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .gte('earned_at', startOfDay.toISOString())

                setStats({
                    prodes: prodesCount || 0,
                    badges: badgesCount || 0,
                    rango: posicion
                })

            } catch (err) {
                console.error(err)
            }
        }

        getStats()
    }, [user])

    if (!user) return null

    return (
        <div
            className="flex items-center justify-between cursor-pointer border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition-all"
            style={{ borderRadius: 'var(--radius)' }}
            onClick={() => router.push('/perfil')}
        >
            <div className="flex flex-col">
                <span className="text-[10px] capitalize font-black text-[var(--text-muted)] tracking-widest">Tu Progreso Hoy</span>
                <div className="flex gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#16a34a] text-sm">🎯</span>
                        <span className="font-black text-sm tracking-tighter tabular-nums">{stats.prodes} <span className="text-[10px] capitalize font-bold text-[var(--text-muted)]">Prodes</span></span>
                    </div>
                    {stats.badges > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[#d97706] text-sm">🎖️</span>
                            <span className="font-black text-sm tracking-tighter tabular-nums">{stats.badges} <span className="text-[10px] capitalize font-bold text-[var(--text-muted)]">Nuevos</span></span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#2563eb] text-sm">🏆</span>
                        <span className="font-black text-sm tracking-tighter tabular-nums">#{stats.rango} <span className="text-[10px] capitalize font-bold text-[var(--text-muted)]">Global</span></span>
                    </div>
                </div>
            </div>

            <div className="w-8 h-8 bg-[var(--foreground)]/5 flex items-center justify-center text-[var(--foreground)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
        </div>
    )
}
