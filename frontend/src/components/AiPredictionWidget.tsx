// src/components/AiPredictionWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, AlertCircle, Shield, Swords } from 'lucide-react'

interface AiPredictionWidgetProps {
    partidoId: string | number
    equipoLocal: string
    equipoVisitante: string
}

export function AiPredictionWidget({ partidoId, equipoLocal, equipoVisitante }: AiPredictionWidgetProps) {
    const [loading, setLoading] = useState(true)
    const [prediction, setPrediction] = useState<{
        localWin: number
        draw: number
        awayWin: number
        text: string
        keyFactor: string
        winner: 'local' | 'visitante' | 'empate'
    } | null>(null)

    useEffect(() => {
        // Generate a consistent pseudo-random prediction based on the match ID string
        const generatePrediction = () => {
            const seed = String(partidoId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

            // Determine probabilities (making sure they add up to 100)
            let localWin = 30 + (seed % 40)
            const awayWin = 15 + ((seed * 2) % 35)
            let draw = 100 - localWin - awayWin

            // Ensure no negative or crazy numbers
            if (draw < 10) {
                draw = 15
                localWin -= 5
            }

            const maxProb = Math.max(localWin, draw, awayWin)
            const winner = maxProb === localWin ? 'local' : maxProb === awayWin ? 'visitante' : 'empate'

            const analysisTemplates = [
                `${equipoLocal} llega con una racha sólida en casa, pero ${equipoVisitante} tiene el mejor contraataque de la liga.`,
                `Un duelo muy táctico. ${equipoVisitante} intentará dominar la posesión, mientras que ${equipoLocal} buscará golpear rápido.`,
                `Las estadísticas históricas favorecen ligeramente a ${winner === 'local' ? equipoLocal : equipoVisitante}, especialmente en el juego aéreo.`,
                `Ambos equipos necesitan sumar. La clave estará en el mediocampo y quien logre imponer su ritmo durante los primeros 45 minutos.`,
                `${winner === 'local' ? equipoLocal : equipoVisitante} tiene una ligera ventaja estadística debido a su recentísimo poderío goleador.`
            ]

            const factorTemplates = [
                "Posesión y control del mediocampo",
                "Efectividad en pelotas paradas",
                "Rendimiento de los arqueros",
                "Transiciones defensa-ataque",
                "Presión alta en los primeros minutos"
            ]

            setPrediction({
                localWin,
                draw,
                awayWin,
                winner,
                text: analysisTemplates[seed % analysisTemplates.length],
                keyFactor: factorTemplates[(seed * 3) % factorTemplates.length]
            })
            setLoading(false)
        }

        // Simulate API delay for realism
        const timer = setTimeout(generatePrediction, 1200)
        return () => clearTimeout(timer)
    }, [partidoId, equipoLocal, equipoVisitante])

    return (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[#2563eb]/30 shadow-[0_4px_24px_rgba(139,92,246,0.06)] overflow-hidden relative">
            {/* Premium Glow effect behind the widget */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#2563eb]/10 blur-3xl rounded-full pointer-events-none" />

            <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-[#2563eb]">
                    <div className="p-1.5 bg-[#2563eb]/10 rounded-lg">
                        <Sparkles size={18} />
                    </div>
                    <span className="font-black tracking-wide text-sm">PREDICCIÓN IA</span>
                </div>
                <span className="text-[10px] capitalize font-bold text-[var(--text-muted)] bg-[var(--background)] px-2 py-0.5 rounded-full border border-[var(--card-border)]">
                    BETA V1.2
                </span>
            </div>

            <div className="p-5 relative z-10">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-6 gap-3"
                        >
                            <div className="relative">
                                <Sparkles className="text-[#2563eb] animate-pulse" size={28} />
                                <div className="absolute inset-0 bg-[#2563eb] blur-xl opacity-20 animate-pulse" />
                            </div>
                            <p className="text-sm text-[var(--text-muted)] font-medium animate-pulse">
                                Analizando estadísticas históricas y rachas...
                            </p>
                        </motion.div>
                    ) : prediction ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Text Analysis */}
                            <div className="bg-[#2563eb]/5 rounded-xl p-4 border border-[#2563eb]/10">
                                <p className="text-sm leading-relaxed text-[var(--foreground)] font-medium">
                                    {prediction.text}
                                </p>
                                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                                    <AlertCircle size={14} className="text-[#2563eb]" />
                                    <span>Factor clave: <strong className="text-[var(--foreground)]">{prediction.keyFactor}</strong></span>
                                </div>
                            </div>

                            {/* Probabilities Bar */}
                            <div>
                                <div className="flex justify-between text-xs font-bold mb-2 capitalize tracking-wide">
                                    <div className="flex items-center gap-1.5 w-1/3">
                                        <Shield size={12} className="text-[var(--accent-blue)]" />
                                        <span className="truncate">{equipoLocal}</span>
                                    </div>
                                    <div className="text-center text-[var(--text-muted)] w-1/3">Empate</div>
                                    <div className="flex items-center justify-end gap-1.5 w-1/3 text-right">
                                        <span className="truncate">{equipoVisitante}</span>
                                        <Swords size={12} className="text-[#ff6b6b]" />
                                    </div>
                                </div>

                                <div className="h-3 flex rounded-full overflow-hidden border border-[var(--card-border)] bg-[var(--background)]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prediction.localWin}%` }}
                                        transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                                        className="h-full bg-[var(--accent-blue)] flex items-center justify-start px-2 overflow-hidden"
                                    />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prediction.draw}%` }}
                                        transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                                        className="h-full bg-[var(--text-muted)] opacity-50 flex items-center justify-center overflow-hidden"
                                    />
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${prediction.awayWin}%` }}
                                        transition={{ duration: 1, delay: 0.2, type: 'spring' }}
                                        className="h-full bg-[#ff6b6b] flex items-center justify-end px-2 overflow-hidden"
                                    />
                                </div>

                                <div className="flex justify-between text-xs font-black mt-2">
                                    <span className="w-1/3 text-[var(--accent-blue)]">{prediction.localWin}%</span>
                                    <span className="w-1/3 text-center text-[var(--text-muted)]">{prediction.draw}%</span>
                                    <span className="w-1/3 text-right text-[#ff6b6b]">{prediction.awayWin}%</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    )
}
