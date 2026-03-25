'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, MessageSquare } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'

interface PlayerRatingModalProps {
    isOpen: boolean
    onClose: () => void
    jugador: { id: number; nombre: string; numero: number; foto_url?: string } | null
    initialNota?: number
    onSave: (jugadorId: number, nota: number, comentario?: string) => void
}

export function PlayerRatingModal({ isOpen, onClose, jugador, initialNota, onSave }: PlayerRatingModalProps) {
    const [nota, setNota] = useState<number>(initialNota || 0)
    const [comentario, setComentario] = useState('')

    useEffect(() => {
        if (isOpen) {
            setNota(initialNota || 0)
            setComentario('')
        }
    }, [isOpen, initialNota])

    if (!isOpen || !jugador) return null

    const handleSave = () => {
        if (nota < 1 || nota > 10) return
        onSave(jugador.id, nota, comentario.trim() || undefined)
        onClose()
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal / Bottom Sheet */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-md bg-[var(--card-bg)] border-t sm:border border-[var(--card-border)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden pb-8 sm:pb-0"
                >
                    <div className="absolute top-4 right-4">
                        <button onClick={onClose} className="p-2 bg-[var(--hover-bg)] rounded-full text-[var(--text-muted)] hover:text-white transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="p-6 pt-10 flex flex-col items-center">
                        {/* Player Header */}
                        <div className="w-20 h-20 rounded-full bg-[var(--card-border)] border-4 border-[var(--background)] shadow-xl mb-4 overflow-hidden flex items-center justify-center relative">
                            {jugador.foto_url ? (
                                <img src={jugador.foto_url} alt={jugador.nombre} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-black text-[var(--text-muted)]">{jugador.nombre.charAt(0)}</span>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-white text-black font-black text-[10px] w-6 h-6 flex items-center justify-center rounded-full border-2 border-[var(--card-bg)]">
                                {jugador.numero}
                            </div>
                        </div>

                        <h3 className="text-xl font-black uppercase tracking-tighter text-center mb-1">{jugador.nombre}</h3>
                        <p className="text-[10px] font-bold text-[var(--accent)] tracking-widest uppercase mb-8">Rendimiento del Jugador</p>

                        {/* Rating Slider / Buttons */}
                        <div className="w-full mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Tu Puntuación</span>
                                <span className={`text-3xl font-black tracking-tighter ${nota >= 8 ? 'text-green-500' : nota >= 5 ? 'text-yellow-500' : nota > 0 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                                    {nota > 0 ? nota : '-'}
                                </span>
                            </div>

                            <div className="flex justify-between gap-1 w-full">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => {
                                            hapticFeedback(10)
                                            setNota(num)
                                        }}
                                        className={`flex-1 h-12 rounded-lg font-black text-sm transition-all border
                                            ${nota === num 
                                                ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] scale-110 shadow-lg' 
                                                : nota > 0 && num <= nota
                                                ? 'bg-[var(--foreground)]/20 text-[var(--foreground)] border-transparent'
                                                : 'bg-[var(--hover-bg)] text-[var(--text-muted)] border-transparent hover:bg-[var(--card-border)]'
                                            }
                                        `}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Short Comment */}
                        <div className="w-full mb-6">
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <MessageSquare size={12} className="text-[var(--text-muted)]" />
                                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Comentario corto (Opcional)</span>
                            </div>
                            <textarea
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                placeholder="¿Qué te pareció su partido?"
                                className="w-full bg-[var(--hover-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none h-20 placeholder:text-[var(--text-muted)]/50"
                                maxLength={100}
                            />
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={nota === 0}
                            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2
                                ${nota === 0 
                                    ? 'bg-[var(--card-border)] text-[var(--text-muted)] cursor-not-allowed' 
                                    : 'bg-[var(--accent)] text-white hover:opacity-90 shadow-[0_5px_20px_rgba(37,99,235,0.3)]'
                                }
                            `}
                        >
                            <Star size={16} className={nota > 0 ? 'fill-current' : ''} />
                            Guardar Puntuación
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
