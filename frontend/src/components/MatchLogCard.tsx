// src/components/MatchLogCard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Eye, EyeOff, Tv, MapPin, Users, HelpCircle, Clock } from 'lucide-react'
import { StarRatingDisplay } from './StarRating'
import { TeamLogo } from './TeamLogo'
import type { MatchLog } from '@/types'

const MATCH_TYPE_META: Record<string, { icon: typeof Tv; label: string; color: string }> = {
    tv: { icon: Tv, label: 'TV', color: '#3b82f6' },
    stadium: { icon: MapPin, label: 'Cancha', color: '#10b981' },
    friend: { icon: Users, label: 'Amigos', color: '#f59e0b' },
    other: { icon: HelpCircle, label: 'Otro', color: '#8b5cf6' },
}

function timeAgo(date: string): string {
    const now = new Date()
    const d = new Date(date)
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

interface MatchLogCardProps {
    log: MatchLog
    onLike?: (id: string) => void
    compact?: boolean
}

export function MatchLogCard({ log, onLike, compact = false }: MatchLogCardProps) {
    const router = useRouter()
    const [spoilerRevealed, setSpoilerRevealed] = useState(false)
    const typeMeta = MATCH_TYPE_META[log.match_type] || MATCH_TYPE_META.other
    const TypeIcon = typeMeta.icon

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${log.equipo_local} vs ${log.equipo_visitante}`,
                    text: log.review_title || `Rating: ${log.rating_partido}/5`,
                    url: `${window.location.origin}/log/${log.id}`,
                })
            } catch { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(`${window.location.origin}/log/${log.id}`)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden
                 hover:border-[var(--text-muted)]/30 transition-all duration-300 cursor-pointer group"
            onClick={() => router.push(`/log/${log.id}`)}
        >
            {/* Header: User info + time */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center
                       text-white text-xs font-bold shrink-0">
                    {log.profile?.avatar_url ? (
                        <img src={log.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        log.profile?.username?.charAt(0)?.toUpperCase() || '?'
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold truncate block">{log.profile?.username || 'Anónimo'}</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                        <TypeIcon size={10} style={{ color: typeMeta.color }} />
                        <span>{typeMeta.label}</span>
                        <span>·</span>
                        <Clock size={9} />
                        <span>{timeAgo(log.created_at)}</span>
                    </div>
                </div>
                {log.is_private && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 font-medium">
                        Privado
                    </span>
                )}
            </div>

            {/* Match Info */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo src={log.logo_local} teamName={log.equipo_local} size={24} />
                        <span className="text-sm font-semibold truncate">{log.equipo_local}</span>
                    </div>

                    {log.goles_local != null && log.goles_visitante != null ? (
                        <div className="text-center px-2">
                            <div className="text-lg font-bold tabular-nums tracking-wider">
                                {log.goles_local} - {log.goles_visitante}
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-[var(--text-muted)] px-2">vs</div>
                    )}

                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-semibold truncate text-right">{log.equipo_visitante}</span>
                        <TeamLogo src={log.logo_visitante} teamName={log.equipo_visitante} size={24} />
                    </div>
                </div>
                {log.liga && (
                    <div className="text-[10px] text-[var(--text-muted)] text-center mt-1">{log.liga}</div>
                )}
            </div>

            {/* Rating Stars - prominent */}
            <div className="flex items-center justify-center gap-3 px-4 py-2">
                <StarRatingDisplay value={log.rating_partido} size="md" />
                <span className="text-sm font-bold text-[#f59e0b] tabular-nums">{log.rating_partido.toFixed(1)}</span>
            </div>

            {/* Secondary Ratings Pills */}
            {(log.rating_arbitro || log.rating_atmosfera) && (
                <div className="flex gap-2 px-4 pb-2 justify-center">
                    {log.rating_arbitro && log.rating_arbitro > 0 && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                           bg-[var(--hover-bg)] text-[var(--text-muted)]">
                            🟨 Árbitro {log.rating_arbitro.toFixed(1)}
                        </span>
                    )}
                    {log.rating_atmosfera && log.rating_atmosfera > 0 && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
                           bg-[var(--hover-bg)] text-[var(--text-muted)]">
                            🏟️ Atmósfera {log.rating_atmosfera.toFixed(1)}
                        </span>
                    )}
                </div>
            )}

            {/* Review Preview */}
            {log.review_text && !compact && (
                <div className="px-4 pb-3">
                    {log.is_spoiler && !spoilerRevealed ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); setSpoilerRevealed(true) }}
                            className="flex items-center gap-2 w-full p-3 rounded-xl bg-red-500/5 border border-red-500/20
                       text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <EyeOff size={14} />
                            <span>Esta reseña contiene spoilers — tocar para revelar</span>
                        </button>
                    ) : (
                        <div>
                            {log.review_title && (
                                <h4 className="text-sm font-semibold mb-1">{log.review_title}</h4>
                            )}
                            <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                                {log.review_text}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Tags */}
            {log.tags && log.tags.length > 0 && !compact && (
                <div className="flex gap-1 px-4 pb-3 flex-wrap">
                    {log.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] font-medium">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-1 px-2 py-2 border-t border-[var(--card-border)]">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onLike?.(log.id) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${log.is_liked
                        ? 'text-red-500 bg-red-500/10'
                        : 'text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/5'
                        }`}
                >
                    <Heart size={14} fill={log.is_liked ? 'currentColor' : 'none'}
                        className={log.is_liked ? 'animate-bounce-in' : ''} />
                    {(log.likes_count || 0) > 0 && <span>{log.likes_count}</span>}
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); router.push(`/log/${log.id}`) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                   text-[var(--text-muted)] hover:text-[#3b82f6] hover:bg-[#3b82f6]/5 transition-all"
                >
                    <MessageCircle size={14} />
                </button>
                <div className="flex-1" />
                <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                   text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all"
                >
                    <Share2 size={14} />
                </button>
            </div>
        </motion.div>
    )
}
