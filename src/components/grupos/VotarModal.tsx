// src/components/grupos/VotarModal.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { JugadorPartidoAmigo } from '@/types'

interface VotarModalProps {
    jugador: JugadorPartidoAmigo
    onVotar: (nota: number, comentario?: string) => Promise<void>
    onClose: () => void
}

export function VotarModal({ jugador, onVotar, onClose }: VotarModalProps) {
    const [nota, setNota] = useState<number>(jugador.mi_voto?.nota || 0)
    const [comentario, setComentario] = useState(jugador.mi_voto?.comentario || '')
    const [guardando, setGuardando] = useState(false)

    const handleGuardar = async () => {
        if (nota === 0) return
        setGuardando(true)
        try {
            await onVotar(nota, comentario || undefined)
            onClose()
        } catch {
            // error handled by parent
        } finally {
            setGuardando(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[var(--card-bg)] rounded-t-3xl sm:rounded-3xl w-full max-w-md border border-[var(--card-border)] shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)]">
                        <div>
                            <h3 className="text-lg font-black">⭐ Votar a: {jugador.nombre}</h3>
                            <p className="text-xs text-[var(--text-muted)]">
                                Equipo {jugador.equipo === 'azul' ? '🔵 Azul' : '🔴 Rojo'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)]"
                        >✕</button>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-5">
                        <p className="text-center text-sm text-[var(--text-muted)]">¿Cómo jugó {jugador.nombre}?</p>

                        {/* Stars display */}
                        <div className="text-center text-2xl tracking-widest">
                            {Array.from({ length: 10 }, (_, i) => (
                                <span key={i} className={i < nota ? 'opacity-100' : 'opacity-20'}>⭐</span>
                            ))}
                        </div>

                        {/* Number buttons */}
                        <div className="grid grid-cols-5 gap-2">
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                <button
                                    key={n}
                                    onClick={() => setNota(n)}
                                    className={`py-3 rounded-xl text-lg font-black transition-all ${nota === n
                                        ? 'bg-[#fbbf24] text-black shadow-lg shadow-[#fbbf24]/30 scale-110'
                                        : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                                        }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>

                        {nota > 0 && (
                            <p className="text-center text-sm font-bold">
                                Seleccionado: <span className="text-[#fbbf24]">{nota}/10 ⭐</span>
                            </p>
                        )}

                        {/* Comment */}
                        <div>
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">💬 Comentario (opcional)</label>
                            <textarea
                                value={comentario}
                                onChange={e => setComentario(e.target.value)}
                                placeholder="Jugó muy bien, metió un golazo..."
                                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50"
                                maxLength={200}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-[var(--card-border)] flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl text-[var(--text-muted)] font-bold hover:bg-[var(--background)]"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardar}
                            disabled={nota === 0 || guardando}
                            className="flex-1 py-3 rounded-xl font-black text-black bg-[#fbbf24] disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#fbbf24]/30"
                        >
                            {guardando ? '⏳' : '✅ Guardar Voto'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
