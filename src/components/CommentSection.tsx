// src/components/CommentSection.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from './LoadingSpinner'
import type { Comentario } from '@/types'

interface CommentSectionProps {
    partidoId: string | number
}

export function CommentSection({ partidoId }: CommentSectionProps) {
    const { user } = useAuth()
    const [comments, setComments] = useState<Comentario[]>([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

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
            } catch (err) {
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
                // Fetch del nuevo comentario para tener el perfil
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !newComment.trim() || sending) return

        setSending(true)
        try {
            const { error } = await supabase
                .from('comentarios')
                .insert({
                    partido_id: partidoIdStr,
                    user_id: user.id,
                    mensaje: newComment.trim()
                })

            if (error) throw error
            setNewComment('')
        } catch (error) {
            console.error('Error enviando comentario:', error)
            alert('Error al enviar el comentario')
        } finally {
            setSending(false)
        }
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 60000) // minutos

        if (diff < 1) return 'Ahora'
        if (diff < 60) return `Hace ${diff} min`
        if (diff < 1440) return `Hace ${Math.floor(diff / 60)} h`
        return date.toLocaleDateString()
    }

    return (
        <div className="bg-[#242424] border border-[#333333] rounded-xl overflow-hidden mt-6">
            {/* Header */}
            <div className="p-4 border-b border-[#333333] bg-[#1e1e1e]">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                    💬 Chat en vivo
                    <span className="bg-[#333] text-xs px-2 py-0.5 rounded-full text-[#909090]">
                        {comments.length}
                    </span>
                </h3>
            </div>

            {/* Lista de Comentarios */}
            <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-[#1a1a1a]">
                {loading ? (
                    <div className="flex justify-center py-4">
                        <LoadingSpinner />
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-[#606060] text-sm">
                        <p>Sé el primero en comentar 👇</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 animate-fade-in">
                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-[#333] border border-[#444] flex items-center justify-center flex-shrink-0 text-xs overflow-hidden shadow-sm">
                                {comment.profile?.avatar_url || '👤'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-0.5">
                                    <span className="text-xs font-bold text-[#f5f5f5]">
                                        {comment.profile?.username || 'Usuario'}
                                    </span>
                                    <span className="text-[10px] text-[#606060]">
                                        {formatTime(comment.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm text-[#d4d4d4] break-words leading-relaxed">
                                    {comment.mensaje}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#1e1e1e] border-t border-[#333333]">
                {user ? (
                    <form onSubmit={handleSubmit} className="relative">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="w-full bg-[#2a2a2a] border border-[#333] rounded-lg pl-4 pr-12 py-3 text-sm
                       focus:outline-none focus:border-[#ff6b6b] transition-colors
                       placeholder-[#606060] text-[#f5f5f5]"
                            maxLength={500}
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || sending}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5
                       text-[#ff6b6b] disabled:text-[#404040] disabled:cursor-not-allowed
                       hover:scale-110 transition-transform"
                        >
                            ➤
                        </button>
                    </form>
                ) : (
                    <div className="text-center py-2">
                        <a href="/login" className="text-sm text-[#ff6b6b] hover:underline font-medium">
                            Iniciá sesión para comentar
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}
