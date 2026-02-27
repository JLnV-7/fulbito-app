// src/app/log/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ArrowLeft, Heart, Share2, Tv, MapPin, Users, HelpCircle,
    Eye, EyeOff, Clock, User, UserPlus, UserCheck
} from 'lucide-react'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { StarRating, StarRatingDisplay } from '@/components/StarRating'
import { TeamLogo } from '@/components/TeamLogo'
import { CommentSection } from '@/components/CommentSection'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useMatchLogs } from '@/hooks/useMatchLogs'
import { useFollows } from '@/hooks/useMatchLogs'
import { useAuth } from '@/contexts/AuthContext'
import type { MatchLog } from '@/types'

const MATCH_TYPE_META: Record<string, { icon: typeof Tv; label: string; color: string }> = {
    tv: { icon: Tv, label: 'Lo vio por TV', color: '#3b82f6' },
    stadium: { icon: MapPin, label: 'En la cancha', color: '#10b981' },
    friend: { icon: Users, label: 'Con amigos', color: '#f59e0b' },
    other: { icon: HelpCircle, label: 'Otro', color: '#8b5cf6' },
}

export default function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { user } = useAuth()
    const { getMatchLog, toggleLike } = useMatchLogs()
    const { isFollowing, toggleFollow } = useFollows()
    const [log, setLog] = useState<MatchLog | null>(null)
    const [loading, setLoading] = useState(true)
    const [spoilerRevealed, setSpoilerRevealed] = useState(false)

    useEffect(() => {
        const fetch = async () => {
            setLoading(true)
            const data = await getMatchLog(id)
            setLog(data)
            setLoading(false)
        }
        fetch()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const handleLike = async () => {
        if (!log || !user) return
        await toggleLike(log.id)
        setLog(prev => prev ? {
            ...prev,
            is_liked: !prev.is_liked,
            likes_count: (prev.likes_count || 0) + (prev.is_liked ? -1 : 1),
        } : null)
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${log?.equipo_local} vs ${log?.equipo_visitante}`,
                    url: window.location.href,
                })
            } catch { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(window.location.href)
        }
    }

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

    if (!log) {
        return (
            <>
                <DesktopNav />
                <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                    <div className="flex flex-col items-center justify-center py-16">
                        <span className="text-4xl mb-4">😕</span>
                        <h2 className="text-lg font-bold mb-1">Reseña no encontrada</h2>
                        <p className="text-sm text-[var(--text-muted)] mb-4">Puede que haya sido eliminada o sea privada.</p>
                        <button onClick={() => router.push('/feed')} className="px-4 py-2 bg-[#f59e0b] text-white rounded-xl text-sm font-semibold">
                            Ir al feed
                        </button>
                    </div>
                </main>
                <NavBar />
            </>
        )
    }

    const typeMeta = MATCH_TYPE_META[log.match_type] || MATCH_TYPE_META.other
    const TypeIcon = typeMeta.icon
    const isOwner = user?.id === log.user_id

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={handleLike}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${log.is_liked ? 'text-red-500 bg-red-500/10' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                                }`}
                        >
                            <Heart size={16} fill={log.is_liked ? 'currentColor' : 'none'} />
                            {(log.likes_count || 0) > 0 && <span>{log.likes_count}</span>}
                        </button>
                        <button onClick={handleShare}
                            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--hover-bg)] transition-colors">
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 space-y-5">
                    {/* User Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center
                           text-white text-sm font-bold shrink-0">
                            {log.profile?.avatar_url ? (
                                <img src={log.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                log.profile?.username?.charAt(0)?.toUpperCase() || '?'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold">{log.profile?.username || 'Anónimo'}</div>
                            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                                <TypeIcon size={12} style={{ color: typeMeta.color }} />
                                <span>{typeMeta.label}</span>
                                <span>·</span>
                                <Clock size={10} />
                                <span>{new Date(log.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                        {!isOwner && user && (
                            <button
                                onClick={() => toggleFollow(log.user_id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${isFollowing(log.user_id)
                                    ? 'border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981]'
                                    : 'border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                    }`}
                            >
                                {isFollowing(log.user_id) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                                {isFollowing(log.user_id) ? 'Siguiendo' : 'Seguir'}
                            </button>
                        )}
                    </div>

                    {/* Match Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-1 flex-1">
                                <TeamLogo src={log.logo_local} teamName={log.equipo_local} size={48} />
                                <span className="text-xs font-semibold text-center">{log.equipo_local}</span>
                            </div>
                            <div className="text-center">
                                {log.goles_local != null && log.goles_visitante != null ? (
                                    <div className="text-2xl font-bold tabular-nums">
                                        {log.goles_local} - {log.goles_visitante}
                                    </div>
                                ) : (
                                    <span className="text-sm text-[var(--text-muted)]">vs</span>
                                )}
                                {log.liga && (
                                    <div className="text-[10px] text-[var(--text-muted)] mt-1">{log.liga}</div>
                                )}
                                <div className="text-[10px] text-[var(--text-muted)]">
                                    {new Date(log.fecha_partido).toLocaleDateString('es-AR')}
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1 flex-1">
                                <TeamLogo src={log.logo_visitante} teamName={log.equipo_visitante} size={48} />
                                <span className="text-xs font-semibold text-center">{log.equipo_visitante}</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Ratings Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4"
                    >
                        {/* Main Rating */}
                        <div className="text-center">
                            <div className="text-xs text-[var(--text-muted)] mb-2">Rating del partido</div>
                            <div className="flex items-center justify-center gap-3">
                                <StarRatingDisplay value={log.rating_partido} size="md" />
                                <span className="text-xl font-bold text-[#f59e0b]">{log.rating_partido.toFixed(1)}</span>
                            </div>
                        </div>

                        {/* Secondary Ratings */}
                        {(log.rating_arbitro || log.rating_atmosfera) && (
                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--card-border)]">
                                {log.rating_arbitro && log.rating_arbitro > 0 && (
                                    <div className="text-center">
                                        <div className="text-[10px] text-[var(--text-muted)] mb-1">🟨 Árbitro</div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <StarRatingDisplay value={log.rating_arbitro} size="sm" />
                                            <span className="text-xs font-bold">{log.rating_arbitro.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                                {log.rating_atmosfera && log.rating_atmosfera > 0 && (
                                    <div className="text-center">
                                        <div className="text-[10px] text-[var(--text-muted)] mb-1">🏟️ Atmósfera</div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <StarRatingDisplay value={log.rating_atmosfera} size="sm" color="#10b981" />
                                            <span className="text-xs font-bold">{log.rating_atmosfera.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Player Ratings */}
                    {log.player_ratings && log.player_ratings.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5"
                        >
                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                <User size={14} className="text-[var(--text-muted)]" />
                                Jugadores destacados
                            </h3>
                            <div className="space-y-2">
                                {log.player_ratings.map((pr) => (
                                    <div key={pr.id} className="flex items-center gap-3 py-1.5">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium">{pr.player_name}</div>
                                            <div className="text-[10px] text-[var(--text-muted)]">
                                                {pr.player_team === 'local' ? log.equipo_local : log.equipo_visitante}
                                            </div>
                                        </div>
                                        <StarRatingDisplay value={pr.rating} size="sm" />
                                        <span className="text-xs font-bold tabular-nums w-7 text-right">{pr.rating.toFixed(1)}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Review */}
                    {log.review_text && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5"
                        >
                            {log.is_spoiler && !spoilerRevealed ? (
                                <button
                                    onClick={() => setSpoilerRevealed(true)}
                                    className="flex items-center gap-2 w-full p-4 rounded-xl bg-red-500/5 border border-red-500/20
                           text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <EyeOff size={16} />
                                    <span>Esta reseña contiene spoilers — tocar para revelar</span>
                                </button>
                            ) : (
                                <div>
                                    {log.review_title && (
                                        <h3 className="text-base font-bold mb-3">{log.review_title}</h3>
                                    )}
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-[var(--foreground)]/90">
                                        {log.review_text}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Tags */}
                    {log.tags && log.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                            {log.tags.map(tag => (
                                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Comments */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <CommentSection partidoId={log.id} />
                    </motion.div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
