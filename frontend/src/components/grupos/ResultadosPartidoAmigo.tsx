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
            className="fixed inset-0 bg-[var(--background)] z-[60] overflow-y-auto"
        >
            {/* Header */}
            <div className="bg-gradient-to-b from-[#3b82f6] to-[#2563eb] text-white pt-10 pb-12 px-6 rounded-b-[3rem] shadow-2xl">
                <div className="max-w-lg mx-auto">
                    <button onClick={onClose} className="bg-white/20 p-2 rounded-full mb-6 backdrop-blur-md hover:bg-white/30 transition-all">← Volver</button>
                    <h1 className="text-3xl font-black italic tracking-tighter capitalize mb-2">📊 Estadísticas</h1>
                    <p className="text-white/80 text-sm font-bold capitalize tracking-widest bg-black/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
                        {fechaDisplay} • {partido.cancha || 'Partido Amigo'}
                    </p>
                    {resultado && (
                        <div className="mt-8 flex items-center justify-center gap-6 text-4xl font-black italic">
                            <div className="flex flex-col items-center">
                                <span className="text-xs capitalize tracking-[0.3em] font-black text-white/60 mb-2">AZUL</span>
                                <span>{partido.resultado_azul}</span>
                            </div>
                            <div className="text-white/30 text-2xl">VS</div>
                            <div className="flex flex-col items-center">
                                <span className="text-xs capitalize tracking-[0.3em] font-black text-white/60 mb-2">ROJO</span>
                                <span>{partido.resultado_rojo}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 font-black italic capitalize tracking-widest text-[var(--text-muted)] animate-pulse">Cargando resultados...</div>
            ) : (
                <div className="max-w-lg mx-auto px-4 -mt-6 pb-20 space-y-6">
                    {/* MVP */}
                    {mvp && mvp.promedio! > 0 && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                            className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden group shadow-amber-500/30"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                            <p className="text-[10px] text-white/80 capitalize font-black tracking-[0.4em] mb-4">MEMBER OF THE MATCH</p>
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                                <div className="text-5xl relative">👑</div>
                            </div>
                            <h2 className="text-3xl font-black text-white italic tracking-tighter capitalize">{mvp.nombre}</h2>
                            <p className="text-4xl font-black text-white mt-2 drop-shadow-lg">⭐ {mvp.promedio}</p>
                            <p className="text-[10px] text-white/80 font-bold capitalize mt-4">{mvp.total_votos} VOTOS EN TOTAL</p>
                        </motion.div>
                    )}

                    {/* Team Results */}
                    <TeamResults
                        equipo="azul"
                        color="#3b82f6"
                        emoji="🔵"
                        jugadores={azules}
                        promedio={promedioEquipo(azules)}
                        onClickJugador={setJugadorDetalle}
                    />

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
        <div className="bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] overflow-hidden shadow-xl">
            <div className="p-5 border-b border-[var(--card-border)] bg-[var(--background)]/50" style={{ borderLeftColor: color, borderLeftWidth: 6 }}>
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-xs font-black capitalize tracking-[0.2em] mb-1" style={{ color }}>
                            {emoji} EQUIPO {equipo.toUpperCase()}
                        </h3>
                        <p className="text-2xl font-black italic tracking-tighter">ESTADÍSTICAS</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[10px] text-[var(--text-muted)] font-black capitalize tracking-widest">PROM EQUIPO</span>
                        <p className="text-xl font-black" style={{ color }}>{promedio}</p>
                    </div>
                </div>
            </div>
            <div>
                {jugadores.map((j, i) => (
                    <button
                        key={j.id}
                        onClick={() => onClickJugador(j)}
                        className={`w-full flex items-center gap-4 p-5 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--hover-bg)] transition-all text-left ${i === 0 ? 'bg-amber-400/5' : ''}`}
                    >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-400 text-amber-900 shadow-md' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}>
                            {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                            <span className="font-bold text-sm block">
                                {i === 0 && '👑 '}{j.nombre}
                            </span>
                            <div className="w-full h-1.5 bg-[var(--background)] rounded-full mt-2 overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((j.promedio || 0) / 10) * 100}%` }}
                                    transition={{ duration: 0.8 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black italic" style={{ color }}>{j.promedio || '-'}</span>
                            <p className="text-[8px] text-[var(--text-muted)] font-bold capitalize">{j.total_votos} V</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
