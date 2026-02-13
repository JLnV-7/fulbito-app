// src/components/grupos/ResultadosPartidoAmigo.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useToast } from '@/contexts/ToastContext'
import { DetalleJugadorAmigo } from './DetalleJugadorAmigo'
import type { PartidoAmigo, JugadorPartidoAmigo } from '@/types'

interface ResultadosProps {
    partido: PartidoAmigo
    grupoId: string
    onClose: () => void
}

export function ResultadosPartidoAmigo({ partido, grupoId, onClose }: ResultadosProps) {
    const { fetchJugadoresConVotos } = usePartidosAmigos(grupoId)
    const { showToast } = useToast()
    const [jugadores, setJugadores] = useState<JugadorPartidoAmigo[]>([])
    const [loading, setLoading] = useState(true)
    const [jugadorDetalle, setJugadorDetalle] = useState<JugadorPartidoAmigo | null>(null)

    useEffect(() => {
        loadResultados()
    }, [partido.id])

    const loadResultados = async () => {
        try {
            const data = await fetchJugadoresConVotos(partido.id)
            setJugadores(data)
        } catch {
            showToast('Error cargando resultados', 'error')
        } finally {
            setLoading(false)
        }
    }

    const sorted = [...jugadores].sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
    const mvp = sorted[0]
    const top3 = sorted.slice(0, 3)
    const azules = jugadores.filter(j => j.equipo === 'azul').sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
    const rojos = jugadores.filter(j => j.equipo === 'rojo').sort((a, b) => (b.promedio || 0) - (a.promedio || 0))

    const promedioEquipo = (equipo: JugadorPartidoAmigo[]) => {
        const conVotos = equipo.filter(j => (j.promedio || 0) > 0)
        if (conVotos.length === 0) return 0
        return Math.round(conVotos.reduce((sum, j) => sum + (j.promedio || 0), 0) / conVotos.length * 10) / 10
    }

    const fechaDisplay = new Date(partido.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
        weekday: 'short', day: 'numeric', month: 'short'
    })

    const resultado = partido.resultado_azul !== undefined && partido.resultado_rojo !== undefined
        ? `Azul ${partido.resultado_azul}-${partido.resultado_rojo} Rojo`
        : null

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-[var(--background)] z-40 overflow-y-auto"
        >
            {/* Header */}
            <div className="bg-gradient-to-b from-[#8b5cf6] to-[#7c3aed] text-white pt-10 pb-6 px-6">
                <div className="max-w-lg mx-auto">
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full mb-3 backdrop-blur-md">← Volver</button>
                    <h1 className="text-2xl font-black">📊 Resultados</h1>
                    <p className="text-white/80 text-sm">
                        {fechaDisplay} - {resultado || partido.cancha || 'Partido'}
                    </p>
                    {resultado && (
                        <p className="text-white/80 text-sm">{partido.cancha}</p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-[var(--text-muted)]">⏳ Cargando resultados...</div>
            ) : (
                <div className="max-w-lg mx-auto px-4 -mt-3 pb-10 space-y-4">
                    {/* MVP */}
                    {mvp && mvp.promedio! > 0 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="bg-gradient-to-br from-[#fbbf24]/20 to-[#f59e0b]/10 border border-[#fbbf24]/30 rounded-2xl p-6 text-center shadow-lg"
                        >
                            <p className="text-xs text-[var(--text-muted)] uppercase font-bold mb-2">🏆 MVP del Partido</p>
                            <div className="text-4xl mb-2">👑</div>
                            <h2 className="text-2xl font-black">{mvp.nombre}</h2>
                            <p className="text-3xl font-black text-[#fbbf24] mt-1">⭐ {mvp.promedio}</p>
                            <p className="text-xs text-[var(--text-muted)]">{mvp.total_votos} votos</p>
                        </motion.div>
                    )}

                    {/* Top 3 */}
                    {top3.length >= 2 && (
                        <div className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)]">
                            <h3 className="font-black text-sm mb-3">🥈 TOP 3</h3>
                            {top3.slice(1, 3).map((j, i) => (
                                <button
                                    key={j.id}
                                    onClick={() => setJugadorDetalle(j)}
                                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-all text-left"
                                >
                                    <span className="text-sm font-bold text-[var(--text-muted)]">{i + 2}.</span>
                                    <span className="font-bold flex-1">{j.nombre}</span>
                                    <span className="text-sm font-black text-[#fbbf24]">{j.promedio} ⭐</span>
                                    <span className="text-xs text-[var(--text-muted)]">({j.total_votos})</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Equipo Azul */}
                    <TeamResults
                        equipo="azul"
                        color="#3b82f6"
                        emoji="🔵"
                        jugadores={azules}
                        promedio={promedioEquipo(azules)}
                        onClickJugador={setJugadorDetalle}
                    />

                    {/* Equipo Rojo */}
                    <TeamResults
                        equipo="rojo"
                        color="#ef4444"
                        emoji="🔴"
                        jugadores={rojos}
                        promedio={promedioEquipo(rojos)}
                        onClickJugador={setJugadorDetalle}
                    />
                </div>
            )}

            {/* Player detail modal */}
            {jugadorDetalle && (
                <DetalleJugadorAmigo
                    jugador={jugadorDetalle}
                    grupoId={grupoId}
                    onClose={() => setJugadorDetalle(null)}
                />
            )}
        </motion.div>
    )
}

function TeamResults({ equipo, color, emoji, jugadores, promedio, onClickJugador }: {
    equipo: string
    color: string
    emoji: string
    jugadores: JugadorPartidoAmigo[]
    promedio: number
    onClickJugador: (j: JugadorPartidoAmigo) => void
}) {
    return (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--card-border)]" style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
                <div className="flex justify-between items-center">
                    <h3 className="font-black text-sm" style={{ color }}>
                        {emoji} EQUIPO {equipo.toUpperCase()}
                    </h3>
                    <span className="text-xs text-[var(--text-muted)]">Promedio: <strong style={{ color }}>{promedio}</strong></span>
                </div>
            </div>
            <div>
                {jugadores.map((j, i) => (
                    <button
                        key={j.id}
                        onClick={() => onClickJugador(j)}
                        className={`w-full flex items-center gap-3 p-4 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--hover-bg)] transition-all text-left ${i === 0 ? 'bg-[#ffd700]/5' : ''}`}
                    >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-[#ffd700] text-black' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}>
                            {i + 1}
                        </span>
                        <span className="font-bold flex-1">
                            {i === 0 && '👑 '}{j.nombre}
                        </span>
                        <span className="text-sm font-black text-[#fbbf24]">{j.promedio} ⭐</span>
                        <span className="text-xs text-[var(--text-muted)]">({j.total_votos})</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
