// src/components/MatchTimeline.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CollapsibleSection } from './CollapsibleSection'

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
    gol: '#16a34a',
    penalty: '#16a34a',
    gol_en_contra: '#d97706',
    amarilla: '#d97706',
    roja: '#b91c1c',
    amarilla_roja: '#b91c1c',
    cambio: '#2563eb',
    var: '#6d28d9',
    otro: '#4b5563',
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
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4" style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">⏱️</span>
                    <h3 className="text-[10px] font-black text-[var(--text-muted)] capitalize tracking-widest font-black capitalize">Timeline</h3>
                </div>
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-8 bg-[var(--background)] animate-pulse" style={{ borderRadius: 'var(--radius)' }} />
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
        <CollapsibleSection
            title={
                <div className="flex flex-col gap-1 w-full mr-2">
                    <div className="flex items-center justify-between">
                        <span>Timeline del Partido</span>
                        <div className="flex gap-2 items-center">
                            <span className="text-[9px] font-black capitalize text-[var(--text-muted)] bg-[var(--background)] border border-[var(--card-border)] px-1.5 py-0.5" style={{ borderRadius: 'var(--radius)' }}>
                                {events.length} eventos
                            </span>
                            {events.length > keyEvents.length && (
                                <button
                                    onClick={(e: any) => {
                                        e.stopPropagation()
                                        setExpanded(!expanded)
                                    }}
                                    className="text-[10px] font-black capitalize text-[#16a34a] hover:underline"
                                >
                                    {expanded ? 'Solo clave' : 'Ver todo'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            }
            icon={<span className="text-xl">⏱️</span>}
            defaultOpen={false}
        >

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
                                            className="w-3 h-3 bg-[var(--card-bg)] border-2 flex-shrink-0 z-10 flex items-center justify-center"
                                            style={{ borderColor: color, borderRadius: 'var(--radius)' }}
                                        >
                                            <div className="w-1.5 h-1.5" style={{ backgroundColor: color, borderRadius: 'var(--radius)' }} />
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
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 border ${isLocal
                                                ? 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20'
                                                : 'bg-[#2563eb]/10 text-[#2563eb] border-[#2563eb]/20'
                                                }`} style={{ borderRadius: 'var(--radius)' }}>
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
        </CollapsibleSection>
    )
}
