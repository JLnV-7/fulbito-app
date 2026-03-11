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
            className="fixed inset-0 bg-[var(--background)] z-[60] overflow-y-auto"
        >
            {/* Header */}
            <div className="bg-[#16a34a] text-white pt-10 pb-6 px-6 border-b border-black/10">
                <div className="max-w-lg mx-auto">
                    <button onClick={onClose} className="bg-black/20 p-2 mb-3 font-black capitalize tracking-widest text-[10px] hover:bg-black/30 transition-all" style={{ borderRadius: 'var(--radius)' }}>← Volver</button>
                    <h1 className="text-2xl font-black capitalize italic tracking-tighter">🗳️ Votar Jugadores</h1>
                    <p className="text-white/80 text-[10px] font-bold capitalize tracking-widest leading-none mt-1">{fechaDisplay} - {partido.cancha || 'Sin cancha'}</p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 -mt-3 pb-28 space-y-4">
                {/* Progress */}
                <div className="bg-[var(--card-bg)] p-4 border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="flex justify-between text-[10px] font-black capitalize tracking-widest mb-2">
                        <span>📊 Tu Progreso</span>
                        <span className="text-[#16a34a]">{votados}/{total} votados</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--background)] border border-[var(--card-border)] overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progreso}%` }}
                            className="h-full bg-[#16a34a]"
                        />
                    </div>
                    <p className="text-right text-[10px] font-black tabular-nums text-[var(--text-muted)] mt-1">{progreso}%</p>
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
                            <div className="bg-[var(--card-bg)] border border-[#d97706]/30 p-4 text-center" style={{ borderRadius: 'var(--radius)' }}>
                                <p className="text-[10px] font-black capitalize tracking-widest mb-3">⚠️ Te faltan <span className="text-[#d97706]">{total - votados}</span> jugadores</p>
                                <button
                                    onClick={() => setShowRapida(true)}
                                    className="w-full bg-[#d97706] text-white px-6 py-3 font-black capitalize tracking-widest italic text-sm hover:brightness-110 transition-all"
                                    style={{ borderRadius: 'var(--radius)' }}
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
                        className="bg-[var(--card-bg)] p-4 border border-[var(--card-border)]"
                        style={{ borderRadius: 'var(--radius)' }}
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
                                        <p className="text-[10px] text-[#16a34a] font-black capitalize tracking-widest mt-0.5">✅ Ya votaste</p>
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-[var(--text-muted)] font-black capitalize tracking-widest mt-1">
                                        {'○'.repeat(10)} Sin votar
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => onVotar(j)}
                                className={`px-4 py-2 text-xs font-black capitalize tracking-widest transition-all ${j.mi_voto
                                    ? 'bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'
                                    : 'bg-[#16a34a] text-white'
                                    }`}
                                style={{ borderRadius: 'var(--radius)' }}
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
