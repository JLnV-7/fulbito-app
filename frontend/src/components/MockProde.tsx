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
        <div className="mb-8">
            <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsOpen(true)}
                className="bg-gradient-to-br from-[#10b981] to-[#059669] p-4 rounded-2xl cursor-pointer shadow-lg shadow-[#10b981]/20 flex items-center justify-between text-white"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <Sparkles size={20} className="text-white animate-pulse" />
                    </div>
                    <div>
                        <h4 className="font-black text-sm uppercase tracking-wide">MOCK PRODE (BETA)</h4>
                        <p className="text-[10px] opacity-80 font-bold uppercase">Practicá tus pronósticos sin riesgo</p>
                    </div>
                </div>
                <Trophy size={20} className="opacity-50" />
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#10b981]/10 p-2 rounded-xl text-[#10b981]">
                                            <Trophy size={20} />
                                        </div>
                                        <h3 className="text-xl font-black italic uppercase italic">SIMULADOR PRODE</h3>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--foreground)]">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
                                        <Info size={16} className="text-blue-500" />
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">
                                            ESTE MODO NO SUMA PUNTOS REALES. ES PARA ENTRENAR TU OJO.
                                        </p>
                                    </div>

                                    {mockMatches.map(m => (
                                        <div key={m.id} className="bg-[var(--background)] p-4 rounded-2xl border border-[var(--card-border)]/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col items-center gap-2 flex-1">
                                                    <TeamLogo src={m.logoLocal} teamName={m.local} size={40} />
                                                    <span className="text-[10px] font-bold uppercase">{m.local}</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        className="w-12 h-10 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-center font-black text-lg focus:border-[#10b981] outline-none"
                                                        onChange={(e) => handlePredict(m.id, 'local', e.target.value)}
                                                    />
                                                </div>
                                                <div className="text-[var(--text-muted)] font-black text-xs px-4">VS</div>
                                                <div className="flex flex-col items-center gap-2 flex-1">
                                                    <TeamLogo src={m.logoVisitante} teamName={m.visitante} size={40} />
                                                    <span className="text-[10px] font-bold uppercase">{m.visitante}</span>
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        className="w-12 h-10 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl text-center font-black text-lg focus:border-[#10b981] outline-none"
                                                        onChange={(e) => handlePredict(m.id, 'visitante', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        className="w-full py-4 bg-[#10b981] text-white font-black rounded-2xl shadow-lg shadow-[#10b981]/30 hover:bg-[#059669] transition-all active:scale-95 uppercase tracking-widest"
                                        onClick={() => {
                                            alert("¡Simulación completada! Acierto proyectado: 85%")
                                            setIsOpen(false)
                                        }}
                                    >
                                        VER RESULTADO PROYECTADO
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
