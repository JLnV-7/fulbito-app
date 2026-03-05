// src/app/perfil/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus, UserCheck, Film, Star, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { MatchLogCard } from '@/components/MatchLogCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useFollows } from '@/hooks/useMatchLogs'
import type { Profile, MatchLog } from '@/types'
import type { BadgeStats } from '@/lib/badges'

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const { isFollowing, toggleFollow } = useFollows()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [logs, setLogs] = useState<MatchLog[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total_logs: 0, avg_rating: 0, total_likes: 0 })
    const [badgeStats, setBadgeStats] = useState<BadgeStats>({
        total_logs: 0, reviews_with_text: 0, total_votos: 0,
        grupos_joined: 0, followers_count: 0, total_likes_received: 0,
        distinct_ligas: 0, prode_aciertos: 0, neutral_reviews: 0,
        early_logs: 0, late_logs: 0,
    })

    const isOwnProfile = user?.id === id

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true)

            // Fetch profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single()

            if (profileData) setProfile(profileData)

            // Fetch recent public logs
            try {
                const { data: logsData } = await supabase
                    .from('match_logs')
                    .select('*')
                    .eq('user_id', id)
                    .eq('is_private', false)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (logsData) setLogs(logsData)
            } catch {
                console.log('Logs no disponibles')
            }

            // Fetch stats + badge data
            try {
                const { data: allLogs } = await supabase
                    .from('match_logs')
                    .select('id, rating_partido, review_text, liga, is_neutral, created_at')
                    .eq('user_id', id)

                if (allLogs) {
                    const totalLogs = allLogs.length
                    const avgRating = totalLogs > 0
                        ? allLogs.reduce((acc, l) => acc + l.rating_partido, 0) / totalLogs
                        : 0

                    setStats({ total_logs: totalLogs, avg_rating: avgRating, total_likes: 0 })

                    const distinctLigas = new Set(allLogs.map(l => l.liga).filter(Boolean)).size
                    const reviewsWithText = allLogs.filter(l => l.review_text && l.review_text.length > 0).length
                    const neutralReviews = allLogs.filter(l => l.is_neutral).length
                    const earlyLogs = allLogs.filter(l => new Date(l.created_at).getHours() < 10).length
                    const lateLogs = allLogs.filter(l => {
                        const h = new Date(l.created_at).getHours()
                        return h >= 0 && h < 5
                    }).length

                    setBadgeStats(prev => ({
                        ...prev,
                        total_logs: totalLogs,
                        reviews_with_text: reviewsWithText,
                        distinct_ligas: distinctLigas,
                        neutral_reviews: neutralReviews,
                        early_logs: earlyLogs,
                        late_logs: lateLogs,
                    }))
                }
            } catch {
                console.log('Stats no disponibles')
            }

            setLoading(false)
        }

        fetchProfile()
    }, [id])

    if (loading) {
        return (
            <>
                <DesktopNav />
                <main className="min-h-screen bg-[var(--background)] flex items-center justify-center pb-24 md:pt-20">
                    <LoadingSpinner />
                </main>
                <NavBar />
            </>
        )
    }

    if (!profile) {
        return (
            <>
                <DesktopNav />
                <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                    <div className="flex flex-col items-center justify-center py-16">
                        <span className="text-4xl mb-4">😕</span>
                        <h2 className="text-lg font-bold mb-1">Usuario no encontrado</h2>
                        <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold">
                            Volver
                        </button>
                    </div>
                </main>
                <NavBar />
            </>
        )
    }

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header with gradient - purple for public profiles */}
                <div className="bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#a78bfa] pt-6 pb-20 px-6 rounded-b-[40px] relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-4 right-4 text-7xl">⚽</div>
                    </div>

                    <div className="max-w-2xl mx-auto relative">
                        <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full backdrop-blur-md text-white mb-4">
                            <ArrowLeft size={18} />
                        </button>

                        <div className="text-center text-white">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-3
                           border-4 border-white/30 text-4xl shadow-xl"
                            >
                                {profile.avatar_url || profile.username?.charAt(0)?.toUpperCase() || '?'}
                            </motion.div>
                            <h1 className="text-2xl font-black mb-1 drop-shadow-md">{profile.username || 'Usuario'}</h1>
                            {profile.equipo && (
                                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-sm mb-3">
                                    <span>❤️</span>
                                    <span className="font-semibold">{profile.equipo}</span>
                                </div>
                            )}

                            {/* Follow button */}
                            {!isOwnProfile && user && (
                                <div className="mt-2">
                                    <button
                                        onClick={() => toggleFollow(id)}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isFollowing(id)
                                                ? 'bg-white/20 text-white border border-white/30'
                                                : 'bg-white text-[#6366f1] font-semibold'
                                            }`}
                                    >
                                        {isFollowing(id) ? <><UserCheck size={15} /> Siguiendo</> : <><UserPlus size={15} /> Seguir</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 text-center">
                            <Film size={16} className="mx-auto mb-1 text-[#f59e0b]" />
                            <div className="text-xl font-bold">{stats.total_logs}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">Partidos</div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 text-center">
                            <Star size={16} className="mx-auto mb-1 text-[#f59e0b]" />
                            <div className="text-xl font-bold">{stats.avg_rating.toFixed(1)}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">Rating Prom.</div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 text-center">
                            <Trophy size={16} className="mx-auto mb-1 text-[#10b981]" />
                            <div className="text-xl font-bold">{badgeStats.distinct_ligas}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">Ligas</div>
                        </div>
                    </div>

                    {/* Badges */}
                    <BadgeDisplay stats={badgeStats} />

                    {/* Recent Logs */}
                    {logs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Film size={14} className="text-[#f59e0b]" />
                                Últimas reseñas
                            </h3>
                            <div className="space-y-3">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <MatchLogCard log={log} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {logs.length === 0 && (
                        <div className="text-center py-8 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl">
                            <span className="text-3xl mb-2 block">🎬</span>
                            <p className="text-sm text-[var(--text-muted)]">Aún no tiene reseñas públicas</p>
                        </div>
                    )}
                </div>
            </main>
            <NavBar />
        </>
    )
}
