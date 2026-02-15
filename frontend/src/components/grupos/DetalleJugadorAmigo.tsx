// src/components/grupos/DetalleJugadorAmigo.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import type { JugadorPartidoAmigo, VotoPartidoAmigo } from '@/types'

interface DetalleJugadorProps {
    jugador: JugadorPartidoAmigo
    grupoId: string
    onClose: () => void
}

export function DetalleJugadorAmigo({ jugador, grupoId, onClose }: DetalleJugadorProps) {
    const { fetchDetalleJugador } = usePartidosAmigos(grupoId)
    const [detalle, setDetalle] = useState<{
        votos: (VotoPartidoAmigo & { profile?: any })[]
        distribucion: Record<number, number>
        promedio: number
        totalVotos: number
    } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDetalle()
    }, [jugador.id])

    const loadDetalle = async () => {
        try {
            const data = await fetchDetalleJugador(jugador.id)
            setDetalle(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const maxDistribucion = detalle
        ? Math.max(...Object.values(detalle.distribucion), 1)
        : 1

    return (
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
                className="bg-[var(--card-bg)] rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-[var(--card-border)] shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-[var(--card-border)] flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-black">👤 {jugador.nombre}</h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            Equipo {jugador.equipo === 'azul' ? '🔵 Azul' : '🔴 Rojo'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[var(--background)] flex items-center justify-center text-[var(--text-muted)]"
                    >✕</button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-[var(--text-muted)]">⏳ Cargando...</div>
                ) : detalle && (
                    <div className="p-5 space-y-5">
                        {/* Nota final */}
                        <div className="text-center">
                            <div className="text-5xl font-black text-[#fbbf24]">⭐ {detalle.promedio}</div>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                Basada en {detalle.totalVotos} voto{detalle.totalVotos !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Distribución de votos */}
                        <div className="bg-[var(--background)] rounded-2xl p-4">
                            <h4 className="font-bold text-sm mb-3">Distribución de votos</h4>
                            <div className="space-y-1.5">
                                {Array.from({ length: 10 }, (_, i) => 10 - i).map(n => {
                                    const count = detalle.distribucion[n] || 0
                                    const width = (count / maxDistribucion) * 100
                                    return (
                                        <div key={n} className="flex items-center gap-2 text-xs">
                                            <span className="w-8 text-right font-bold text-[#fbbf24]">{n} ⭐</span>
                                            <div className="flex-1 h-5 bg-[var(--card-bg)] rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${width}%` }}
                                                    transition={{ delay: 0.1 * (10 - n), duration: 0.5 }}
                                                    className={`h-full rounded-full ${n >= 8 ? 'bg-[#22c55e]' : n >= 5 ? 'bg-[#fbbf24]' : 'bg-[#ef4444]'}`}
                                                />
                                            </div>
                                            <span className="w-6 text-[var(--text-muted)]">({count})</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Comentarios */}
                        {detalle.votos.filter(v => v.comentario).length > 0 && (
                            <div>
                                <h4 className="font-bold text-sm mb-3">
                                    💬 Comentarios ({detalle.votos.filter(v => v.comentario).length})
                                </h4>
                                <div className="space-y-3">
                                    {detalle.votos
                                        .filter(v => v.comentario)
                                        .map(v => (
                                            <div key={v.id} className="bg-[var(--background)] rounded-xl p-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-bold">
                                                        {v.profile?.username || 'Anónimo'}
                                                    </span>
                                                    <span className="text-xs text-[#fbbf24] font-bold">{v.nota}/10 ⭐</span>
                                                </div>
                                                <p className="text-sm text-[var(--text-muted)]">&ldquo;{v.comentario}&rdquo;</p>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </motion.div>
    )
}
