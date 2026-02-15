// src/components/grupos/VotarJugadores.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useToast } from '@/contexts/ToastContext'
import { VotarModal } from './VotarModal'
import { VotacionRapida } from './VotacionRapida'
import type { PartidoAmigo, JugadorPartidoAmigo } from '@/types'

interface VotarJugadoresProps {
    partido: PartidoAmigo
    grupoId: string
    onClose: () => void
}

export function VotarJugadores({ partido, grupoId, onClose }: VotarJugadoresProps) {
    const { fetchJugadoresConVotos, votarJugador } = usePartidosAmigos(grupoId)
    const { showToast } = useToast()
    const [jugadores, setJugadores] = useState<JugadorPartidoAmigo[]>([])
    const [loading, setLoading] = useState(true)
    const [votandoA, setVotandoA] = useState<JugadorPartidoAmigo | null>(null)
    const [showRapida, setShowRapida] = useState(false)

    useEffect(() => {
        loadJugadores()
    }, [partido.id])

    const loadJugadores = async () => {
        try {
            const data = await fetchJugadoresConVotos(partido.id)
            setJugadores(data)
        } catch {
            showToast('Error cargando jugadores', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleVotar = async (nota: number, comentario?: string) => {
        if (!votandoA) return
        try {
            await votarJugador(partido.id, votandoA.id, nota, comentario)
            showToast(`Voto guardado para ${votandoA.nombre} ⭐`, 'success')
            await loadJugadores()
        } catch {
            showToast('Error al votar', 'error')
        }
    }

    const handleVotarTodos = async (votos: { jugadorId: string; nota: number }[]) => {
        try {
            for (const v of votos) {
                await votarJugador(partido.id, v.jugadorId, v.nota)
            }
            showToast(`${votos.length} votos guardados ⚡`, 'success')
            await loadJugadores()
        } catch {
            showToast('Error al guardar votos', 'error')
        }
    }

    const azules = jugadores.filter(j => j.equipo === 'azul')
    const rojos = jugadores.filter(j => j.equipo === 'rojo')
    const votados = jugadores.filter(j => j.mi_voto).length
    const total = jugadores.length
    const progreso = total > 0 ? Math.round((votados / total) * 100) : 0

    const fechaDisplay = new Date(partido.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', month: 'short'
    })

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--background)] z-40 overflow-y-auto"
        >
            {/* Header */}
            <div className="bg-gradient-to-b from-[#10b981] to-[#059669] text-white pt-10 pb-6 px-6">
                <div className="max-w-lg mx-auto">
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full mb-3 backdrop-blur-md">← Volver</button>
                    <h1 className="text-2xl font-black">🗳️ Votar Jugadores</h1>
                    <p className="text-white/80 text-sm">{fechaDisplay} - {partido.cancha || 'Sin cancha'}</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 -mt-3 pb-28 space-y-4">
                {/* Progress */}
                <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-lg">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold">📊 Tu Progreso:</span>
                        <span className="font-black text-[#10b981]">{votados}/{total} votados</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--background)] rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progreso}%` }}
                            className="h-full bg-gradient-to-r from-[#10b981] to-[#fbbf24] rounded-full"
                        />
                    </div>
                    <p className="text-right text-xs text-[var(--text-muted)] mt-1">{progreso}%</p>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-[var(--text-muted)]">⏳ Cargando jugadores...</div>
                ) : (
                    <>
                        {/* Equipo Azul */}
                        <TeamVoteSection
                            equipo="azul"
                            color="#3b82f6"
                            emoji="🔵"
                            jugadores={azules}
                            onVotar={setVotandoA}
                        />

                        {/* Equipo Rojo */}
                        <TeamVoteSection
                            equipo="rojo"
                            color="#ef4444"
                            emoji="🔴"
                            jugadores={rojos}
                            onVotar={setVotandoA}
                        />

                        {/* Quick vote CTA */}
                        {votados < total && (
                            <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-2xl p-4 text-center">
                                <p className="text-sm mb-2">⚠️ Te faltan <strong>{total - votados}</strong> jugadores</p>
                                <button
                                    onClick={() => setShowRapida(true)}
                                    className="bg-[#fbbf24] text-black px-6 py-3 rounded-xl font-black hover:shadow-lg hover:shadow-[#fbbf24]/30 transition-all"
                                >
                                    ⚡ Votar Todos
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Individual vote modal */}
            {votandoA && (
                <VotarModal
                    jugador={votandoA}
                    onVotar={handleVotar}
                    onClose={() => setVotandoA(null)}
                />
            )}

            {/* Quick vote modal */}
            {showRapida && (
                <VotacionRapida
                    jugadores={jugadores}
                    onVotarTodos={handleVotarTodos}
                    onClose={() => setShowRapida(false)}
                />
            )}
        </motion.div>
    )
}

function TeamVoteSection({ equipo, color, emoji, jugadores, onVotar }: {
    equipo: 'azul' | 'rojo'
    color: string
    emoji: string
    jugadores: JugadorPartidoAmigo[]
    onVotar: (j: JugadorPartidoAmigo) => void
}) {
    return (
        <div>
            <h3 className="font-black text-sm mb-2" style={{ color }}>
                {emoji} EQUIPO {equipo.toUpperCase()}
            </h3>
            <div className="space-y-2">
                {jugadores.map((j, i) => (
                    <motion.div
                        key={j.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-[var(--card-bg)] rounded-xl p-4 border border-[var(--card-border)]"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold">👤 {j.nombre}</p>
                                {j.mi_voto ? (
                                    <div className="mt-1">
                                        <span className="text-xs">
                                            {Array.from({ length: 10 }, (_, i) => (
                                                <span key={i} className={i < j.mi_voto!.nota ? 'opacity-100' : 'opacity-20'}>⭐</span>
                                            ))}
                                            {' '}{j.mi_voto.nota}/10
                                        </span>
                                        {j.mi_voto.comentario && (
                                            <p className="text-xs text-[var(--text-muted)] mt-0.5">💬 &ldquo;{j.mi_voto.comentario}&rdquo;</p>
                                        )}
                                        <p className="text-[10px] text-[#10b981] font-bold mt-0.5">✅ Ya votaste</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
                                        {'○'.repeat(10)} Sin votar
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => onVotar(j)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${j.mi_voto
                                    ? 'bg-[var(--background)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                                    : 'bg-[#10b981] text-white hover:bg-[#059669]'
                                    }`}
                            >
                                {j.mi_voto ? 'Editar' : 'Votar →'}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
