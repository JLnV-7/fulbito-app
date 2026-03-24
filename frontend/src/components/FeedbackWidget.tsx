'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquarePlus, X, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'

interface FeedbackWidgetProps {
    inline?: boolean
}

export function FeedbackWidget({ inline = false }: FeedbackWidgetProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rating === 0) {
            showToast('Por favor, seleccioná una calificación.', 'error')
            return
        }

        setIsSubmitting(true)

        try {
            const { error } = await supabase
                .from('user_feedback')
                .insert({
                    user_id: user?.id || null, // Allow anonymous if configured, otherwise null
                    rating,
                    comment: comment.trim()
                })

            if (error) throw error

            // Trigger Discord Webhook Notification asynchronously (don't await so UI doesn't block)
            fetch('/api/webhook/discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment: comment.trim(), user_id: user?.id })
            }).catch(err => console.error('Failed to send discord notification:', err))

            // Success feedback
            setIsOpen(false)
            showToast('Feedback enviado correctamente', 'success')

            // Reset form
            setTimeout(() => {
                setRating(0)
                setComment('')
            }, 500)

        } catch (error: any) {
            console.error('Error submitting feedback:', error)
            showToast('Hubo un error al enviar el feedback.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            {inline ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors active:bg-[var(--card-border)]/50"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                            <MessageSquarePlus size={18} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold">Enviar Feedback</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium">Ayudanos a mejorar la app</p>
                        </div>
                    </div>
                </button>
            ) : (
                <motion.button
                    onClick={() => setIsOpen(true)}
                    whileTap={{ scale: 0.95 }}
                    className="fixed bottom-[88px] left-3 z-40 flex items-center gap-1.5 px-3 py-2 shadow-md border bg-[var(--card-bg)]/90 backdrop-blur-md border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all text-[10px] font-bold capitalize tracking-tight"
                    aria-label="Dejar Feedback"
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    <MessageSquarePlus size={14} /> Feedback
                </motion.button>
            )}

            {/* Modal via Portal */}
            {isOpen && typeof document !== 'undefined' && require('react-dom').createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--card-bg)] w-full max-w-sm p-6 border border-[var(--card-border)]"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-black capitalize italic tracking-tighter text-[#16a34a]">
                                        Feedback Beta
                                    </h2>
                                    <p className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mt-1">
                                        ¿Qué te gustaría ver?
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--card-border)]"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Star Rating */}
                                <div className="flex justify-center gap-2 py-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="focus:outline-none transition-transform hover:scale-110 active:scale-90"
                                        >
                                            <Star
                                                size={36}
                                                className={`transition-colors duration-200 ${star <= (hoverRating || rating)
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-[var(--card-border)]'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Comment Area */}
                                <div>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="TUS COMENTARIOS..."
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] p-4 text-xs font-black capitalize tracking-widest focus:outline-none focus:border-[#16a34a] transition-colors resize-none h-28 italic"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || rating === 0}
                                    className="w-full bg-[#16a34a] text-white font-black py-4 capitalize tracking-widest text-sm italic transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </>
    )
}
