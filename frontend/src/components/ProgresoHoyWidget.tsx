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
        <GlassCard
            className="flex items-center justify-between cursor-pointer hover:border-white/10 transition-all border border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
            onClick={() => router.push('/perfil')}
        // no padding needed if we want custom inside, or we use default 
        >
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Tu Progreso Hoy</span>
                <div className="flex gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#10b981] text-sm">🎯</span>
                        <span className="font-bold text-sm">{stats.prodes} <span className="text-xs font-normal text-[var(--text-muted)]">Prodes</span></span>
                    </div>
                    {stats.badges > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-[#F59E0B] text-sm">🎖️</span>
                            <span className="font-bold text-sm">{stats.badges} <span className="text-xs font-normal text-[var(--text-muted)]">Nuevos</span></span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[#3b82f6] text-sm">🏆</span>
                        <span className="font-bold text-sm">#{stats.rango} <span className="text-xs font-normal text-[var(--text-muted)]">Global</span></span>
                    </div>
                </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--foreground)] backdrop-blur-md">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
        </GlassCard>
    )
}
