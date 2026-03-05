// src/components/MatchTimeline.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TimelineEvent {
    minuto: string | number
    tipo: string
    jugador: string
    asistencia: string | null
    equipo: string
    equipoLogo: string
    detalle: string
    comentario: string | null
}

interface MatchTimelineProps {
    fixtureId: number | string
    equipoLocal: string
    equipoVisitante: string
}

const EVENT_ICONS: Record<string, string> = {
    gol: '⚽',
    penalty: '🎯',
    gol_en_contra: '😬',
    amarilla: '🟡',
    roja: '🔴',
    amarilla_roja: '🟡🔴',
    cambio: '🔄',
    var: '📺',
    otro: '📋',
}

const EVENT_COLORS: Record<string, string> = {
    gol: '#10b981',
    penalty: '#10b981',
    gol_en_contra: '#f59e0b',
    amarilla: '#fbbf24',
    roja: '#ef4444',
    amarilla_roja: '#ef4444',
    cambio: '#6366f1',
    var: '#8b5cf6',
    otro: '#6b7280',
}

export function MatchTimeline({ fixtureId, equipoLocal, equipoVisitante }: MatchTimelineProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`/api/partido/${fixtureId}/events`)
                const data = await res.json()
                setEvents(data.events || [])
            } catch (err) {
                console.error('Error loading timeline:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchEvents()
    }, [fixtureId])

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">⏱️</span>
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase">Timeline</h3>
                </div>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-[var(--background)] rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (events.length === 0) return null

    // Key events = goals + reds
    const keyEvents = events.filter(e => ['gol', 'penalty', 'gol_en_contra', 'roja'].includes(e.tipo))
    const displayEvents = expanded ? events : keyEvents

    return (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--card-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm">⏱️</span>
                    <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase">
                        Timeline del Partido
                    </h3>
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--background)] px-2 py-0.5 rounded-full">
                        {events.length} eventos
                    </span>
                </div>
                {events.length > keyEvents.length && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-[10px] font-bold text-[#10b981] hover:underline"
                    >
                        {expanded ? 'Solo clave' : 'Ver todo'}
                    </button>
                )}
            </div>

            {/* Events */}
            <div className="px-4 py-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={expanded ? 'all' : 'key'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative"
                    >
                        {/* Vertical line */}
                        <div className="absolute left-[26px] top-2 bottom-2 w-[1px] bg-[var(--card-border)]" />

                        <div className="space-y-0">
                            {displayEvents.map((event, idx) => {
                                const isLocal = event.equipo === equipoLocal
                                const icon = EVENT_ICONS[event.tipo] || '📋'
                                const color = EVENT_COLORS[event.tipo] || '#6b7280'

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className="flex items-center gap-3 py-1.5 relative"
                                    >
                                        {/* Minute */}
                                        <span className="text-[10px] font-bold tabular-nums w-7 text-right"
                                            style={{ color }}
                                        >
                                            {event.minuto}'
                                        </span>

                                        {/* Dot on the line */}
                                        <div
                                            className="w-3 h-3 rounded-full bg-[var(--card-bg)] border-2 flex-shrink-0 z-10 flex items-center justify-center"
                                            style={{ borderColor: color }}
                                        >
                                            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex items-center gap-2 min-w-0">
                                            <span className="text-xs">{icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold truncate block">
                                                    {event.jugador}
                                                </span>
                                                {event.tipo === 'cambio' && event.asistencia && (
                                                    <span className="text-[10px] text-[var(--text-muted)] block truncate">
                                                        ↩ {event.asistencia}
                                                    </span>
                                                )}
                                                {event.tipo === 'gol' && event.asistencia && (
                                                    <span className="text-[10px] text-[var(--text-muted)] block truncate">
                                                        Asist: {event.asistencia}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Team indicator */}
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isLocal
                                                ? 'bg-[#10b981]/10 text-[#10b981]'
                                                : 'bg-[#6366f1]/10 text-[#6366f1]'
                                                }`}>
                                                {isLocal ? 'L' : 'V'}
                                            </span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
