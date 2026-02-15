'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export function ReglasPuntajeModal() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[#ffd700] transition-colors bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full"
            >
                <span>ℹ️</span>
                <span>Reglas</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-[var(--background)] border border-[var(--card-border)] rounded-2xl shadow-xl overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">¿Cómo sumar puntos?</h3>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-[var(--text-muted)] hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Exacto */}
                                    <div className="p-3 bg-[#ffd700]/10 border border-[#ffd700]/20 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-[#ffd700]">Resultado Exacto</span>
                                            <span className="bg-[#ffd700] text-black text-xs font-bold px-2 py-0.5 rounded-full">8 PTS</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Acertás el marcador exacto (ej: 2-1).
                                        </p>
                                    </div>

                                    {/* Ganador + Diferencia */}
                                    <div className="p-3 bg-[#c0c0c0]/10 border border-[#c0c0c0]/20 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-[#c0c0c0]">Ganador + Diferencia</span>
                                            <span className="bg-[#c0c0c0] text-black text-xs font-bold px-2 py-0.5 rounded-full">5 PTS</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Acertás quién gana y la diferencia de goles (ej: pusiste 3-1 y salió 2-0).
                                        </p>
                                    </div>

                                    {/* Solo Ganador */}
                                    <div className="p-3 bg-[#cd7f32]/10 border border-[#cd7f32]/20 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-[#cd7f32]">Solo Ganador</span>
                                            <span className="bg-[#cd7f32] text-black text-xs font-bold px-2 py-0.5 rounded-full">3 PTS</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Acertás el ganador o el empate, pero no el resultado exacto.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-xs text-[var(--text-muted)] italic">
                                        Los puntos se actualizan automáticamente al finalizar el partido.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}
