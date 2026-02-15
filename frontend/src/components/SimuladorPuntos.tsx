// src/components/SimuladorPuntos.tsx
'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SimuladorPuntos() {
    const [pLocal, setPLocal] = useState(1)
    const [pVisit, setPVisit] = useState(0)

    const [rLocal, setRLocal] = useState(2)
    const [rVisit, setRVisit] = useState(1)

    const resultado = useMemo(() => {
        // Lógica espejo de la función SQL calcular_puntos_pronostico

        // 1. Determinar ganadores
        const prodeGanaLocal = pLocal > pVisit
        const prodeGanaVisit = pVisit > pLocal
        const prodeEmpate = pLocal === pVisit

        const realGanaLocal = rLocal > rVisit
        const realGanaVisit = rVisit > rLocal
        const realEmpate = rLocal === rVisit

        // Puntos
        if (pLocal === rLocal && pVisit === rVisit) {
            return { puntos: 8, tipo: 'Resultado Exacto', color: '#10b981' }
        }

        const mismoGanador = (prodeGanaLocal && realGanaLocal) ||
            (prodeGanaVisit && realGanaVisit) ||
            (prodeEmpate && realEmpate)

        if (mismoGanador) {
            const prodeDif = pLocal - pVisit
            const realDif = rLocal - rVisit

            if (prodeDif === realDif) {
                return { puntos: 5, tipo: 'Ganador + Diferencia', color: '#3b82f6' }
            }
            return { puntos: 3, tipo: 'Solo Ganador', color: '#6366f1' }
        }

        return { puntos: 0, tipo: 'Sin aciertos', color: '#ef4444' }
    }, [pLocal, pVisit, rLocal, rVisit])

    return (
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] overflow-hidden shadow-2xl">
            <div className="bg-[#10b981]/10 px-6 py-4 border-b border-[#10b981]/20">
                <h3 className="font-bold flex items-center gap-2">
                    <span>🧮</span> Simulador de Puntos
                </h3>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-1">
                    Probá combinaciones y entendé cómo sumás
                </p>
            </div>

            <div className="p-6 space-y-8">
                {/* Mi Pronóstico */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-[#10b981] uppercase tracking-tighter">Mi Pronóstico</label>
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-[var(--text-muted)]">Local</span>
                            <input
                                type="number" value={pLocal} onChange={(e) => setPLocal(Number(e.target.value))}
                                className="w-14 h-14 text-center text-2xl font-black bg-[var(--background)] border-2 border-[var(--card-border)] rounded-2xl focus:border-[#10b981] transition-all outline-none"
                            />
                        </div>
                        <span className="text-xl font-black text-[var(--card-border)]">-</span>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-[var(--text-muted)]">Visitante</span>
                            <input
                                type="number" value={pVisit} onChange={(e) => setPVisit(Number(e.target.value))}
                                className="w-14 h-14 text-center text-2xl font-black bg-[var(--background)] border-2 border-[var(--card-border)] rounded-2xl focus:border-[#10b981] transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* VS Animated Divider */}
                <div className="flex items-center gap-4 opacity-30">
                    <div className="h-px bg-[var(--card-border)] flex-1"></div>
                    <div className="text-[10px] font-black">VS</div>
                    <div className="h-px bg-[var(--card-border)] flex-1"></div>
                </div>

                {/* Resultado Real */}
                <div className="space-y-4">
                    <label className="text-xs font-bold text-[#3b82f6] uppercase tracking-tighter">Resultado Real (Simulado)</label>
                    <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center gap-2">
                            <input
                                type="number" value={rLocal} onChange={(e) => setRLocal(Number(e.target.value))}
                                className="w-14 h-14 text-center text-2xl font-black bg-[var(--background)] border-2 border-[var(--card-border)] rounded-2xl focus:border-[#3b82f6] transition-all outline-none"
                            />
                        </div>
                        <span className="text-xl font-black text-[var(--card-border)]">-</span>
                        <div className="flex flex-col items-center gap-2">
                            <input
                                type="number" value={rVisit} onChange={(e) => setRVisit(Number(e.target.value))}
                                className="w-14 h-14 text-center text-2xl font-black bg-[var(--background)] border-2 border-[var(--card-border)] rounded-2xl focus:border-[#3b82f6] transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Resultado Final Display */}
                <motion.div
                    layout
                    className="bg-[var(--background)] p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden"
                    style={{ borderColor: resultado.color + '44' }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={resultado.puntos}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="text-center z-10"
                        >
                            <div className="text-4xl font-black mb-1" style={{ color: resultado.color }}>
                                {resultado.puntos} <span className="text-sm">pts</span>
                            </div>
                            <div className="text-xs font-bold uppercase tracking-widest opacity-80" style={{ color: resultado.color }}>
                                {resultado.tipo}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Background Glow */}
                    <div
                        className="absolute inset-0 opacity-5 blur-3xl pointer-events-none"
                        style={{ backgroundColor: resultado.color }}
                    ></div>
                </motion.div>
            </div>

            <div className="bg-[var(--background)]/50 px-6 py-3 text-[9px] text-[var(--text-muted)] text-center border-t border-[var(--card-border)]">
                Exacto (8) • Dif (5) • Ganador (3) • Nada (0)
            </div>
        </div>
    )
}
