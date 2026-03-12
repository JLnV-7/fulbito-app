'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useToast } from '@/contexts/ToastContext'
import type { JugadorPartidoAmigo, PartidoAmigo } from '@/types'

interface MatchStatisticsPanelProps {
    partido: PartidoAmigo
    jugadores: JugadorPartidoAmigo[]
    grupoId: string
    onUpdate: () => void
}

export function MatchStatisticsPanel({ partido, jugadores, grupoId, onUpdate }: MatchStatisticsPanelProps) {
    const { cerrarPartidoMundial } = usePartidosAmigos(grupoId)
    const { showToast } = useToast()

    // Internal state for unsaved stats
    const [goles, setGoles] = useState<Record<string, number>>(
        Object.fromEntries(jugadores.map(j => [j.id, j.goles || 0]))
    )
    const [asistencias, setAsistencias] = useState<Record<string, number>>(
        Object.fromEntries(jugadores.map(j => [j.id, j.asistencias || 0]))
    )
    const [procesando, setProcesando] = useState(false)

    const handleUpdateStat = (id: string, type: 'goles' | 'asistencias', delta: number) => {
        if (partido.stats_completed) return
        
        if (type === 'goles') {
            setGoles(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
        } else {
            setAsistencias(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }))
        }
    }

    const handleSaveStats = async () => {
        setProcesando(true)
        try {
            const azulGoles = jugadores.filter(j => j.equipo === 'azul').reduce((acc, j) => acc + (goles[j.id] || 0), 0)
            const rojoGoles = jugadores.filter(j => j.equipo === 'rojo').reduce((acc, j) => acc + (goles[j.id] || 0), 0)

            const statsPayload = jugadores.map(j => ({
                id: j.id,
                goles: goles[j.id] || 0,
                asistencias: asistencias[j.id] || 0
            }))

            await cerrarPartidoMundial(partido.id, azulGoles, rojoGoles, statsPayload)
            showToast('Estadísticas guardadas y partido cerrado 🏆', 'success')
            onUpdate()
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error')
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
                    disabled={partido.stats_completed || value === 0}
                    className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--hover-bg)] rounded-lg disabled:opacity-20"
                >-</button>
                <span className="w-4 text-center font-black text-sm tabular-nums" style={{ color: value > 0 ? color : 'inherit' }}>
                    {value}
                </span>
                <button 
                    onClick={() => onDelta(1)}
                    disabled={partido.stats_completed}
                    className="w-7 h-7 flex items-center justify-center text-[#16a34a] hover:bg-[#16a34a]/10 rounded-lg disabled:opacity-20"
                >+</button>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                {/* Equipo Azul */}
                <div>
                    <h4 className="font-black text-blue-500 text-[10px] uppercase tracking-[0.2em] mb-3 border-b border-blue-500/10 pb-2">
                        🔵 EQUIPO AZUL
                    </h4>
                    <div className="space-y-3">
                        {jugadores.filter(j => j.equipo === 'azul').map(j => (
                            <div key={j.id} className="flex items-center justify-between bg-[var(--card-bg)] p-3 rounded-2xl border border-[var(--card-border)]">
                                <span className="font-bold text-sm truncate max-w-[120px]">{j.nombre}</span>
                                <div className="flex gap-4">
                                    <Counter value={goles[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'goles', d)} emoji="⚽" color="#16a34a" />
                                    <Counter value={asistencias[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'asistencias', d)} emoji="👟" color="#3b82f6" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Equipo Rojo */}
                <div>
                    <h4 className="font-black text-red-500 text-[10px] uppercase tracking-[0.2em] mb-3 border-b border-red-500/10 pb-2">
                        🔴 EQUIPO ROJO
                    </h4>
                    <div className="space-y-3">
                        {jugadores.filter(j => j.equipo === 'rojo').map(j => (
                            <div key={j.id} className="flex items-center justify-between bg-[var(--card-bg)] p-3 rounded-2xl border border-[var(--card-border)]">
                                <span className="font-bold text-sm truncate max-w-[120px]">{j.nombre}</span>
                                <div className="flex gap-4">
                                    <Counter value={goles[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'goles', d)} emoji="⚽" color="#16a34a" />
                                    <Counter value={asistencias[j.id] || 0} onDelta={(d) => handleUpdateStat(j.id, 'asistencias', d)} emoji="👟" color="#3b82f6" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {!partido.stats_completed && (
                <div className="pt-4 sticky bottom-6 z-10">
                    <button
                        onClick={handleSaveStats}
                        disabled={procesando}
                        className="w-full bg-[#16a34a] text-white py-4 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl shadow-[#16a34a]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {procesando ? 'Guardando...' : 'Confirmar Resultado'}
                    </button>
                    <p className="text-center text-[9px] text-[var(--text-muted)] mt-2 font-black uppercase tracking-widest">
                        Esto cerrará el partido para todos
                    </p>
                </div>
            )}
        </div>
    )
}
