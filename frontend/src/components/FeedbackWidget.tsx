'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquarePlus, X, Star } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/contexts/ToastContext'
import confetti from 'canvas-confetti'

export function FeedbackWidget() {
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

            // Success feedback
            setIsOpen(false)
            showToast('¡Gracias por tu feedback!', 'success')

            // Celebration confetti!
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#3b82f6', '#f59e0b']
            })

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
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] p-3.5 rounded-full shadow-lg text-[var(--foreground)] hover:text-[#10b981] hover:border-[#10b981] transition-colors"
                aria-label="Dejar Feedback"
            >
                <MessageSquarePlus size={24} />
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--card-bg)] w-full max-w-sm rounded-[32px] p-6 shadow-2xl border border-[var(--card-border)]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-black bg-gradient-to-r from-[#10b981] to-[#3b82f6] bg-clip-text text-transparent">
                                        Feedback Beta
                                    </h2>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        ¿Qué te gustaría ver en la app o qué podemos mejorar?
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 bg-[var(--background)] rounded-full text-[var(--text-muted)] hover:text-white transition-colors"
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
                                        placeholder="Tus comentarios, ideas o reportes de bugs..."
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-sm focus:outline-none focus:border-[#10b981] transition-colors resize-none h-28"
                                    />
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting || rating === 0}
                                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-black py-4 rounded-2xl transition-all shadow-lg hover:shadow-[#10b981]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
