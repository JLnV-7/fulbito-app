// src/components/MatchLogCard.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, MessageCircle, Share2, Eye, EyeOff, Tv, MapPin, Users, HelpCircle, Clock, ListPlus, Flag } from 'lucide-react'
import { StarRatingDisplay } from './StarRating'
import { TeamLogo } from './TeamLogo'
import { AddToListModal } from './AddToListModal'
import { hapticFeedback } from '@/lib/helpers'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import type { MatchLog } from '@/types'

const MATCH_TYPE_META: Record<string, { icon: typeof Tv; label: string; color: string }> = {
    tv: { icon: Tv, label: 'TV', color: '#2563eb' },
    stadium: { icon: MapPin, label: 'Cancha', color: '#16a34a' },
    friend: { icon: Users, label: 'Amigos', color: '#d97706' },
    other: { icon: HelpCircle, label: 'Otro', color: '#7c3aed' },
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
    onLike?: (id: string, type?: string) => void
    compact?: boolean
}

const REACTIONS = [
    { type: 'like', emoji: '❤️', label: 'Like' },
    { type: 'fuego', emoji: '🔥', label: 'Fuego' },
    { type: 'termo', emoji: '🧉', label: 'Termo' },
    { type: 'roja', emoji: '🟥', label: 'Roja' },
]

export function MatchLogCard({ log, onLike, compact = false }: MatchLogCardProps) {
    const router = useRouter()
    const [spoilerRevealed, setSpoilerRevealed] = useState(false)
    const [showAddToList, setShowAddToList] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [showReactions, setShowReactions] = useState(false)
    const [showReportConfirm, setShowReportConfirm] = useState(false)
    const { user } = useAuth()
    const { showToast } = useToast()

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

    const handleReport = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!user) {
            router.push('/login')
            return
        }

        if (!showReportConfirm) {
            setShowReportConfirm(true)
            return
        }

        setReporting(true)
        setShowReportConfirm(false)
        try {
            const { error } = await supabase
                .from('match_log_reports')
                .insert({
                    match_log_id: log.id,
                    reporter_id: user.id,
                    reason: 'Contenido Inapropiado',
                    details: 'Reportado desde la card de reseña.'
                })

            if (error) throw error
            showToast('Reporte enviado. Lo revisaremos a la brevedad.', 'success')
        } catch (err) {
            console.error('Error reporting:', err)
            showToast('Hubo un error al enviar el reporte.', 'error')
        } finally {
            setReporting(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden
                 hover:border-[var(--foreground)] transition-all duration-300 cursor-pointer group"
            style={{ borderRadius: 'var(--radius)' }}
            onClick={() => router.push(`/log/${log.id}`)}
        >
            {/* Header: User info + time */}
            <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
                <div
                    className="w-8 h-8 bg-[var(--foreground)] flex items-center justify-center text-[var(--background)] text-xs font-black shrink-0 cursor-pointer hover:ring-2 hover:ring-[var(--foreground)]/50 transition-all"
                    style={{ borderRadius: 'var(--radius)' }}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (log.user_id) router.push(`/perfil/${log.user_id}`)
                    }}
                >
                    {log.profile?.avatar_url ? (
                        <img src={log.profile.avatar_url} alt="" className="w-full h-full object-cover" style={{ borderRadius: 'var(--radius)' }} />
                    ) : (
                        log.profile?.username?.charAt(0)?.toUpperCase() || '?'
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <span
                        className="text-sm font-black capitalize italic tracking-tighter truncate block cursor-pointer hover:underline transition-colors w-fit"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (log.user_id) router.push(`/perfil/${log.user_id}`)
                        }}
                    >
                        {log.profile?.username || 'Anónimo'}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                        <TypeIcon size={10} style={{ color: typeMeta.color }} />
                        <span>{typeMeta.label}</span>
                        <span>·</span>
                        <Clock size={9} />
                        <span>{timeAgo(log.created_at)}</span>
                    </div>
                </div>
                {log.is_neutral && (
                    <span className="text-[10px] px-1.5 py-0.5 border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] font-black capitalize tracking-widest hidden sm:inline-block">
                        📐 Neutral
                    </span>
                )}
                <div className="flex gap-1">
                    {log.is_neutral && (
                        <span className="sm:hidden text-[10px] px-1.5 py-0.5 border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] font-black shrink-0">
                            📐
                        </span>
                    )}
                    {log.is_private && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold capitalize shrink-0">
                            Privado
                        </span>
                    )}
                </div>
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
            <div className="flex items-center justify-center gap-3 px-4 py-2 border-y border-[var(--card-border)] bg-[var(--background)]/30">
                <StarRatingDisplay value={log.rating_partido} size="md" />
                <span className="text-xl font-black text-[var(--foreground)] italic tracking-tighter tabular-nums">{log.rating_partido.toFixed(1)}</span>
            </div>

            {/* Secondary Ratings Pills */}
            {(log.rating_arbitro || log.rating_atmosfera || log.rating_dt) && (
                <div className="flex gap-2 px-4 pb-2 justify-center flex-wrap">
                    {log.rating_arbitro && log.rating_arbitro > 0 && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 font-black capitalize tracking-widest
                           bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                            🟨 Arb {log.rating_arbitro.toFixed(1)}
                        </span>
                    )}
                    {log.rating_atmosfera && log.rating_atmosfera > 0 && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 font-black capitalize tracking-widest
                           bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                            🏟️ Atm {log.rating_atmosfera.toFixed(1)}
                        </span>
                    )}
                    {log.rating_dt && log.rating_dt > 0 && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 font-black capitalize tracking-widest
                           bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                            🧥 DT {log.rating_dt.toFixed(1)}
                        </span>
                    )}
                    {log.rating_garra && log.rating_garra > 0 && (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 font-black capitalize tracking-widest
                           bg-red-600 text-white border border-red-700" style={{ borderRadius: 'var(--radius)' }}>
                            🔥 Garra {log.rating_garra.toFixed(1)}
                        </span>
                    )}
                </div>
            )}

            {/* Estrella y Villano */}
            {(log.jugador_estrella || log.jugador_villano) && (
                <div className="flex gap-2 px-4 pb-2 justify-center">
                    {log.jugador_estrella && (
                        <span className="text-[10px] px-2 py-0.5 font-black capitalize tracking-widest bg-[var(--foreground)] text-[var(--background)] border border-[var(--foreground)]" style={{ borderRadius: 'var(--radius)' }}>
                            ⭐ {log.jugador_estrella}
                        </span>
                    )}
                    {log.jugador_villano && (
                        <span className="text-[10px] px-2 py-0.5 font-black capitalize tracking-widest bg-red-600 text-white border border-red-700" style={{ borderRadius: 'var(--radius)' }}>
                            😈 {log.jugador_villano}
                        </span>
                    )}
                </div>
            )}

            {/* Photo */}
            {log.foto_url && !compact && (
                <div className="px-4 pb-3">
                    <div className="overflow-hidden border border-[var(--card-border)] max-h-48 grayscale hover:grayscale-0 transition-all" style={{ borderRadius: 'var(--radius)' }}>
                        <img src={log.foto_url} alt="Momento del partido" className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            {log.review_title && (
                                <h4 className="text-sm font-semibold mb-1">{log.review_title}</h4>
                            )}
                            <p className="text-xs text-[var(--text-muted)] line-clamp-3 leading-relaxed">
                                {log.review_text}
                            </p>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Tags */}
            {log.tags && log.tags.length > 0 && !compact && (
                <div className="flex gap-1 px-4 pb-3 flex-wrap">
                    {log.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 font-black capitalize tracking-widest border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-muted)]" style={{ borderRadius: 'var(--radius)' }}>
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center gap-1 px-2 py-2 border-t border-[var(--card-border)] relative z-10">
                <div className="relative">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            hapticFeedback(15);
                            if (log.is_liked) {
                                onLike?.(log.id, log.my_reaction);
                            } else {
                                setShowReactions(!showReactions);
                            }
                        }}
                        onMouseEnter={() => setShowReactions(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black transition-all group/heart
                            ${log.is_liked
                                ? 'text-red-600 bg-red-600/10'
                                : 'text-[var(--text-muted)] hover:text-red-600 hover:bg-black/5'
                            }`}
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <motion.div
                            animate={log.is_liked ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {log.is_liked ? (
                                <span className="text-sm">
                                    {REACTIONS.find(r => r.type === log.my_reaction)?.emoji || '❤️'}
                                </span>
                            ) : (
                                <Heart
                                    size={16}
                                    className={`${log.is_liked ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : ''}`}
                                />
                            )}
                        </motion.div>
                        {(log.likes_count || 0) > 0 && (
                            <motion.span
                                key={log.likes_count}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="tabular-nums"
                            >
                                {log.likes_count}
                            </motion.span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showReactions && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                onMouseLeave={() => setShowReactions(false)}
                                className="absolute bottom-full left-0 mb-2 p-1 bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl flex gap-1 z-[60]"
                                style={{ borderRadius: '20px' }}
                            >
                                {REACTIONS.map((r) => (
                                    <button
                                        key={r.type}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            hapticFeedback(20);
                                            onLike?.(log.id, r.type);
                                            setShowReactions(false);
                                        }}
                                        className={`w-10 h-10 flex items-center justify-center text-lg hover:bg-[var(--hover-bg)] transition-colors
                                            ${log.my_reaction === r.type ? 'bg-[var(--accent)]/10' : ''}`}
                                        style={{ borderRadius: '50%' }}
                                        title={r.label}
                                    >
                                        {r.emoji}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); router.push(`/log/${log.id}`) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black
                   text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-600/5 transition-all"
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    <MessageCircle size={14} />
                </button>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowAddToList(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black
                   text-[var(--text-muted)] hover:text-[#16a34a] hover:bg-[#16a34a]/5 transition-all"
                    style={{ borderRadius: 'var(--radius)' }}
                    title="Añadir a una lista"
                >
                    <ListPlus size={14} />
                </button>
                <div className="flex-1" />
                <div className="relative">
                    <AnimatePresence>
                        {showReportConfirm && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute bottom-full right-0 mb-2 p-2 bg-[var(--card-bg)] border border-red-500/30 shadow-xl flex items-center gap-2 z-[60]"
                                style={{ borderRadius: 'var(--radius)' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <span className="text-xs text-[var(--text-muted)]">¿Reportar?</span>
                                <button
                                    onClick={handleReport}
                                    className="text-xs font-black px-2 py-1 bg-red-600 text-white"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >Sí</button>
                                <button
                                    onClick={e => { e.stopPropagation(); setShowReportConfirm(false) }}
                                    className="text-xs font-black px-2 py-1 bg-[var(--hover-bg)] text-[var(--text-muted)]"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >No</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button
                        type="button"
                        onClick={handleReport}
                        disabled={reporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black
                           text-[var(--text-muted)] hover:text-red-600 hover:bg-red-600/5 transition-all disabled:opacity-50"
                        style={{ borderRadius: 'var(--radius)' }}
                        title="Reportar contenido"
                    >
                        <Flag size={14} className={reporting ? 'animate-pulse' : ''} />
                    </button>
                </div>
            </div>

            {/* List Modal - Mounted only when needed so it doesn't cause hydration or bubbling issues */}
            {showAddToList && (
                <div onClick={(e) => e.stopPropagation()}>
                    <AddToListModal
                        isOpen={showAddToList}
                        onClose={() => setShowAddToList(false)}
                        matchData={{
                            partido_id: log.partido_id?.toString() || log.id,
                            equipo_local: log.equipo_local,
                            equipo_visitante: log.equipo_visitante,
                            logo_local: log.logo_local,
                            logo_visitante: log.logo_visitante
                        }}
                    />
                </div>
            )}
        </motion.div>
    )
}
