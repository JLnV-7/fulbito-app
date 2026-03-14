// src/components/FixturesContent.tsx
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { PartidoCard } from '@/components/PartidoCard'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { fetchFixturesAction } from '@/app/actions/football'
import { FixtureTable } from '@/components/FixtureTable'
import type { Partido } from '@/types'
import { LIGAS, type Liga } from '@/lib/constants'
import { useLanguage } from '@/contexts/LanguageContext'
import { hapticFeedback } from '@/lib/helpers'

interface FixturesContentProps {
    ligaExterna?: string
}

export function FixturesContent({ ligaExterna }: FixturesContentProps) {
    const { language } = useLanguage()
    const localeFormat = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-AR'

    const [partidos, setPartidos] = useState<Partido[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
    const [ligaInterna, setLigaInterna] = useState<Liga>('Liga Profesional')

    const liga = ligaExterna || ligaInterna

    const fetchPartidos = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true)
        setError(null)
        try {
            const ligaParaBuscar = liga === 'Todos' ? 'Liga Profesional' : liga
            const data = await fetchFixturesAction(ligaParaBuscar)
            setPartidos(data)

            // Si no hay fecha seleccionada, poner la más cercana a hoy o la última
            if (data.length > 0 && !fechaSeleccionada) {
                const today = new Date().toLocaleDateString('sv-SE')
                const dates = [...new Set(data.map((p: Partido) =>
                    new Date(p.fecha_inicio).toLocaleDateString('sv-SE')
                ))].sort()

                const nearestDate = dates.find(d => d >= today) || dates[dates.length - 1]
                setFechaSeleccionada(nearestDate)
            }
        } catch (err: any) {
            console.error('Error fetching fixtures:', err)
            setError('No pudimos cargar los partidos. Intentá de nuevo.')
        } finally {
            if (showLoading) setLoading(false)
        }
    }, [liga, fechaSeleccionada])

    useEffect(() => {
        fetchPartidos()

        // Polling para actualizaciones en vivo cada 2 minutos si hay partidos en juego
        const interval = setInterval(() => {
            fetchPartidos(false)
        }, 120000)

        return () => clearInterval(interval)
    }, [fetchPartidos])

    const fechasDisponibles = useMemo(() => {
        const dateSet = new Set(partidos.map(p =>
            new Date(p.fecha_inicio).toLocaleDateString('sv-SE')
        ))
        return [...dateSet].sort()
    }, [partidos])

    const partidosFiltrados = useMemo(() => {
        if (!fechaSeleccionada) return partidos
        return partidos.filter(p => {
            const partidoDate = new Date(p.fecha_inicio).toLocaleDateString('sv-SE')
            return partidoDate === fechaSeleccionada
        })
    }, [partidos, fechaSeleccionada])

    const partidosPorHora = useMemo(() => {
        const grupos: Record<string, Partido[]> = {}
        partidosFiltrados.forEach(partido => {
            const hora = new Date(partido.fecha_inicio).toLocaleTimeString(localeFormat, {
                hour: '2-digit',
                minute: '2-digit'
            })
            if (!grupos[hora]) grupos[hora] = []
            grupos[hora].push(partido)
        })
        return Object.entries(grupos).sort((a, b) => a[0].localeCompare(b[0]))
    }, [partidosFiltrados])

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00')
        return {
            weekday: date.toLocaleDateString(localeFormat, { weekday: 'short' }),
            day: date.getDate(),
            month: date.toLocaleDateString(localeFormat, { month: 'short' }),
            full: date.toLocaleDateString(localeFormat, {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            })
        }
    }

    return (
        <div>
            {/* Selector de Liga interno (solo si no viene de afuera) */}
            {!ligaExterna && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                    {LIGAS.map(ligaName => (
                        <button
                            key={ligaName}
                            onClick={() => setLigaInterna(ligaName)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                                ${ligaInterna === ligaName
                                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {ligaName}
                        </button>
                    ))}
                </div>
            )}

            {/* Date selector */}
            {fechasDisponibles.length > 0 && (
                <div className="mb-4">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                        {fechasDisponibles.map(dateStr => {
                            const label = formatDateLabel(dateStr)
                            const isSelected = dateStr === fechaSeleccionada
                            const matchCount = partidos.filter(p =>
                                new Date(p.fecha_inicio).toLocaleDateString('sv-SE') === dateStr
                            ).length

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => { hapticFeedback(5); setFechaSeleccionada(dateStr); }}
                                    className={`flex flex-col items-center px-4 py-3 min-w-[75px] transition-all border
                                        ${isSelected
                                            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm scale-105 z-10'
                                            : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]/30'
                                        }`}
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <span className="text-[9px] capitalize font-black tracking-tighter mb-1 opacity-70">{label.weekday}</span>
                                    <span className="text-xl font-black italic">{label.day}</span>
                                    <span className="text-[9px] font-bold capitalize">{label.month}</span>
                                    {matchCount > 0 && (
                                        <div className={`mt-1.5 px-1.5 py-0.5 text-[7px] font-black
                                            ${isSelected ? 'bg-[var(--background)] text-[var(--foreground)]' : 'bg-[var(--foreground)]/10 text-[var(--foreground)]'}`}
                                            style={{ borderRadius: '2px' }}>
                                            {matchCount} PART
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Selected date header */}
            {fechaSeleccionada && (
                <div className="flex items-center gap-2 mb-6 text-[var(--text-muted)]">
                    <Calendar size={14} className="text-[var(--accent-green)]" />
                    <h2 className="text-xs font-black capitalize tracking-widest">
                        {formatDateLabel(fechaSeleccionada).full}
                    </h2>
                </div>
            )}

            {/* Matches */}
            {loading ? (
                <div className="space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                        <PartidoCardSkeleton key={i} />
                    ))}
                </div>
            ) : error ? (
                <ErrorMessage message={error} onRetry={() => fetchPartidos(true)} />
            ) : partidosFiltrados.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] p-10 text-center"
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    <span className="text-5xl mb-4 block">⚽</span>
                    <h3 className="text-lg font-bold mb-2">No hay partidos</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        No se encontraron partidos para esta fecha
                    </p>
                </motion.div>
            ) : (
                <FixtureTable partidos={partidosFiltrados} />
            )}
        </div>
    )
}
