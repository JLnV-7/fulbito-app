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
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 w-full max-w-sm cursor-default relative overflow-hidden"
                            style={{ borderRadius: 'var(--radius)' }}
                        >

                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center mt-2">
                                <div className="w-16 h-16 bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center mb-4" style={{ borderRadius: 'var(--radius)' }}>
                                    <Lock size={28} className="text-[var(--foreground)] pr-1" />
                                </div>

                                <h3 className="text-xl font-black mb-2 tracking-tighter italic text-[var(--foreground)] capitalize">
                                    {title}
                                </h3>

                                <p className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mb-6 leading-relaxed px-4">
                                    {message}
                                </p>

                                <div className="w-full flex flex-col gap-2">
                                    <button
                                        onClick={() => router.push('/login')}
                                        className="w-full bg-[#16a34a] text-white font-black py-4 tracking-widest italic active:scale-95 transition-all text-sm capitalize"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    >
                                        Iniciar Sesión
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-2.5 font-black capitalize tracking-widest text-[9px] text-[var(--text-muted)] hover:text-[var(--foreground)] active:scale-95"
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
