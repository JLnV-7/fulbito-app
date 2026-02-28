// src/app/fixtures/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCard } from '@/components/PartidoCard'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { motion } from 'framer-motion'
import { fetchFixturesAction } from '@/app/actions/football'
import type { Partido } from '@/types'

import { LIGAS, type Liga } from '@/lib/constants'

export default function FixturesPage() {
    const [partidos, setPartidos] = useState<Partido[]>([])
    const [loading, setLoading] = useState(true)
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)
    const [ligaFiltro, setLigaFiltro] = useState<Liga>('Todos')

    useEffect(() => {
        fetchPartidos()
    }, [ligaFiltro])

    const fetchPartidos = async () => {
        setLoading(true)
        try {
            const ligaParaBuscar = ligaFiltro === 'Todos' ? 'Liga Profesional' : ligaFiltro
            const data = await fetchFixturesAction(ligaParaBuscar)
            setPartidos(data)
            // Auto-select the most recent date from the data
            if (data.length > 0) {
                const dates = [...new Set(data.map(p =>
                    new Date(p.fecha_inicio).toLocaleDateString('sv-SE') // YYYY-MM-DD
                ))].sort()
                setFechaSeleccionada(dates[dates.length - 1]) // Last date
            }
        } catch (err) {
            console.error('Error fetching fixtures:', err)
        } finally {
            setLoading(false)
        }
    }

    // Get unique dates from fetched matches
    const fechasDisponibles = useMemo(() => {
        const dateSet = new Set(partidos.map(p =>
            new Date(p.fecha_inicio).toLocaleDateString('sv-SE')
        ))
        return [...dateSet].sort()
    }, [partidos])

    // Filter by selected date
    const partidosFiltrados = useMemo(() => {
        if (!fechaSeleccionada) return partidos
        return partidos.filter(p => {
            const partidoDate = new Date(p.fecha_inicio).toLocaleDateString('sv-SE')
            return partidoDate === fechaSeleccionada
        })
    }, [partidos, fechaSeleccionada])

    // Group by hour
    const partidosPorHora = useMemo(() => {
        const grupos: Record<string, Partido[]> = {}
        partidosFiltrados.forEach(partido => {
            const hora = new Date(partido.fecha_inicio).toLocaleTimeString('es-AR', {
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
            weekday: date.toLocaleDateString('es-AR', { weekday: 'short' }),
            day: date.getDate(),
            month: date.toLocaleDateString('es-AR', { month: 'short' }),
            full: date.toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            })
        }
    }

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header */}
                <div className="px-6 py-6 md:py-8">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                            📆 Fixtures
                        </h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Últimos partidos de la temporada 2024
                        </p>
                    </div>
                </div>

                {/* Date selector from match data */}
                {fechasDisponibles.length > 0 && (
                    <div className="px-6 mb-4">
                        <div className="max-w-4xl mx-auto">
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
                                            onClick={() => setFechaSeleccionada(dateStr)}
                                            className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[70px] transition-all
                                                ${isSelected
                                                    ? 'bg-[#ff6b6b] text-white'
                                                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:border-[#ff6b6b]/50'
                                                }`}
                                        >
                                            <span className="text-[10px] uppercase font-bold">
                                                {label.weekday}
                                            </span>
                                            <span className="text-lg font-black">
                                                {label.day}
                                            </span>
                                            <span className="text-[10px]">
                                                {label.month}
                                            </span>
                                            <span className={`text-[8px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                                                {matchCount} partido{matchCount !== 1 ? 's' : ''}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* League filter */}
                <div className="px-6 mb-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {LIGAS.map(liga => (
                                <button
                                    key={liga}
                                    onClick={() => setLigaFiltro(liga)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                                        ${ligaFiltro === liga
                                            ? 'bg-[#10b981] text-white'
                                            : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    {liga}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected date header */}
                {fechaSeleccionada && (
                    <div className="px-6 mb-4">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-lg font-bold capitalize">
                                {formatDateLabel(fechaSeleccionada).full}
                            </h2>
                        </div>
                    </div>
                )}

                {/* Matches */}
                <div className="px-6">
                    <div className="max-w-4xl mx-auto">
                        {loading ? (
                            <div className="space-y-4">
                                {Array(4).fill(0).map((_, i) => (
                                    <PartidoCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : partidosFiltrados.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-10 text-center"
                            >
                                <span className="text-5xl mb-4 block">⚽</span>
                                <h3 className="text-lg font-bold mb-2">No hay partidos</h3>
                                <p className="text-sm text-[var(--text-muted)]">
                                    No se encontraron partidos para esta fecha
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                {partidosPorHora.map(([hora, partidosHora]) => (
                                    <div key={hora}>
                                        {/* Hour header */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-sm font-bold text-[#ff6b6b]">{hora}</span>
                                            <div className="flex-1 h-px bg-[var(--card-border)]"></div>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {partidosHora.length} partido{partidosHora.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Match cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {partidosHora.map(partido => (
                                                <PartidoCard key={partido.id} partido={partido} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
