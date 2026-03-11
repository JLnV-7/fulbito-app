// src/components/CommentSection.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import { Heart, Reply } from 'lucide-react'
import type { Comentario } from '@/types'
import { Button } from './ui/Button'

interface CommentSectionProps {
    partidoId: string | number
}

export function CommentSection({ partidoId }: CommentSectionProps) {
    const { user } = useAuth()
    const router = useRouter()
    const [comments, setComments] = useState<Comentario[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [replyTo, setReplyTo] = useState<{ username: string; id: string } | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const partidoIdStr = String(partidoId)

    // Cargar comentarios iniciales
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const { data, error } = await supabase
                    .from('comentarios')
                    .select(`
                        *,
                        profile:profiles(username, avatar_url),
                        likes_count:comentario_likes(count)
                    `)
                    .eq('partido_id', partidoIdStr)
                    .order('created_at', { ascending: true })

                if (error) {
                    console.error('Error fetching comments:', error)
                } else if (data) {
                    const processedComments = data.map((c: any) => ({
                        ...c,
                        likes_count: c.likes_count[0]?.count || 0,
                    }))

                    if (user) {
                        const { data: userLikes } = await supabase
                            .from('comentario_likes')
                            .select('comentario_id')
                            .eq('user_id', user.id)

                        const likedIds = new Set(userLikes?.map(l => l.comentario_id) || [])
                        processedComments.forEach(c => c.is_liked = likedIds.has(c.id))
                    }

                    setComments(processedComments)
                    scrollToBottom()
                }
            } catch (err: any) {
                console.error('Error in fetchComments:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchComments()

        // Suscripción a nuevos comentarios
        const channel = supabase
            .channel(`partido:${partidoIdStr}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'comentarios',
                filter: `partido_id=eq.${partidoIdStr}`
            }, async (payload) => {
                const { data } = await supabase
                    .from('comentarios')
                    .select(`*, profile:profiles(username, avatar_url)`)
                    .eq('id', payload.new.id)
                    .single()

                if (data) {
                    setComments(prev => [...prev, data])
                    scrollToBottom()
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partidoIdStr])

    const scrollToBottom = () => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleReply = (username: string, commentId: string) => {
        setReplyTo({ username, id: commentId })
        inputRef.current?.focus()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !newComment.trim() || sending) return

        setSending(true)
        try {
            // Prepend reply mention if replying
            const mensaje = replyTo
                ? `@${replyTo.username} ${newComment.trim()}`
                : newComment.trim()

            const { error } = await supabase
                .from('comentarios')
                .insert({
                    partido_id: partidoIdStr,
                    user_id: user.id,
                    mensaje: newComment.trim(),
                    parent_id: replyTo?.id || null
                })

            if (error) throw error
            setNewComment('')
            setReplyTo(null)
        } catch (error) {
            console.error('Error enviando comentario:', error)
        } finally {
            setSending(false)
        }
    }

    const toggleCommentLike = async (commentId: string) => {
        if (!user) return

        const comment = comments.find(c => c.id === commentId)
        if (!comment) return

        const wasLiked = comment.is_liked

        // Optimistic update
        setComments(prev => prev.map(c =>
            c.id === commentId
                ? { ...c, is_liked: !wasLiked, likes_count: (c.likes_count || 0) + (wasLiked ? -1 : 1) }
                : c
        ))

        try {
            if (wasLiked) {
                await supabase
                    .from('comentario_likes')
                    .delete()
                    .eq('comentario_id', commentId)
                    .eq('user_id', user.id)
            } else {
                await supabase
                    .from('comentario_likes')
                    .insert({ comentario_id: commentId, user_id: user.id })
            }
        } catch {
            // Revert
            setComments(prev => prev.map(c =>
                c.id === commentId
                    ? { ...c, is_liked: wasLiked, likes_count: (c.likes_count || 0) + (wasLiked ? 1 : -1) }
                    : c
            ))
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000)

        if (diff < 1) return 'Ahora'
        if (diff < 60) return `Hace ${diff} min`
        if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`
        return date.toLocaleDateString()
    }

    // Render UI (Teaser for Unauthenticated Users)
    if (!user) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden mb-6 relative" style={{ borderRadius: 'var(--radius)' }}>
                {/* Header */}
                <div className="p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                    <h3 className="text-xs font-black capitalize tracking-widest flex items-center gap-2">
                        💬 Reseñas
                        <span className="bg-[var(--background)] border border-[var(--card-border)] text-[9px] px-2 py-0.5 text-[var(--text-muted)]" style={{ borderRadius: 'var(--radius)' }}>
                            ...
                        </span>
                    </h3>
                </div>

                {/* Blurred Content Teaser */}
                <div className="h-[250px] relative p-4 space-y-4 bg-[var(--background)] overflow-hidden cursor-pointer" onClick={() => router.push('/login')}>
                    <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[3px]" />
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 max-w-[280px] text-center transform scale-105 pointer-events-auto" style={{ borderRadius: 'var(--radius)' }}>
                            <h4 className="font-black text-sm capitalize italic tracking-tighter mb-2 text-[var(--foreground)]">Análisis de los hinchas</h4>
                            <p className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mb-4">Iniciá sesión para leer las reseñas.</p>
                            <Button fullWidth onClick={() => router.push('/login')}>
                                Iniciar sesión
                            </Button>
                        </div>
                    </div>

                    {/* Fake Comments for visual effect */}
                    <div className="flex gap-3 opacity-40 blur-[2px]">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20" />
                        <div>
                            <div className="h-3 w-24 bg-[var(--border)] rounded mb-2" />
                            <div className="h-4 w-48 bg-[var(--border)] rounded" />
                        </div>
                    </div>

                    <div className="text-center absolute bottom-4 left-0 right-0 z-20 pointer-events-none opacity-50 blur-[1px]">
                        <p className="text-[10px] font-black capitalize tracking-widest text-[#16a34a]">Ver más mensajes...</p>
                    </div>
                </div>

                {/* Disabled Input */}
                <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--card-border)] opacity-50 relative pointer-events-none">
                    <input
                        type="text"
                        disabled
                        placeholder="INICIA SESIÓN PARA COMENTAR..."
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] pl-4 pr-12 py-3 text-xs font-black capitalize tracking-widest focus:outline-none"
                        style={{ borderRadius: 'var(--radius)' }}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden mb-6" style={{ borderRadius: 'var(--radius)' }}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                <h3 className="text-xs font-black capitalize tracking-widest flex items-center gap-2">
                    💬 Reseñas
                    <span className="bg-[var(--background)] border border-[var(--card-border)] text-[9px] font-black px-2 py-0.5 text-[var(--text-muted)]" style={{ borderRadius: 'var(--radius)' }}>
                        {comments.length}
                    </span>
                </h3>
            </div>

            {/* Lista de Comentarios */}
            <div className="h-[350px] overflow-y-auto p-4 space-y-3 bg-[var(--background)]">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <LoadingSpinner />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                        <p>Sé el primero en comentar 👇</p>
                    </div>
                ) : (
                    comments
                        .filter(c => !c.parent_id) // Root comments
                        .map((comment) => {
                            const replies = comments.filter(r => r.parent_id === comment.id)

                            return (
                                <div key={comment.id} className="space-y-3">
                                    <CommentItem
                                        comment={comment}
                                        user={user}
                                        onReply={handleReply}
                                        onLike={toggleCommentLike}
                                        formatTime={formatTime}
                                    />

                                    {/* Replies */}
                                    {replies.length > 0 && (
                                        <div className="ml-8 space-y-3 border-l-2 border-[var(--hover-bg)] pl-4">
                                            {replies.map(reply => (
                                                <CommentItem
                                                    key={reply.id}
                                                    comment={reply}
                                                    user={user}
                                                    onReply={handleReply}
                                                    onLike={toggleCommentLike}
                                                    formatTime={formatTime}
                                                    isReply
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--card-border)]">
                {/* Reply indicator */}
                {replyTo && (
                    <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-[#16a34a]/5 border border-[#16a34a]/20" style={{ borderRadius: 'var(--radius)' }}>
                        <span className="text-[10px] text-[#16a34a] font-black capitalize tracking-widest">
                            ↩ Respondiendo a @{replyTo.username}
                        </span>
                        <button
                            onClick={() => setReplyTo(null)}
                            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={replyTo ? `RESPONDER A @${replyTo.username.toUpperCase()}...` : 'ESCRIBIR RESEÑA...'}
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] pl-4 pr-12 py-3 text-xs font-black capitalize tracking-widest focus:outline-none focus:border-[#16a34a] transition-colors placeholder-[var(--text-muted)] text-[var(--foreground)]"
                        style={{ borderRadius: 'var(--radius)' }}
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || sending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#16a34a] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed hover:scale-110 transition-transform"
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    )
}

function CommentItem({
    comment,
    user,
    onReply,
    onLike,
    formatTime,
    isReply = false
}: {
    comment: Comentario
    user: any
    onReply: (username: string, id: string) => void
    onLike: (id: string) => void
    formatTime: (date: string) => string
    isReply?: boolean
}) {
    return (
        <div className="flex gap-3 animate-fade-in group">
            {/* Avatar */}
            <div
                className={`bg-[var(--hover-bg)] border border-[var(--card-border)] flex items-center justify-center flex-shrink-0 text-[10px] font-black overflow-hidden hover:ring-2 hover:ring-[#16a34a]/50 transition-all ${isReply ? 'w-6 h-6' : 'w-8 h-8'}`}
                onClick={(e) => {
                    e.stopPropagation()
                    if (comment.user_id) window.location.href = `/perfil/${comment.user_id}`
                }}
                style={{ borderRadius: 'var(--radius)' }}
            >
                {comment.profile?.avatar_url ? (
                    <img src={comment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    comment.profile?.username?.charAt(0).toUpperCase() || '👤'
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span
                        className="text-[11px] font-black text-[var(--foreground)] cursor-pointer hover:text-[#16a34a] hover:underline transition-colors capitalize italic tracking-tighter"
                        onClick={(e) => {
                            e.stopPropagation()
                            if (comment.user_id) window.location.href = `/perfil/${comment.user_id}`
                        }}
                    >
                        {comment.profile?.username || 'Usuario'}
                    </span>
                    <span className="text-[9px] font-black capitalize tracking-widest text-[var(--text-muted)]">
                        {formatTime(comment.created_at)}
                    </span>
                </div>

                <p className="text-sm text-[var(--foreground)] break-words leading-relaxed opacity-90">
                    {comment.mensaje}
                </p>

                <div className="flex items-center gap-3 mt-1.5">
                    {/* Reply button */}
                    {user && !isReply && (
                        <button
                            onClick={() => onReply(comment.profile?.username || 'Usuario', comment.id)}
                            className="text-[9px] font-black capitalize tracking-widest text-[var(--text-muted)] hover:text-[#16a34a] flex items-center gap-1 transition-colors"
                        >
                            <Reply size={10} />
                            Responder
                        </button>
                    )}

                    {/* Like button */}
                    <button
                        onClick={() => onLike(comment.id)}
                        className={`text-[10px] flex items-center gap-1 transition-all ${comment.is_liked ? 'text-red-500 font-bold' : 'text-[var(--text-muted)] hover:text-red-500'}`}
                    >
                        <Heart size={10} fill={comment.is_liked ? 'currentColor' : 'none'} />
                        {comment.likes_count || 0}
                    </button>
                </div>
            </div>
        </div>
    )
}
