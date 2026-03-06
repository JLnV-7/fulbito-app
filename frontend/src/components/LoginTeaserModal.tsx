// src/components/LoginTeaserModal.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Lock, X } from 'lucide-react'

interface LoginTeaserModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message?: string
}

export function LoginTeaserModal({
    isOpen,
    onClose,
    title = "¡Entrada Exclusiva!",
    message = "Para guardar tus equipos favoritos y sumarte a la hinchada, necesitás entrar a la cancha."
}: LoginTeaserModalProps) {
    const router = useRouter()

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6 w-full max-w-sm shadow-xl cursor-default relative overflow-hidden"
                        >
                            {/* Accents / Glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-green)]/20 blur-3xl rounded-full pointer-events-none" />

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center mt-2">
                                <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center mb-4 border border-[var(--accent-green)]/30">
                                    <Lock size={28} className="text-[var(--accent-green)] pr-1" />
                                </div>

                                <h3 className="text-xl font-black mb-2 tracking-tight text-[var(--foreground)]">
                                    {title}
                                </h3>

                                <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                                    {message}
                                </p>

                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={() => router.push('/login')}
                                        className="w-full bg-[#10b981] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#10b981]/25 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                    >
                                        Iniciar Sesión
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-2.5 rounded-xl font-semibold text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors active:scale-95"
                                    >
                                        Quizás más tarde
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
