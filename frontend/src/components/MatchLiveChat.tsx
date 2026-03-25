// src/components/MatchLiveChat.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Users, MoreVertical, Trash2, Smile, AlertTriangle, ShieldAlert } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useMatchChat, type ChatMessage } from '@/hooks/useMatchChat'
import { useToast } from '@/contexts/ToastContext'
import { GiphySelector } from '@/components/GiphySelector'
import { CreateGroupModal } from '@/components/CreateGroupModal'
import { ChatPoll } from '@/components/ChatPoll'

const REACTIONS = [
    { type: 'like', emoji: '❤️', label: 'Me gusta' },
    { type: 'fuego', emoji: '🔥', label: 'Fuego' },
    { type: 'risa', emoji: '😂', label: 'Risa' },
    { type: 'termo', emoji: '🧉', label: 'Termo' },
    { type: 'roja', emoji: '🟥', label: 'Roja' },
    { type: 'clasp', emoji: '👏', label: 'Aplauso' },
]

interface MatchLiveChatProps {
    partidoId: string
    matchTitle?: string
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

function renderMessage(content: string) {
    if (content.includes('giphy.com/media/')) {
        return (
            <img
                src={content}
                alt="GIF"
                className="max-w-[200px] w-full h-auto rounded-lg object-cover"
                loading="lazy"
            />
        )
    }
    return <p className="break-words">{content}</p>
}

export function MatchLiveChat({ partidoId, matchTitle }: MatchLiveChatProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const router = useRouter()
    const { messages, loading, onlineUsers, sendMessage, deleteMessage, toggleReaction } = useMatchChat(partidoId)

    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
    const [showGiphy, setShowGiphy] = useState(false)
    const [showCreateGroup, setShowCreateGroup] = useState(false)
    const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
    const [showReactionPickerId, setShowReactionPickerId] = useState<string | null>(null)
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
        const success = await sendMessage(newMessage, replyingTo?.id)
        if (success) {
            setNewMessage('')
            setReplyingTo(null)
            // Auto scroll will trigger from effect
        } else {
            showToast('Error al enviar mensaje', 'error')
        }
        setIsSending(false)
    }

    const handleToggleReaction = async (msgId: string, type: string) => {
        if (!user) {
            router.push('/login')
            return
        }
        await toggleReaction(msgId, type)
        setShowReactionPickerId(null)
    }

    const handleSelectGif = async (gifUrl: string) => {
        setShowGiphy(false)
        if (!user || isSending) return

        setIsSending(true)
        const success = await sendMessage(gifUrl)
        if (!success) {
            showToast('Error al enviar GIF', 'error')
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

    const handleReport = async (msgId: string) => {
        if (!user) {
            router.push('/login')
            return
        }
        try {
            const { error } = await supabase.from('message_reports').insert({
                reporter_id: user.id,
                message_id: msgId,
                reason: 'Reportado por usuario'
            })
            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    showToast('Ya reportaste este mensaje', 'error')
                } else {
                    throw error
                }
            } else {
                showToast('Mensaje reportado. Nuestro equipo lo revisará.', 'success')
            }
        } catch (err) {
            console.error('Error reporting message:', err)
            showToast('Error al reportar mensaje', 'error')
        } finally {
            setActiveMenuId(null)
        }
    }

    // Blurred Teaser for Unauthenticated Users
    if (!user) {
        return (
            <div className="flex flex-col h-[500px] bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden relative" style={{ borderRadius: 'var(--radius)' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[var(--background)] border-b border-[var(--card-border)] border-dashed sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black text-[10px] capitalize tracking-widest">Chat en vivo</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 border border-[#16a34a] text-[#16a34a] text-[8px] font-black capitalize">
                            <div className="w-1.5 h-1.5 bg-[#16a34a]" />
                            LIVE
                        </div>
                    </div>
                </div>

                {/* Blurred Chat Area */}
                <div className="flex-1 relative overflow-hidden bg-[var(--background)] p-4 flex flex-col justify-end cursor-pointer" onClick={() => router.push('/login')}>
                    <div className="absolute inset-0 z-10 bg-black/5 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 shadow-xl max-w-[280px] text-center transform scale-105 pointer-events-auto" style={{ borderRadius: 'var(--radius)' }}>
                            <h4 className="font-black text-sm mb-2 text-[var(--foreground)] capitalize">¡Sumate a la tribuna!</h4>
                            <p className="text-[10px] text-[var(--text-muted)] font-bold capitalize mb-4 leading-tight">Iniciá sesión para leer los mensajes y debatir.</p>
                            <a href="/login" className="inline-block w-full bg-[var(--foreground)] text-[var(--background)] font-black py-2.5 text-[10px] capitalize tracking-widest hover:bg-[var(--foreground)] transition-colors" style={{ borderRadius: 'var(--radius)' }}>
                                ENTRAR A LA CANCHA
                            </a>
                        </div>
                    </div>

                    {/* Fake glowing messages */}
                    <div className="flex flex-col gap-4 opacity-30 blur-[2px] mb-2 pointer-events-none">
                        <div className="self-end bg-[var(--accent)] h-10 w-48 rounded-2xl rounded-tr-sm" />
                        <div className="self-start bg-[var(--input-bg)] h-12 w-64 rounded-2xl rounded-tl-sm" />
                        <div className="self-end bg-[var(--accent)] h-8 w-32 rounded-2xl rounded-tr-sm" />
                        <div className="self-start bg-[var(--input-bg)] h-16 w-56 rounded-2xl rounded-tl-sm" />
                    </div>

                    <div className="text-center pb-2 z-20 pointer-events-none opacity-50 blur-[1px]">
                        <p className="text-[9px] font-black capitalize text-[var(--foreground)]">Ver más mensajes...</p>
                    </div>
                </div>

                {/* Disabled Input */}
                <div className="p-3 bg-[var(--background)] border-t border-[var(--card-border)] opacity-50 relative pointer-events-none">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            disabled
                            placeholder="Iniciá sesión para unirte al chat..."
                            className="flex-1 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full px-4 py-2.5 text-sm"
                        />
                        <button
                            disabled
                            className="w-10 h-10 rounded-full bg-[var(--card-border)] flex items-center justify-center shrink-0"
                        >
                            <Send size={16} className="text-[var(--text-muted)]" style={{ marginLeft: 2 }} />
                        </button>
                    </div>
                </div>
            </div>
        )
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
        <div className="flex flex-col h-[500px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-sm relative">
            <CreateGroupModal
                isOpen={showCreateGroup}
                onClose={() => setShowCreateGroup(false)}
            />
            {/* Header */}
            <div className="flex flex-col bg-[var(--background)] border-b border-[var(--card-border)] sticky top-0 z-10">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm">Chat en vivo</h3>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            LIVE
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setShowCreateGroup(true)}
                            className="text-[8px] bg-[var(--background)] text-[var(--foreground)] font-black px-2 py-1 hover:bg-[var(--hover-bg)] transition-colors border border-[var(--card-border)] hidden sm:flex items-center gap-1 capitalize"
                            style={{ borderRadius: 'var(--radius)' }}
                            title="Crear grupo privado para este partido"
                        >
                            <Users size={10} />
                            Crear Grupo
                        </button>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] font-medium bg-[var(--hover-bg)] px-2 py-1 rounded-full">
                            <Users size={12} />
                            {onlineUsers} {onlineUsers === 1 ? 'espectador' : 'espectadores'}
                        </div>
                    </div>
                </div>
                {/* Mobile Create Group Button */}
                <div className="sm:hidden px-4 pb-2">
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="w-full text-[9px] bg-[var(--background)] text-[var(--foreground)] font-black py-1.5 hover:bg-[var(--hover-bg)] transition-colors border border-[var(--card-border)] flex items-center justify-center gap-1.5 capitalize"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <Users size={12} className="text-[var(--text-muted)]" />
                        Crear Grupo Privado
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
                onClick={() => setActiveMenuId(null)} // Close menus when clicking outside
            >
                <ChatPoll partidoId={partidoId} />
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
                                <div
                                    className="w-8 h-8 bg-[var(--background)] border border-[var(--card-border)] shrink-0 overflow-hidden flex items-center justify-center text-[var(--foreground)] text-[10px] font-black cursor-pointer hover:border-[var(--foreground)] transition-all"
                                    style={{ borderRadius: 'var(--radius)' }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (msg.user_id) window.location.href = `/perfil/${msg.user_id}`
                                    }}
                                >
                                    {msg.profile?.avatar_url ? (
                                        <img src={msg.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        msg.profile?.username?.charAt(0)?.toUpperCase() || '?'
                                    )}
                                </div>

                                <div className={`flex flex-col relative group max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                        <div className="flex items-baseline gap-2 mb-1 px-1">
                                            <span
                                                className="text-[9px] font-black capitalize text-[var(--text-muted)] cursor-pointer hover:text-[var(--foreground)] hover:underline transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (msg.user_id) window.location.href = `/perfil/${msg.user_id}`
                                                }}
                                            >
                                                {isOwn ? 'Vos' : (msg.profile?.username || 'Anónimo')}
                                            </span>
                                            <span className="text-[9px] text-[var(--text-muted)] opacity-60">
                                                {timeAgoShort(msg.created_at)}
                                            </span>
                                        </div>

                                        {/* Reply Preview inside bubble */}
                                        {msg.reply_to && (
                                            <div className={`mb-2 p-2 rounded-lg border-l-2 bg-black/5 flex flex-col gap-0.5 max-w-full overflow-hidden ${isOwn ? 'border-white/30 text-white/70' : 'border-[var(--accent)] text-[var(--text-muted)]'}`}>
                                                <span className="text-[8px] font-black uppercase tracking-widest truncate">{msg.reply_to.profile?.username || 'Usuario'}</span>
                                                <p className="text-[10px] truncate italic">{msg.reply_to.content}</p>
                                            </div>
                                        )}

                                    <div className={`
                                        relative px-4 py-2.5 text-sm leading-relaxed border border-[var(--card-border)]
                                        ${isOwn
                                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                                            : 'bg-[var(--background)] text-[var(--foreground)]'
                                        }
                                    `} style={{ borderRadius: 'var(--radius)' }}>
                                        {renderMessage(msg.content)}

                                        {/* Reactions Row */}
                                        {msg.reactions && msg.reactions.length > 0 && (
                                            <div className={`flex flex-wrap gap-1 mt-2 -mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                {Object.entries(
                                                    msg.reactions.reduce((acc: Record<string, number>, r) => {
                                                        acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
                                                        return acc
                                                    }, {})
                                                ).map(([type, count]) => (
                                                    <button
                                                        key={type}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleToggleReaction(msg.id, type)
                                                        }}
                                                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black border transition-all
                                                            ${msg.reactions?.some(r => r.user_id === user?.id && r.reaction_type === type)
                                                                ? 'bg-[var(--accent)]/20 border-[var(--accent)]'
                                                                : 'bg-black/5 border-transparent hover:border-[var(--card-border)]'
                                                            }`}
                                                    >
                                                        <span>{REACTIONS.find(r => r.type === type)?.emoji}</span>
                                                        {count > 1 && <span className="text-[9px]">{count}</span>}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions Menu Trigger */}
                                        {user && (
                                            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center
                                                ${isOwn ? '-left-12' : '-right-12'}
                                                ${isMenuOpen || showReactionPickerId === msg.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                                                transition-opacity
                                            `}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setShowReactionPickerId(showReactionPickerId === msg.id ? null : msg.id)
                                                    }}
                                                    className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                                                >
                                                    <Smile size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setActiveMenuId(isMenuOpen ? null : msg.id)
                                                    }}
                                                    className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                                                >
                                                    <MoreVertical size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Context Menu */}
                                    <AnimatePresence>
                                        {showReactionPickerId === msg.id && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className={`absolute bottom-full mb-2 ${isOwn ? 'right-0' : 'left-0'} z-30 bg-[var(--card-bg)] border border-[var(--card-border)] p-1.5 flex gap-1 shadow-2xl rounded-2xl`}
                                            >
                                                {REACTIONS.map((r) => (
                                                    <button
                                                        key={r.type}
                                                        onClick={() => handleToggleReaction(msg.id, r.type)}
                                                        className="w-8 h-8 flex items-center justify-center hover:bg-[var(--hover-bg)] rounded-xl transition-colors text-lg"
                                                        title={r.label}
                                                    >
                                                        {r.emoji}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}

                                        {isMenuOpen && user && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className={`absolute top-10 ${isOwn ? 'left-auto right-full mr-2' : 'left-full ml-2'} z-20 
                                                        bg-[var(--card-bg)] border border-[var(--card-border)] shadow-xl overflow-hidden py-1 min-w-[120px]`}
                                                style={{ borderRadius: 'var(--radius)' }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setReplyingTo(msg)
                                                        setActiveMenuId(null)
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors whitespace-nowrap border-b border-[var(--card-border)]"
                                                >
                                                    <Send size={14} className="rotate-180" />
                                                    Responder
                                                </button>
                                                {isOwn ? (
                                                    <button
                                                        onClick={() => handleDelete(msg.id)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors whitespace-nowrap"
                                                    >
                                                        <Trash2 size={14} />
                                                        Eliminar
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleReport(msg.id)}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#f59e0b] hover:bg-[#f59e0b]/10 transition-colors whitespace-nowrap"
                                                    >
                                                        <ShieldAlert size={14} />
                                                        Reportar
                                                    </button>
                                                )}
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
            <div className="p-3 bg-[var(--background)] border-t border-[var(--card-border)] relative">
                {/* Reply Bar */}
                <AnimatePresence>
                    {replyingTo && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] border-b-0 p-3 flex items-center justify-between rounded-t-2xl -mt-12 absolute bottom-full left-3 right-3 shadow-xl"
                        >
                            <div className="flex flex-col gap-0.5 max-w-[80%]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)]">Respondiendo a {replyingTo.profile?.username}</span>
                                <p className="text-[10px] text-[var(--text-muted)] truncate italic">{replyingTo.content}</p>
                            </div>
                            <button
                                onClick={() => setReplyingTo(null)}
                                className="p-1.5 hover:bg-[var(--hover-bg)] rounded-full text-[var(--text-muted)]"
                            >
                                <Trash2 size={14} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                {showGiphy && (
                    <div className="absolute bottom-full right-4 mb-2 z-50">
                        <GiphySelector
                            onSelect={handleSelectGif}
                            onClose={() => setShowGiphy(false)}
                        />
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowGiphy(!showGiphy)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors
                            ${showGiphy ? 'bg-[var(--accent)] text-white' : 'bg-[var(--hover-bg)] text-[var(--text-muted)] hover:bg-[var(--card-border)]'}`}
                    >
                        <Smile size={18} />
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Comentá algo..."
                        className="flex-1 bg-[var(--background)] border border-[var(--card-border)] px-4 py-2.5 text-[10px] font-bold capitalize focus:outline-none focus:border-[var(--foreground)] transition-colors"
                        style={{ borderRadius: 'var(--radius)' }}
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="w-10 h-10 border border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center shrink-0 hover:bg-[var(--foreground)] disabled:opacity-50 transition-all font-black"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <Send size={14} className={isSending ? 'animate-pulse' : ''} style={{ marginLeft: 2 }} />
                    </button>
                </form>
            </div>
        </div>
    )
}
