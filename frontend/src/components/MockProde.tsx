// src/components/MockProde.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Trophy, Info, X } from 'lucide-react'
import { TeamLogo } from './TeamLogo'

export function MockProde() {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState(1)

    const mockMatches = [
        { id: 1, local: 'Argentina', visitante: 'Francia', logoLocal: 'https://media.api-sports.io/football/teams/26.png', logoVisitante: 'https://media.api-sports.io/football/teams/2.png' },
        { id: 2, local: 'Brasil', visitante: 'Alemania', logoLocal: 'https://media.api-sports.io/football/teams/6.png', logoVisitante: 'https://media.api-sports.io/football/teams/25.png' }
    ]

    const [predictions, setPredictions] = useState<any>({})

    const handlePredict = (matchId: number, side: 'local' | 'visitante', val: string) => {
        setPredictions({
            ...predictions,
            [`${matchId}_${side}`]: val
        })
    }

    return (
        <div className="mb-10">
            {/* Simple Button Trigger */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-[var(--card-bg)] border-2 border-[var(--accent)] p-4 flex items-center justify-between hover:bg-[var(--hover-bg)] transition-colors"
                style={{ borderRadius: 'var(--radius)' }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-[var(--accent)] flex items-center justify-center">
                        <Trophy size={20} className="text-[var(--accent)]" />
                    </div>
                    <div className="text-left">
                        <h4 className="font-black text-xs capitalize tracking-widest text-[var(--accent)]">Simulador de Pronósticos</h4>
                        <p className="text-[10px] text-[var(--text-muted)] font-bold capitalize">Jugá el Prode de la fecha</p>
                    </div>
                </div>
                <div className="text-[var(--accent)] font-black text-xs tracking-tighter">INGRESAR →</div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[var(--background)] border-2 border-[var(--foreground)] w-full max-w-md overflow-hidden"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-6 border-b border-[var(--card-border)] pb-3">
                                    <h3 className="text-sm font-black capitalize tracking-widest flex items-center gap-2">
                                        <Trophy size={16} /> Prode (Simulación)
                                    </h3>
                                    <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--foreground)]">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-2 border border-blue-200 bg-blue-50 flex items-center gap-2">
                                        <Info size={14} className="text-blue-600" />
                                        <p className="text-[9px] font-bold text-blue-700 capitalize tracking-tight">
                                            ESTE MODO NO SUMA PUNTOS REALES. ES DE ENTRENAMIENTO.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {mockMatches.map(m => (
                                            <div key={m.id} className="border border-[var(--card-border)] p-4 bg-[var(--card-bg)]">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex flex-col items-center gap-2 flex-1">
                                                        <TeamLogo src={m.logoLocal} teamName={m.local} size={32} />
                                                        <span className="text-[10px] font-bold capitalize truncate w-20 text-center">{m.local}</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            className="w-12 h-10 border border-[var(--card-border)] bg-[var(--background)] text-center font-black text-lg focus:border-[var(--accent)] outline-none"
                                                            onChange={(e) => handlePredict(m.id, 'local', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="text-[var(--text-muted)] font-black text-[10px] capitalize">VS</div>
                                                    <div className="flex flex-col items-center gap-2 flex-1">
                                                        <TeamLogo src={m.logoVisitante} teamName={m.visitante} size={32} />
                                                        <span className="text-[10px] font-bold capitalize truncate w-20 text-center">{m.visitante}</span>
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            className="w-12 h-10 border border-[var(--card-border)] bg-[var(--background)] text-center font-black text-lg focus:border-[var(--accent)] outline-none"
                                                            onChange={(e) => handlePredict(m.id, 'visitante', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        className="w-full py-3 bg-[var(--foreground)] text-[var(--background)] font-black text-xs capitalize tracking-widest hover:bg-[#444] transition-all"
                                        onClick={() => {
                                            alert("Simulación completada. Resultado proyectado al 85%.")
                                            setIsOpen(false)
                                        }}
                                    >
                                        VER RESULTADO →
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
