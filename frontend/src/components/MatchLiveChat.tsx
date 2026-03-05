// src/components/MatchLiveChat.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Users, MoreVertical, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useMatchChat, type ChatMessage } from '@/hooks/useMatchChat'
import { useToast } from '@/contexts/ToastContext'

interface MatchLiveChatProps {
    partidoId: string
}

function timeAgoShort(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const diffMins = Math.floor(diff / 60000)
    const diffHours = Math.floor(diffMins / 60)

    if (diffMins < 1) return 'ahora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    return new Date(date).toLocaleDateString()
}

export function MatchLiveChat({ partidoId }: MatchLiveChatProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const { messages, loading, onlineUsers, sendMessage, deleteMessage } = useMatchChat(partidoId)

    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll logic. Scroll to bottom if user is already near the bottom,
    // or if they just sent a message.
    useEffect(() => {
        if (!chatContainerRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

        if (isNearBottom || isSending) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages, isSending])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !user || isSending) return

        setIsSending(true)
        const success = await sendMessage(newMessage)
        if (success) {
            setNewMessage('')
            // Auto scroll will trigger from effect
        } else {
            showToast('Error al enviar mensaje', 'error')
        }
        setIsSending(false)
    }

    const handleDelete = async (msgId: string) => {
        const success = await deleteMessage(msgId)
        if (success) {
            showToast('Mensaje eliminado', 'success')
            setActiveMenuId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] animate-pulse">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mb-4" />
                Cargando chat...
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[500px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--background)] border-b border-[var(--card-border)] sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm">Chat en vivo</h3>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        LIVE
                    </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium bg-[var(--hover-bg)] px-2 py-1 rounded-full">
                    <Users size={12} />
                    {onlineUsers} {onlineUsers === 1 ? 'espectador' : 'espectadores'}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
                onClick={() => setActiveMenuId(null)} // Close menus when clicking outside
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] opacity-70">
                        <span className="text-4xl mb-3">💬</span>
                        <p className="text-sm">No hay mensajes aún.</p>
                        <p className="text-xs">¡Sé el primero en comentar!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = user?.id === msg.user_id
                        const isMenuOpen = activeMenuId === msg.id

                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444] shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold">
                                    {msg.profile?.avatar_url ? (
                                        <img src={msg.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        msg.profile?.username?.charAt(0)?.toUpperCase() || '?'
                                    )}
                                </div>

                                <div className={`flex flex-col relative group max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1 px-1">
                                        <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                            {isOwn ? 'Vos' : (msg.profile?.username || 'Anónimo')}
                                        </span>
                                        <span className="text-[9px] text-[var(--text-muted)] opacity-60">
                                            {timeAgoShort(msg.created_at)}
                                        </span>
                                    </div>

                                    <div className={`
                                        relative px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                                        ${isOwn
                                            ? 'bg-[var(--accent)] text-white rounded-tr-sm shadow-[0_2px_10px_var(--accent-glow)]'
                                            : 'bg-[var(--input-bg)] text-[var(--foreground)] border border-[var(--card-border)] rounded-tl-sm'
                                        }
                                    `}>
                                        {msg.content}

                                        {/* Actions Menu Trigger */}
                                        {isOwn && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActiveMenuId(isMenuOpen ? null : msg.id)
                                                }}
                                                className={`absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-opacity
                                                    ${isOwn ? '-left-8 text-[var(--text-muted)] hover:bg-[var(--hover-bg)]' : '-right-8'}
                                                    ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                                `}
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Action Context Menu */}
                                    <AnimatePresence>
                                        {isMenuOpen && isOwn && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`absolute top-10 ${isOwn ? 'left-auto right-full mr-2' : ''} z-20 
                                                        bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-xl overflow-hidden py-1`}
                                            >
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors whitespace-nowrap"
                                                >
                                                    <Trash2 size={14} />
                                                    Eliminar
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[var(--background)] border-t border-[var(--card-border)]">
                {user ? (
                    <form onSubmit={handleSend} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                            disabled={isSending}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0 hover:brightness-110 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Send size={16} className={isSending ? 'animate-pulse' : ''} style={{ marginLeft: 2 }} />
                        </button>
                    </form>
                ) : (
                    <div className="text-center p-2 text-sm text-[var(--text-muted)] bg-[var(--input-bg)] rounded-xl border border-[var(--card-border)]">
                        Iniciá sesión para unirte al chat.
                    </div>
                )}
            </div>
        </div>
    )
}
