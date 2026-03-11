// src/components/CommunityHighlights.tsx
// Shows best-rated matches + popular reviews on the Home page
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { TeamLogo } from '@/components/TeamLogo'
import { Star, TrendingUp, MessageSquare } from 'lucide-react'

interface TopMatch {
    equipo_local: string
    equipo_visitante: string
    logo_local?: string
    logo_visitante?: string
    goles_local?: number
    goles_visitante?: number
    liga?: string
    avg_rating: number
    total_logs: number
}

interface PopularReview {
    id: string
    equipo_local: string
    equipo_visitante: string
    goles_local?: number
    goles_visitante?: number
    rating_partido: number
    review_text: string
    mood?: string
    username: string
    avatar_url?: string
    likes_count: number
}

const MOOD_MAP: Record<string, string> = {
    euforia: '🤩', contento: '😊', indiferente: '😐',
    caliente: '😤', destruido: '😢', locura: '🤯',
}

export function CommunityHighlights() {
    const [topMatches, setTopMatches] = useState<TopMatch[]>([])
    const [popularReviews, setPopularReviews] = useState<PopularReview[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchHighlights = async () => {
            try {
                // Fetch top-rated matches (aggregate from match_logs)
                const { data: logsData } = await supabase
                    .from('match_logs')
                    .select('equipo_local, equipo_visitante, logo_local, logo_visitante, goles_local, goles_visitante, liga, rating_partido')
                    .eq('is_private', false)
                    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false })
                    .limit(100)

                if (logsData && logsData.length > 0) {
                    // Group by match (local vs visitante) and compute averages
                    const matchMap = new Map<string, { entries: typeof logsData; sum: number }>()

                    for (const log of logsData) {
                        const key = `${log.equipo_local}-${log.equipo_visitante}`
                        const existing = matchMap.get(key) || { entries: [], sum: 0 }
                        existing.entries.push(log)
                        existing.sum += log.rating_partido
                        matchMap.set(key, existing)
                    }

                    const ranked = Array.from(matchMap.entries())
                        .filter(([_, v]) => v.entries.length >= 2) // At least 2 logs
                        .map(([_, v]) => {
                            const first = v.entries[0]
                            return {
                                equipo_local: first.equipo_local,
                                equipo_visitante: first.equipo_visitante,
                                logo_local: first.logo_local,
                                logo_visitante: first.logo_visitante,
                                goles_local: first.goles_local,
                                goles_visitante: first.goles_visitante,
                                liga: first.liga,
                                avg_rating: Math.round((v.sum / v.entries.length) * 10) / 10,
                                total_logs: v.entries.length,
                            }
                        })
                        .sort((a, b) => b.avg_rating - a.avg_rating)
                        .slice(0, 3)

                    setTopMatches(ranked)
                }

                // Fetch popular reviews (most recent with text)
                const { data: reviewsData } = await supabase
                    .from('match_logs')
                    .select('id, equipo_local, equipo_visitante, goles_local, goles_visitante, rating_partido, review_text, mood, user_id')
                    .eq('is_private', false)
                    .not('review_text', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (reviewsData && reviewsData.length > 0) {
                    // Fetch usernames for these reviews
                    const userIds = [...new Set(reviewsData.map(r => r.user_id))]
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id, username, avatar_url')
                        .in('id', userIds)

                    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

                    const reviews: PopularReview[] = reviewsData
                        .filter(r => r.review_text && r.review_text.length > 10)
                        .slice(0, 3)
                        .map(r => ({
                            id: r.id,
                            equipo_local: r.equipo_local,
                            equipo_visitante: r.equipo_visitante,
                            goles_local: r.goles_local,
                            goles_visitante: r.goles_visitante,
                            rating_partido: r.rating_partido,
                            review_text: r.review_text!,
                            mood: r.mood,
                            username: profileMap.get(r.user_id)?.username || 'Anónimo',
                            avatar_url: profileMap.get(r.user_id)?.avatar_url,
                            likes_count: 0,
                        }))

                    setPopularReviews(reviews)
                }
            } catch (err) {
                console.error('Error fetching community highlights:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchHighlights()
    }, [])

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl" />
            </div>
        )
    }

    // Fallback Mock State if no data
    if (topMatches.length === 0 && popularReviews.length === 0) {
        return (
            <div className="space-y-4 opacity-70">
                <span className="text-[10px] font-black capitalize text-[var(--accent)] tracking-widest block text-center">Datos de Ejemplo</span>
                
                {/* Mock Top Matches */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm pointer-events-none">
                    <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-2">
                        <TrendingUp size={14} className="text-[var(--accent)]" />
                        <h3 className="text-xs font-black capitalize tracking-widest">Partidos mejor calificados</h3>
                    </div>
                    <div className="divide-y divide-[var(--card-border)]">
                        <div className="flex items-center gap-3 p-3">
                            <span className="text-sm font-black text-[var(--text-muted)] w-5 text-center">1</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate">Boca Juniors 1-1 River Plate</div>
                                <div className="text-[10px] text-[var(--text-muted)]">Liga Profesional</div>
                            </div>
                            <div className="flex items-center gap-1 bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-1 rounded-full border border-[#f59e0b]/20">
                                <Star size={10} className="fill-[#f59e0b]" />
                                <span className="text-xs font-black">9.5</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mock Popular Reviews */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm pointer-events-none">
                    <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-2">
                        <MessageSquare size={14} className="text-[var(--accent-blue)]" />
                        <h3 className="text-xs font-black capitalize tracking-widest">Reseñas de la comunidad</h3>
                    </div>
                    <div className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">UsuarioEjemplo</span>
                            <span className="text-[10px] text-[var(--text-muted)]">·</span>
                            <span className="text-[10px] font-medium">Boca Juniors 1-1 River Plate</span>
                        </div>
                        <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed">
                            "Un partido increíble, de ida y vuelta constante. Los dos equipos dejaron todo en la cancha."
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Top Rated Matches */}
            {topMatches.length > 0 && (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-2">
                        <TrendingUp size={14} className="text-[var(--accent)]" />
                        <h3 className="text-xs font-black capitalize tracking-widest">Partidos mejor calificados</h3>
                    </div>
                    <div className="divide-y divide-[var(--card-border)]">
                        {topMatches.map((match, i) => (
                            <motion.div
                                key={`${match.equipo_local}-${match.equipo_visitante}`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 p-3"
                            >
                                <span className="text-sm font-black text-[var(--text-muted)] w-5 text-center">
                                    {i + 1}
                                </span>
                                <div className="flex items-center -space-x-2 shrink-0">
                                    <TeamLogo src={match.logo_local} teamName={match.equipo_local} size={22} className="ring-2 ring-[var(--card-bg)]" />
                                    <TeamLogo src={match.logo_visitante} teamName={match.equipo_visitante} size={22} className="ring-2 ring-[var(--card-bg)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold truncate">
                                        {match.equipo_local} {match.goles_local != null ? `${match.goles_local}-${match.goles_visitante}` : 'vs'} {match.equipo_visitante}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-muted)]">{match.total_logs} reseñas</div>
                                </div>
                                <div className="flex items-center gap-1 bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-1 rounded-full border border-[#f59e0b]/20">
                                    <Star size={10} className="fill-[#f59e0b]" />
                                    <span className="text-xs font-black">{match.avg_rating}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Popular Reviews */}
            {popularReviews.length > 0 && (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center gap-2">
                        <MessageSquare size={14} className="text-[var(--accent-blue)]" />
                        <h3 className="text-xs font-black capitalize tracking-widest">Reseñas de la comunidad</h3>
                    </div>
                    <div className="divide-y divide-[var(--card-border)]">
                        {popularReviews.map((review, i) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link href={`/log/${review.id}`} className="block p-3 hover:bg-[var(--hover-bg)] transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center text-[10px]">
                                            {review.avatar_url || '👤'}
                                        </div>
                                        <span className="text-[10px] font-bold text-[var(--text-muted)]">{review.username}</span>
                                        <span className="text-[10px] text-[var(--text-muted)]">·</span>
                                        <span className="text-[10px] font-medium">
                                            {review.equipo_local} {review.goles_local != null ? `${review.goles_local}-${review.goles_visitante}` : 'vs'} {review.equipo_visitante}
                                        </span>
                                        <div className="ml-auto flex items-center gap-0.5">
                                            <Star size={9} className="text-[#f59e0b] fill-[#f59e0b]" />
                                            <span className="text-[10px] font-black">{review.rating_partido}</span>
                                            {review.mood && MOOD_MAP[review.mood] && (
                                                <span className="text-xs ml-1">{MOOD_MAP[review.mood]}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed">
                                        "{review.review_text.slice(0, 150)}{review.review_text.length > 150 ? '...' : ''}"
                                    </p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
