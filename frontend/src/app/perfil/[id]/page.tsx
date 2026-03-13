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
import { ShareButton } from '@/components/ShareButton'
import { MatchLogCard } from '@/components/MatchLogCard'
import { UserBadgesGallery } from '@/components/UserBadgesGallery'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useFollows, useMatchLogs } from '@/hooks/useMatchLogs'
import { useProfileFollowers } from '@/hooks/useProfileFollowers'
import { FollowListModal, type FollowListType } from '@/components/FollowListModal'
import type { Profile, MatchLog } from '@/types'
import type { BadgeStats } from '@/lib/badges'

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const { isFollowing, toggleFollow } = useFollows()
    const { followersCount, followingCount } = useProfileFollowers(id)
    const [profile, setProfile] = useState<Profile | null>(null)
    const { logs, loading: logsLoading, toggleLike } = useMatchLogs({ userId: id, limit: 10 })
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ total_logs: 0, avg_rating: 0, total_likes: 0 })
    const [badgeStats, setBadgeStats] = useState<BadgeStats>({
        total_logs: 0, reviews_with_text: 0, total_votos: 0,
        grupos_joined: 0, followers_count: 0, total_likes_received: 0,
        distinct_ligas: 0, prode_aciertos: 0, neutral_reviews: 0,
        early_logs: 0, late_logs: 0,
    })

    const [followModalState, setFollowModalState] = useState<{
        isOpen: boolean;
        type: FollowListType;
        title: string;
    }>({ isOpen: false, type: 'followers', title: '' })

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

            // Logs are handled by useMatchLogs hook now

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

    if (loading || logsLoading) {
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
                <div className="bg-[var(--card-bg)] pt-8 pb-12 px-6 border-b border-[var(--card-border)] relative overflow-hidden">
                    {/* Subtle accent gradient background */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--accent-green)]/5 to-transparent pointer-events-none" />

                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-4 right-4 text-7xl">⚽</div>
                    </div>

                    <div className="max-w-2xl mx-auto relative">
                        <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full backdrop-blur-md text-white mb-4">
                            <ArrowLeft size={18} />
                        </button>

                        <div className="text-center text-[var(--foreground)]">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-24 h-24 bg-[var(--background)] rounded-3xl flex items-center justify-center mx-auto mb-4
                           border-2 border-[var(--card-border)] text-4xl shadow-2xl overflow-hidden"
                            >
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    profile.username?.charAt(0)?.toUpperCase() || '?'
                                )}
                            </motion.div>
                            <h1 className="text-2xl font-bold mb-1 capitalize tracking-tight">{profile.username || 'Usuario'}</h1>
                            {profile.equipo && (
                                <div className="inline-flex items-center gap-2 bg-[var(--background)] border border-[var(--card-border)] px-4 py-2 rounded-full text-xs mb-6 shadow-sm">
                                    <span>❤️</span>
                                    <span className="font-bold capitalize tracking-tight">{profile.equipo}</span>
                                </div>
                            )}

                            {/* Follow button */}
                            {!isOwnProfile && user && (
                                <div className="mt-2 text-white">
                                    <Button
                                        onClick={() => toggleFollow(id)}
                                        variant={isFollowing(id) ? 'glass' : 'primary'}
                                        size="md"
                                        className={isFollowing(id) ? 'bg-[var(--card-bg)] text-[var(--foreground)] border-[var(--card-border)]' : 'bg-[#16a34a] text-white hover:bg-[#059669]'}
                                    >
                                        {isFollowing(id) ? <><UserCheck size={18} className="mr-1" /> Siguiendo</> : <><UserPlus size={18} className="mr-1" /> Seguir</>}
                                    </Button>
                                </div>
                            )}

                            {/* Stats Summary */}
                            <div className="flex items-center justify-center gap-8 mb-6 border-t border-b border-[var(--card-border)] py-4 border-dashed">
                                <div
                                    className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setFollowModalState({
                                        isOpen: true,
                                        type: 'followers',
                                        title: 'Seguidores'
                                    })}
                                >
                                    <div className="font-bold text-xl">{followersCount}</div>
                                    <div className="text-[10px] capitalize font-bold text-[var(--text-muted)] tracking-tight">Seguidores</div>
                                </div>
                                <div
                                    className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setFollowModalState({
                                        isOpen: true,
                                        type: 'following',
                                        title: 'Siguiendo'
                                    })}
                                >
                                    <div className="font-bold text-xl">{followingCount}</div>
                                    <div className="text-[10px] capitalize font-bold text-[var(--text-muted)] tracking-tight">Siguiendo</div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-6 mt-6 pb-8 relative z-10 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center shadow-sm">
                            <Film size={16} className="mx-auto mb-1.5 text-[var(--accent-green)]" />
                            <div className="text-xl font-bold">{stats.total_logs}</div>
                            <div className="text-[10px] font-bold capitalize tracking-tight text-[var(--text-muted)]">Partidos</div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center shadow-sm">
                            <Star size={16} className="mx-auto mb-1.5 text-yellow-400" />
                            <div className="text-xl font-bold">{stats.avg_rating.toFixed(1)}</div>
                            <div className="text-[10px] font-bold capitalize tracking-tight text-[var(--text-muted)]">Rating</div>
                        </div>
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 text-center shadow-sm">
                            <Trophy size={16} className="mx-auto mb-1.5 text-[var(--accent-green)]" />
                            <div className="text-xl font-bold">{badgeStats.distinct_ligas}</div>
                            <div className="text-[10px] font-bold capitalize tracking-tight text-[var(--text-muted)]">Ligas</div>
                        </div>
                    </div>

                    {/* Badges Overview (Old) */}
                    <BadgeDisplay stats={badgeStats} />
                    
                    <UserBadgesGallery userId={id} isOwnProfile={isOwnProfile} />

                    {/* Recent Logs */}
                    {logs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Film size={14} className="text-[#f59e0b]" />
                                Últimas Reseñas
                            </h3>
                            <div className="space-y-3">
                                {logs.map((log, i) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <MatchLogCard log={log} onLike={toggleLike} />
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

            {/* Follow List Modal */}
            {profile && (
                <FollowListModal
                    isOpen={followModalState.isOpen}
                    onClose={() => setFollowModalState(prev => ({ ...prev, isOpen: false }))}
                    userId={profile.id}
                    type={followModalState.type}
                    title={followModalState.title}
                />
            )}
        </>
    )
}
