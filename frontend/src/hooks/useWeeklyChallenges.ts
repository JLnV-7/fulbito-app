// src/hooks/useWeeklyChallenges.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Challenge {
    id: string
    title: string
    description: string
    target: number
    current: number
    xpReward: number
}

export function useWeeklyChallenges() {
    const { user } = useAuth()
    const [challenges, setChallenges] = useState<Challenge[]>([])
    const [loading, setLoading] = useState(true)

    const getWeekNumber = useCallback(() => {
        const d = new Date()
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        return Math.ceil((((Number(d) - Number(yearStart)) / 86400000) + 1) / 7)
    }, [])

    const fetchProgress = useCallback(async () => {
        if (!user) {
            setLoading(false)
            return
        }

        const weekNum = getWeekNumber()
        try {
            const d = new Date()
            const day = d.getDay()
            const diff = d.getDate() - day + (day === 0 ? -6 : 1)
            const startOfWeek = new Date(d.setDate(diff))
            startOfWeek.setHours(0, 0, 0, 0)
            const isoStart = startOfWeek.toISOString()

            // Challenge 1: Votaciones
            const { count: c1Count } = await supabase
                .from('votaciones')
                .select('partido_id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', isoStart)

            // Challenge 2: Match Logs with review
            const { count: c2Count } = await supabase
                .from('match_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', isoStart)
                .neq('review_text', '')
                .not('review_text', 'is', null)

            // Challenge 3: Pronosticos
            const { count: c3Count } = await supabase
                .from('pronosticos')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', isoStart)

            setChallenges([
                {
                    id: `c1-${weekNum}`,
                    title: 'Tribunero Fiel',
                    description: 'Votá el rating de la comunidad en 3 partidos distintos.',
                    target: 3,
                    current: c1Count || 0,
                    xpReward: 150
                },
                {
                    id: `c2-${weekNum}`,
                    title: 'Analista Táctico',
                    description: 'Loguear 1 partido con una reseña escrita completa.',
                    target: 1,
                    current: c2Count || 0,
                    xpReward: 300
                },
                {
                    id: `c3-${weekNum}`,
                    title: 'El Oráculo',
                    description: 'Agregá 5 predicciones al Prode esta semana.',
                    target: 5,
                    current: c3Count || 0,
                    xpReward: 500
                }
            ])
        } catch (error) {
            console.error("Error fetching challenges progress", error)
        } finally {
            setLoading(false)
        }
    }, [user, getWeekNumber])

    useEffect(() => {
        fetchProgress()
    }, [fetchProgress])

    const pendingCount = challenges.filter(c => c.current < c.target).length
    const completedCount = challenges.filter(c => c.current >= c.target).length
    const totalXP = challenges.reduce((acc, c) => acc + (c.current >= c.target ? c.xpReward : 0), 0)

    return {
        challenges,
        loading,
        pendingCount,
        completedCount,
        totalXP,
        refresh: fetchProgress
    }
}
