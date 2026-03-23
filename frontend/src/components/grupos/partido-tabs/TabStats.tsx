// src/components/grupos/partido-tabs/TabStats.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { PartidoAmigo, JugadorPartidoAmigo } from '@/types'

interface Props {
    partido: PartidoAmigo
    jugadores: JugadorPartidoAmigo[]
    canEdit: boolean
    onGuardar: (stats: { id: string; goles: number; asistencias: number }[], azul: number, rojo: number) => Promise<void>
    onReabrir: () => Promise<void>
}

export function TabStats({ partido, jugadores, canEdit, onGuardar, onReabrir }: Props) {
    const [goles, setGoles] = useState<Record<string, number>>({})
    const [asistencias, setAsistencias] = useState<Record<string, number>>({})
    const [procesando, setProcesando] = useState(false)

    // Sync cuando jugadores cambia
    useEffect(() => {
        setGoles(Object.fromEntries(jugadores.map(j => [j.id, j.goles || 0])))
        setAsistencias(Object.fromEntries(jugadores.map(j => [j.id, j.asistencias || 0])))
    }, [jugadores])

    const delta = (id: string, tipo: 'goles' | 'asistencias', d: number) => {
        if (partido.stats_completed || !canEdit) return
        if (tipo === 'goles') setGoles(p => ({ ...p, [id]: Math.max(0, (p[id] || 0) + d) }))
        else setAsistencias(p => ({ ...p, [id]: Math.max(0, (p[id] || 0) + d) }))
    }

    const totalAzul = jugadores.filter(j => j.equipo === 'azul').reduce((a, j) => a + (goles[j.id] || 0), 0)
    const totalRojo = jugadores.filter(j => j.equipo === 'rojo').reduce((a, j) => a + (goles[j.id] || 0), 0)

    const handleGuardar = async () => {
        if (procesando || !canEdit) return
        setProcesando(true)
        try {
            await onGuardar(
                jugadores.map(j => ({ id: j.id, goles: goles[j.id] || 0, asistencias: asistencias[j.id] || 0 })),
                totalAzul,
                totalRojo
            )
        } finally {
            setProcesando(false)
        }
    }

    return (
        <div className="space-y-6 pb-32">
            {/* Aviso si no puede editar */}
            {!canEdit && (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                        👀 Solo el creador o admin puede editar estadísticas
                    </p>
                </div>
            )}

            {/* Equipo Azul */}
            <div className="bg-blue-500/5 rounded-3xl border border-blue-500/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-blue-500/10 flex items-center justify-between">
                    <h4 className="font-black text-blue-500 text-xs uppercase tracking-widest">🔵 Equipo Azul</h4>
                    <span className="text-xl font-black text-blue-500">{totalAzul}</span>
                </div>
                {jugadores.filter(j => j.equipo === 'azul').map(j => (
                    <JugadorStatRow
                        key={j.id}
                        jugador={j}
                        goles={goles[j.id] || 0}
                        asistencias={asistencias[j.id] || 0}
                        canEdit={canEdit && !partido.stats_completed}
                        colorGoles="#3b82f6"
                        colorAsist="#6de0f5"
                        onDelta={delta}
                    />
                ))}
            </div>

            {/* Equipo Rojo */}
            <div className="bg-red-500/5 rounded-3xl border border-red-500/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-red-500/10 flex items-center justify-between">
                    <h4 className="font-black text-red-500 text-xs uppercase tracking-widest">🔴 Equipo Rojo</h4>
                    <span className="text-xl font-black text-red-500">{totalRojo}</span>
                </div>
                {jugadores.filter(j => j.equipo === 'rojo').map(j => (
                    <JugadorStatRow
                        key={j.id}
                        jugador={j}
                        goles={goles[j.id] || 0}
                        asistencias={asistencias[j.id] || 0}
                        canEdit={canEdit && !partido.stats_completed}
                        colorGoles="#ef4444"
                        colorAsist="#ff8a8a"
                        onDelta={delta}
                    />
                ))}
            </div>

            {/* Botón Reabrir */}
            {canEdit && partido.stats_completed && (
                <button
                    onClick={async () => { setProcesando(true); try { await onReabrir() } finally { setProcesando(false) } }}
                    disabled={procesando}
                    className="w-full py-4 bg-orange-500/10 text-orange-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-500/20 transition-all border border-orange-500/20 disabled:opacity-50"
                >
                    {procesando ? '⏳' : 'Reabrir para editar 🔓'}
                </button>
            )}

            {/* Barra de confirmación fija */}
            {canEdit && !partido.stats_completed && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50 pointer-events-none">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 shadow-2xl max-w-md mx-auto pointer-events-auto"
                    >
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Azul</p>
                                <p className="text-2xl font-black">{totalAzul}</p>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">VS</span>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Rojo</p>
                                <p className="text-2xl font-black">{totalRojo}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleGuardar}
                            disabled={procesando}
                            className="w-full bg-[#16a34a] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-50 hover:brightness-110 transition-all"
                        >
                            {procesando ? '⏳ Guardando...' : '🔥 Confirmar y cerrar partido'}
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

function JugadorStatRow({ jugador, goles, asistencias, canEdit, colorGoles, colorAsist, onDelta }: {
    jugador: JugadorPartidoAmigo
    goles: number
    asistencias: number
    canEdit: boolean
    colorGoles: string
    colorAsist: string
    onDelta: (id: string, tipo: 'goles' | 'asistencias', d: number) => void
}) {
    return (
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--card-border)] last:border-0">
            <span className="font-bold text-sm truncate max-w-[120px]">{jugador.nombre}</span>
            <div className="flex gap-4">
                <Counter value={goles} color={colorGoles} emoji="⚽" canEdit={canEdit} onDelta={d => onDelta(jugador.id, 'goles', d)} />
                <Counter value={asistencias} color={colorAsist} emoji="👟" canEdit={canEdit} onDelta={d => onDelta(jugador.id, 'asistencias', d)} />
            </div>
        </div>
    )
}

function Counter({ value, color, emoji, canEdit, onDelta }: {
    value: number; color: string; emoji: string; canEdit: boolean
    onDelta: (d: number) => void
}) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] opacity-50">{emoji}</span>
            <div className="flex items-center gap-1 bg-[var(--background)] px-1 py-1 rounded-xl border border-[var(--card-border)]">
                <button
                    onClick={() => onDelta(-1)}
                    disabled={!canEdit || value === 0}
                    className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--hover-bg)] rounded-lg disabled:opacity-20 text-lg"
                >-</button>
                <span className="w-5 text-center font-black text-sm tabular-nums" style={{ color: value > 0 ? color : undefined }}>{value}</span>
                <button
                    onClick={() => onDelta(1)}
                    disabled={!canEdit}
                    className="w-7 h-7 flex items-center justify-center text-[#16a34a] hover:bg-[#16a34a]/10 rounded-lg disabled:opacity-20 text-lg"
                >+</button>
            </div>
        </div>
    )
}
