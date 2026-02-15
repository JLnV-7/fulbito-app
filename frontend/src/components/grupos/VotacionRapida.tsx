// src/components/grupos/VotacionRapida.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/contexts/ToastContext'
import type { JugadorPartidoAmigo } from '@/types'

interface VotacionRapidaProps {
    jugadores: JugadorPartidoAmigo[]
    onVotarTodos: (votos: { jugadorId: string; nota: number }[]) => Promise<void>
    onClose: () => void
}

export function VotacionRapida({ jugadores, onVotarTodos, onClose }: VotacionRapidaProps) {
    const { showToast } = useToast()
    const [votosRapidos, setVotosRapidos] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {}
        jugadores.forEach(j => {
            if (j.mi_voto) initial[j.id] = j.mi_voto.nota
        })
        return initial
    })
    const [guardando, setGuardando] = useState(false)

    const setVoto = (jugadorId: string, nota: number) => {
        setVotosRapidos(prev => ({ ...prev, [jugadorId]: nota }))
    }

    const handleGuardar = async () => {
        const votos = Object.entries(votosRapidos)
            .filter(([, nota]) => nota > 0)
            .map(([jugadorId, nota]) => ({ jugadorId, nota }))

        if (votos.length === 0) return
        setGuardando(true)
        try {
            await onVotarTodos(votos)
            onClose()
        } catch (error: unknown) {
            showToast('Error al guardar votos. Intentá de nuevo.', 'error')
            console.error('Error en votación rápida:', error)
        } finally {
            setGuardando(false)
        }
    }

    const azules = jugadores.filter(j => j.equipo === 'azul')
    const rojos = jugadores.filter(j => j.equipo === 'rojo')

    const votados = Object.values(votosRapidos).filter(v => v > 0).length

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="bg-[var(--card-bg)] rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto border border-[var(--card-border)] shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-[var(--card-bg)] z-10 p-5 border-b border-[var(--card-border)] flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black">⚡ Votación Rápida</h3>
                            <p className="text-xs text-[var(--text-muted)]">Votá a todos de una — {votados}/{jugadores.length}</p>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)]"
                        >✕</button>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* Equipo Azul */}
                        <div>
                            <h4 className="font-bold text-sm mb-2 text-[#3b82f6]">🔵 EQUIPO AZUL</h4>
                            <div className="space-y-2">
                                {azules.map(j => (
                                    <QuickVoteRow
                                        key={j.id}
                                        jugador={j}
                                        nota={votosRapidos[j.id] || 0}
                                        onSetNota={(n) => setVoto(j.id, n)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Equipo Rojo */}
                        <div>
                            <h4 className="font-bold text-sm mb-2 text-[#ef4444]">🔴 EQUIPO ROJO</h4>
                            <div className="space-y-2">
                                {rojos.map(j => (
                                    <QuickVoteRow
                                        key={j.id}
                                        jugador={j}
                                        nota={votosRapidos[j.id] || 0}
                                        onSetNota={(n) => setVoto(j.id, n)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-[var(--card-bg)] p-4 border-t border-[var(--card-border)] flex gap-3">
                        <button onClick={onClose}
                            className="flex-1 py-3 rounded-xl text-[var(--text-muted)] font-bold">
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardar}
                            disabled={votados === 0 || guardando}
                            className="flex-1 py-3 rounded-xl font-black text-black bg-[#fbbf24] disabled:opacity-40"
                        >
                            {guardando ? '⏳' : `Guardar ${votados} votos`}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

function QuickVoteRow({ jugador, nota, onSetNota }: {
    jugador: JugadorPartidoAmigo
    nota: number
    onSetNota: (n: number) => void
}) {
    return (
        <div className="flex items-center gap-2 bg-[var(--background)] rounded-xl p-2">
            <span className="text-xs font-bold w-20 truncate">{jugador.nombre}</span>
            <div className="flex gap-1 flex-1 overflow-x-auto no-scrollbar">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <button
                        key={n}
                        onClick={() => onSetNota(n)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 transition-all ${nota === n
                            ? 'bg-[#fbbf24] text-black scale-110 shadow-md'
                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                            }`}
                    >
                        {n}
                    </button>
                ))}
            </div>
        </div>
    )
}
