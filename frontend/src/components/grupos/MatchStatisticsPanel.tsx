'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useToast } from '@/contexts/ToastContext'
import type { JugadorPartidoAmigo, PartidoAmigo } from '@/types'

interface MatchStatisticsPanelProps {
    partido: PartidoAmigo
    jugadores: JugadorPartidoAmigo[]
    grupoId: string
    canEdit?: boolean
    onUpdate: () => void
}

export function MatchStatisticsPanel({ partido, jugadores, grupoId, canEdit = false, onUpdate }: MatchStatisticsPanelProps) {
    const { cerrarPartidoMundial, reabrirEstadisticas } = usePartidosAmigos(grupoId)
    const { showToast } = useToast()

    const [goles, setGoles] = useState<Record<string, number>>(
        Object.fromEntries(jugadores.map(j => [j.id, j.goles || 0]))
    )
    const [asistencias, setAsistencias] = useState<Record<string, number>>(
        Object.fromEntries(jugadores.map(j => [j.id, j.asistencias || 0]))
    )
    const [procesando, setProcesando] = useState(false)

    // Sync cuando jugadores cambia (por recarga de data)
    useEffect(() => {
        setGoles(Object.fromEntries(jugadores.map(j => [j.id, j.goles || 0])))
        setAsistencias(Object.fromEntries(jugadores.map(j => [j.id, j.asistencias || 0])))
    }, [jugadores])

    const handleUpdateStat = (id: string, type: 'goles' | 'asistencias', delta: number) => {
        if (partido.stats_completed || !canEdit) return
        if (type === 'goles') {
            setGoles(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
        } else {
            setAsistencias(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
        }
    }

    const handleSaveStats = async () => {
        if (procesando || !canEdit) return
        setProcesando(true)
        try {
            const azulGoles = jugadores
                .filter(j => j.equipo === 'azul')
                .reduce((acc, j) => acc + (goles[j.id] || 0), 0)
            const rojoGoles = jugadores
                .filter(j => j.equipo === 'rojo')
                .reduce((acc, j) => acc + (goles[j.id] || 0), 0)
            const statsPayload = jugadores.map(j => ({
                id: j.id,
                goles: goles[j.id] || 0,
                asistencias: asistencias[j.id] || 0
            }))
            await cerrarPartidoMundial(partido.id, azulGoles, rojoGoles, statsPayload)
            showToast('Estadísticas guardadas 🏆', 'success')
            setTimeout(() => { onUpdate() }, 500)
        } catch (err: any) {
            showToast('Error al guardar: ' + (err.message || 'Cerrá y reintentá'), 'error')
        } finally {
            setProcesando(false)
        }
    }

    const Counter = ({ value, onDelta, emoji, color }: { value: number, onDelta: (d: number) => void, emoji: string, color: string }) => (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] opacity-50">{emoji}</span>
            <div className="flex items-center gap-2 bg-[var(--background)] px-1 py-1 rounded-xl border border-[var(--card-border)]">
                <button
                    onClick={() => onDelta(-1)}
                    disabled={partido.stats_completed || !canEdit || value === 0}
                    className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--hover-bg)] rounded-lg disabled:opacity-20"
                >-</button>
                <span className="w-4 text-center font-black text-sm tabular-nums" style={{ color: value > 0 ? color : 'inherit' }}>
                    {value}
                </span>
                <button
                    onClick={() => onDelta(1)}
                    disabled={partido.stats_completed || !canEdit}
                    className="w-7 h-7 flex items-center justify-center text-[#16a34a] hover:bg-[#16a34a]/10 rounded-lg disabled:opacity-20"
                >+</button>
            </div>
            {value > 0 && !partido.stats_completed && canEdit && (
                <button
                    onClick={() => onDelta(-value)}
                    className="mt-1 text-[8px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
                >
                    Reset
                </button>
            )}
        </div>
    )

    return (
        <div className="space-y-8 pb-32">
            {/* Aviso solo lectura */}
            {!canEdit && (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-3 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                        👀 Solo el creador o admin del grupo puede editar estadísticas
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-8">
                {/* Equipo Azul */}
                <div className="bg-blue-500/5 rounded-[2.5rem] p-1 border border-blue-500/10 backdrop-blur-sm">
                    <div className="bg-blue-600/10 px-6 py-4 rounded-t-[2.2rem] flex items-center justify-between border-b border-blue-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <h4 className="font-black text-blue-500 text-xs uppercase tracking-[0.2em]">EQUIPO AZUL</h4>
                        </div>
                        <span className="text-xl font-black text-blue-500 italic">
                            {jugadores.filter(j => j.equipo === 'azul').reduce((acc, j) => acc + (goles[j.id] || 0), 0)}
                        </span>
                    </div>
                    <div className="p-2 space-y-1">
                        {jugadores.filter(j => j.equipo === 'azul').map(j => (
                            <div key={j.id} className="flex items-center justify-between hover:bg-blue-500/5 p-4 rounded-2xl transition-all group">
                                <span className="font-bold text-sm truncate max-w-[120px] group-hover:translate-x-1 transition-transform">{j.nombre}</span>
                                <div className="flex gap-4">
                                    <Counter value={goles[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'goles', d)} emoji="⚽" color="#3b82f6" />
                                    <Counter value={asistencias[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'asistencias', d)} emoji="👟" color="#6de0f5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equipo Rojo */}
                <div className="bg-red-500/5 rounded-[2.5rem] p-1 border border-red-500/10 backdrop-blur-sm">
                    <div className="bg-red-600/10 px-6 py-4 rounded-t-[2.2rem] flex items-center justify-between border-b border-red-500/10">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                            <h4 className="font-black text-red-500 text-xs uppercase tracking-[0.2em]">EQUIPO ROJO</h4>
                        </div>
                        <span className="text-xl font-black text-red-500 italic">
                            {jugadores.filter(j => j.equipo === 'rojo').reduce((acc, j) => acc + (goles[j.id] || 0), 0)}
                        </span>
                    </div>
                    <div className="p-2 space-y-1">
                        {jugadores.filter(j => j.equipo === 'rojo').map(j => (
                            <div key={j.id} className="flex items-center justify-between hover:bg-red-500/5 p-4 rounded-2xl transition-all group">
                                <span className="font-bold text-sm truncate max-w-[120px] group-hover:translate-x-1 transition-transform">{j.nombre}</span>
                                <div className="flex gap-4">
                                    <Counter value={goles[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'goles', d)} emoji="⚽" color="#ef4444" />
                                    <Counter value={asistencias[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'asistencias', d)} emoji="👟" color="#ff8a8a" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Botones solo para admins/creadores */}
            {canEdit && (
                <div className="flex gap-4">
                    {!partido.stats_completed && (
                        <button
                            onClick={() => {
                                setGoles(Object.fromEntries(jugadores.map(j => [j.id, 0])))
                                setAsistencias(Object.fromEntries(jugadores.map(j => [j.id, 0])))
                                showToast('Estadísticas reseteadas 🧹', 'success')
                            }}
                            className="flex-1 py-4 bg-gray-500/10 text-gray-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-500/20 transition-all border border-gray-500/10"
                        >
                            Limpiar Todo 🧹
                        </button>
                    )}

                    {partido.stats_completed && (
                        <button
                            onClick={async () => {
                                if (procesando) return
                                setProcesando(true)
                                try {
                                    await reabrirEstadisticas(partido.id)
                                    showToast('Estadísticas reabiertas 🔓', 'success')
                                    onUpdate()
                                } catch {
                                    showToast('Error al reabrir', 'error')
                                } finally {
                                    setProcesando(false)
                                }
                            }}
                            className="flex-1 py-4 bg-orange-500/10 text-orange-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-orange-500/20 transition-all border border-orange-500/10"
                        >
                            Reabrir para Editar 🔓
                        </button>
                    )}
                </div>
            )}

            {/* Botón confirmar — solo para canEdit y partido abierto */}
            {canEdit && !partido.stats_completed && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-50">
                    <div className="max-w-md mx-auto">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-5 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-4 px-2">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Azul</p>
                                    <p className="text-2xl font-black">{jugadores.filter(j => j.equipo === 'azul').reduce((acc, j) => acc + (goles[j.id] || 0), 0)}</p>
                                </div>
                                <div className="h-8 w-px bg-[var(--card-border)]" />
                                <div className="text-center flex flex-col items-center">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">VS</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1 shadow-[0_0_8px_#16a34a]" />
                                </div>
                                <div className="h-8 w-px bg-[var(--card-border)]" />
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Rojo</p>
                                    <p className="text-2xl font-black">{jugadores.filter(j => j.equipo === 'rojo').reduce((acc, j) => acc + (goles[j.id] || 0), 0)}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveStats}
                                disabled={procesando}
                                className="w-full relative group overflow-hidden bg-[#16a34a] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:shadow-[0_0_30px_rgba(22,163,74,0.4)] disabled:opacity-50"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    {procesando ? '⏳ Procesando...' : '🔥 Confirmar y Cerrar'}
                                </span>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                                    animate={{ translateX: ['100%', '-100%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />
                            </button>
                            <p className="text-center text-[8px] text-[var(--text-muted)] mt-3 font-black uppercase tracking-[0.2em]">
                                Finalizará el partido y guardará estadísticas
                            </p>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    )
}
