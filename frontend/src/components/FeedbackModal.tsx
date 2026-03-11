'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquareHeart } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function FeedbackModal() {
    const { user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)

    useEffect(() => {
        const handleOpen = () => {
            hapticFeedback(10)
            setIsOpen(true)
            setSent(false)
            setMessage('')
        }
        document.addEventListener('open-feedback', handleOpen)
        return () => document.removeEventListener('open-feedback', handleOpen)
    }, [])

    const handleClose = () => {
        hapticFeedback(2)
        setIsOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return

        setSending(true)
        hapticFeedback(15)

        try {
            // Guarda en la tabla 'feedback' de supabase
            await supabase.from('feedback').insert([{
                user_id: user?.id || null,
                mensaje: message.trim(),
            }])
            setSent(true)
        } catch (error) {
            console.error('Error saving feedback:', error)
        } finally {
            setSending(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-[101] overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]/50 bg-[var(--hover-bg)]">
                            <div className="flex items-center gap-2">
                                <MessageSquareHeart size={18} className="text-[var(--accent-blue)]" />
                                <h3 className="font-bold text-sm">Enviar Feedback</h3>
                            </div>
                            <button onClick={handleClose} className="p-1.5 rounded-full bg-[var(--card-border)]/50 hover:bg-[var(--card-border)] transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                        
                        <div className="p-5">
                            {sent ? (
                                <div className="text-center py-6">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-3">
                                        <Send size={24} />
                                    </div>
                                    <h4 className="font-black text-lg mb-1">¡Gracias!</h4>
                                    <p className="text-sm text-[var(--text-muted)]">Tu mensaje fue enviado a los desarrolladores.</p>
                                    <button onClick={handleClose} className="mt-6 w-full py-2 bg-[var(--card-border)]/50 rounded-xl text-sm font-bold">Cerrar</button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <p className="text-xs text-[var(--text-muted)]">
                                        ¿Encontraste un bug? ¿Tenés una idea genial? Escribinos y ayudanos a mejorar FutLog.
                                    </p>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Escribe tu mensaje aquí..."
                                        rows={4}
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--accent-blue)] resize-none"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !message.trim()}
                                        className="w-full py-2.5 bg-[var(--accent-blue)] hover:opacity-90 text-white rounded-xl text-sm font-black transition-opacity disabled:opacity-50"
                                    >
                                        {sending ? 'Enviando...' : 'Enviar mensaje'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
