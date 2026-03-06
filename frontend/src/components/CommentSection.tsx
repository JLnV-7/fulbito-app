// src/components/CommentSection.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import type { Comentario } from '@/types'

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
          profile:profiles(username, avatar_url)
        `)
                    .eq('partido_id', partidoIdStr)
                    .order('created_at', { ascending: true })

                if (error) {
                    console.error('Error fetching comments:', error)
                } else if (data) {
                    setComments(data)
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
                    mensaje
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

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000)

        if (diff < 1) return 'Ahora'
        if (diff < 60) return `Hace ${diff} min`
        if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`
        return date.toLocaleDateString()
    }

    // Check if message is a reply (starts with @username)
    const parseMessage = (mensaje: string) => {
        const match = mensaje.match(/^@(\S+)\s(.*)/)
        if (match) {
            return { replyToUser: match[1], text: match[2] }
        }
        return { replyToUser: null, text: mensaje }
    }

    // Render UI (Teaser for Unauthenticated Users)
    if (!user) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden mb-6 relative">
                {/* Header */}
                <div className="p-4 border-b border-[var(--card-border)] bg-[var(--background)]">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        💬 Reseñas
                        <span className="bg-[var(--hover-bg)] text-xs px-2 py-0.5 rounded-full text-[var(--text-muted)]">
                            ...
                        </span>
                    </h3>
                </div>

                {/* Blurred Content Teaser */}
                <div className="h-[250px] relative p-4 space-y-4 bg-[var(--background)] overflow-hidden cursor-pointer" onClick={() => router.push('/login')}>
                    <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[3px]" />
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 rounded-2xl shadow-xl max-w-[280px] text-center transform scale-105 pointer-events-auto">
                            <h4 className="font-black text-lg mb-2 text-[var(--foreground)]">¿Qué opinan los hinchas?</h4>
                            <p className="text-sm text-[var(--text-muted)] mb-4">Iniciá sesión para leer las reseñas y dejar tu propio análisis del partido.</p>
                            <a href="/login" className="inline-block w-full bg-[var(--accent-green)] text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer hover:bg-[#009040] transition-colors">
                                Entrar a la cancha
                            </a>
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
                    <div className="flex gap-3 opacity-30 blur-[2px]">
                        <div className="w-8 h-8 rounded-full bg-red-500/20" />
                        <div>
                            <div className="h-3 w-32 bg-[var(--border)] rounded mb-2" />
                            <div className="h-4 w-56 bg-[var(--border)] rounded" />
                        </div>
                    </div>
                    <div className="flex gap-3 opacity-20 blur-[2px]">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20" />
                        <div>
                            <div className="h-3 w-20 bg-[var(--border)] rounded mb-2" />
                            <div className="h-4 w-40 bg-[var(--border)] rounded" />
                        </div>
                    </div>
                </div>

                {/* Disabled Input */}
                <div className="p-4 bg-[var(--card-bg)] border-t border-[var(--card-border)] opacity-50 relative pointer-events-none">
                    <input
                        type="text"
                        disabled
                        placeholder="Iniciá sesión para comentar..."
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none"
                    />
                    <button
                        disabled
                        className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-muted)]"
                    >
                        ➤
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden mb-6">
            {/* Header */}
            <div className="p-4 border-b border-[var(--card-border)] bg-[var(--background)]">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    💬 Reseñas
                    <span className="bg-[var(--hover-bg)] text-xs px-2 py-0.5 rounded-full text-[var(--text-muted)]">
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
                    comments.map((comment) => {
                        const { replyToUser, text } = parseMessage(comment.mensaje)

                        return (
                            <div key={comment.id} className="flex gap-3 animate-fade-in group">
                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full bg-[var(--hover-bg)] border border-[var(--card-border)] flex items-center justify-center flex-shrink-0 text-xs overflow-hidden shadow-sm">
                                    {comment.profile?.avatar_url || '👤'}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-[var(--foreground)]">
                                            {comment.profile?.username || 'Usuario'}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-muted)]">
                                            {formatTime(comment.created_at)}
                                        </span>
                                    </div>

                                    {/* Reply indicator */}
                                    {replyToUser && (
                                        <span className="text-[10px] text-[#10b981] font-medium">
                                            ↩ @{replyToUser}{' '}
                                        </span>
                                    )}

                                    <p className="text-sm text-[var(--foreground)] break-words leading-relaxed opacity-90 inline">
                                        {text}
                                    </p>

                                    {/* Reply button */}
                                    {user && (
                                        <button
                                            onClick={() => handleReply(
                                                comment.profile?.username || 'Usuario',
                                                comment.id
                                            )}
                                            className="block text-[10px] text-[var(--text-muted)] hover:text-[#10b981] 
                                                       mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity font-medium"
                                        >
                                            Responder
                                        </button>
                                    )}
                                </div>
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
                    <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-[#10b981]/5 rounded-lg border border-[#10b981]/20">
                        <span className="text-[10px] text-[#10b981] font-medium">
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
                        placeholder={replyTo ? `Responder a @${replyTo.username}...` : 'Escribe un comentario...'}
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg pl-4 pr-12 py-3 text-sm
                    focus:outline-none focus:border-[#10b981] transition-colors
                    placeholder-[var(--text-muted)] text-[var(--foreground)]"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || sending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5
                    text-[#10b981] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed
                    hover:scale-110 transition-transform"
                    >
                        ➤
                    </button>
                </form>
            </div>
        </div>
    )
}
