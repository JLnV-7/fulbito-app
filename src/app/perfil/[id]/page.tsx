'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { motion } from 'framer-motion'
import type { Profile, UserStats } from '@/types'
import { UserStatsCard } from '@/components/UserStatsCard'

export default function PublicProfile() {
    const params = useParams()
    const router = useRouter()
    const userId = params?.id as string

    const [profile, setProfile] = useState<Profile | null>(null)
    const [stats, setStats] = useState<UserStats>({
        partidos_vistos: 0,
        promedio_general: 0,
        total_votos: 0
    })
    const [prodeStats, setProdeStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) {
            cargarPerfil()
        }
    }, [userId])

    const cargarPerfil = async () => {
        try {
            // Cargar datos del perfil
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error

            if (data) {
                setProfile(data)

                // Cargar estadísticas de votos (RPC)
                try {
                    const { data: statsData } = await supabase
                        .rpc('get_user_stats', { user_id_param: userId })

                    if (statsData && statsData[0]) {
                        setStats({
                            partidos_vistos: statsData[0].partidos_vistos || 0,
                            promedio_general: statsData[0].promedio_general || 0,
                            total_votos: statsData[0].total_votos || 0
                        })
                    }
                } catch (statsError) {
                    console.log('Stats de votos no disponibles')
                }

                // Cargar estadísticas de PRODE
                try {
                    const { data: prodeData } = await supabase
                        .from('ranking_prode')
                        .select('*')
                        .eq('user_id', userId)
                        .single()

                    if (prodeData) {
                        setProdeStats(prodeData)
                    }
                } catch (prodeError) {
                    console.log('Stats de prode no disponibles')
                }
            }
        } catch (error) {
            console.error('Error cargando perfil:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <p className="text-[var(--text-muted)]">Usuario no encontrado</p>
            </div>
        )
    }

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">

                {/* Hero Header */}
                <div className="bg-gradient-to-br from-[#10b981] via-[#059669] to-[#34d399] pt-8 pb-24 px-6 rounded-b-[50px] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-4 right-4 text-8xl">⚽</div>
                        <div className="absolute bottom-8 left-8 text-6xl">🏆</div>
                    </div>

                    <div className="max-w-2xl mx-auto relative content-center">
                        <div className="flex justify-between items-center mb-8">
                            <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full backdrop-blur-md text-white">
                                ←
                            </button>
                        </div>

                        <div className="text-center text-white">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 text-5xl shadow-xl"
                            >
                                {profile.avatar_url || '👤'}
                            </motion.div>
                            <h1 className="text-3xl font-black mb-1 drop-shadow-md">{profile.username || 'Usuario'}</h1>
                            {profile.equipo && (
                                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/10 mt-2">
                                    <span>❤️</span>
                                    <span className="font-bold">{profile.equipo}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-10">
                    <UserStatsCard stats={stats} prodeStats={prodeStats} />
                </div>

                <NavBar />
            </main>
        </>
    )
}
