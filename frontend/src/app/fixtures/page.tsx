// src/app/fixtures/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
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
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
    const [ligaFiltro, setLigaFiltro] = useState<Liga>('Todos')

    // Generar array de fechas (7 días antes y 14 después)
    const fechas = useMemo(() => {
        const result = []
        for (let i = -3; i <= 14; i++) {
            const date = new Date()
            date.setDate(date.getDate() + i)
            result.push(date)
        }
        return result
    }, [])

    useEffect(() => {
        fetchPartidos()
    }, [ligaFiltro]) // Recargar cuando cambia la liga

    const fetchPartidos = async () => {
        setLoading(true)
        try {
            // Traer partidos (el Server Action ya trae +/- 15 días)
            // Si el filtro es "Todos", traemos de varias ligas o solo mostramos mensaje
            // Para simplificar, si es "Todos" traemos LPF por defecto o iteramos
            // Mejor: Traer por la liga seleccionada si no es Todos, sino LPF
            const ligaParaBuscar = ligaFiltro === 'Todos' ? 'Liga Profesional' : ligaFiltro

            const data = await fetchFixturesAction(ligaParaBuscar)
            setPartidos(data)
        } catch (err) {
            console.error('Error fetching fixtures:', err)
        } finally {
            setLoading(false)
        }
    }

    // Helper para status
    const mapStatusToState = (status: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' => {
        if (['NS', 'TBD'].includes(status)) return 'PREVIA'
        if (['FT', 'AET', 'PEN'].includes(status)) return 'FINALIZADO'
        return 'EN_JUEGO'
    }

    // Filtrar por fecha seleccionada
    const partidosFiltrados = useMemo(() => {
        return partidos.filter(p => {
            const partidoDate = new Date(p.fecha_inicio).toLocaleDateString()
            const selectedDate = fechaSeleccionada.toLocaleDateString()
            return partidoDate === selectedDate
        })
    }, [partidos, fechaSeleccionada])

    // Agrupar por hora
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

    const formatDate = (date: Date) => {
        const hoy = new Date()
        const manana = new Date(hoy)
        manana.setDate(manana.getDate() + 1)

        if (date.toDateString() === hoy.toDateString()) return 'Hoy'
        if (date.toDateString() === manana.toDateString()) return 'Mañana'

        return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })
    }

    const isSelected = (date: Date) => {
        return date.toDateString() === fechaSeleccionada.toDateString()
    }

    const isToday = (date: Date) => {
        return date.toDateString() === new Date().toDateString()
    }

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header */}
                <div className="px-6 py-6">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-2xl font-black mb-1">📆 Fixtures</h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Todos los partidos organizados por fecha
                        </p>
                    </div>
                </div>

                {/* Selector de fechas horizontal */}
                <div className="px-6 mb-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
                            {fechas.map((fecha, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setFechaSeleccionada(fecha)}
                                    className={`flex flex-col items-center px-4 py-2 rounded-xl min-w-[70px] transition-all
                                        ${isSelected(fecha)
                                            ? 'bg-[#ff6b6b] text-white'
                                            : isToday(fecha)
                                                ? 'bg-[#ff6b6b]/20 text-[#ff6b6b] border border-[#ff6b6b]/50'
                                                : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)]'
                                        }`}
                                >
                                    <span className="text-[10px] uppercase font-bold">
                                        {fecha.toLocaleDateString('es-AR', { weekday: 'short' })}
                                    </span>
                                    <span className="text-lg font-black">
                                        {fecha.getDate()}
                                    </span>
                                    <span className="text-[10px]">
                                        {fecha.toLocaleDateString('es-AR', { month: 'short' })}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filtro de ligas */}
                <div className="px-6 mb-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                            {LIGAS.map(liga => (
                                <button
                                    key={liga}
                                    onClick={() => setLigaFiltro(liga)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                                        ${ligaFiltro === liga
                                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                                            : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)]'
                                        }`}
                                >
                                    {liga}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Fecha seleccionada */}
                <div className="px-6 mb-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-lg font-bold">
                            {formatDate(fechaSeleccionada)} - {fechaSeleccionada.toLocaleDateString('es-AR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </h2>
                    </div>
                </div>

                {/* Partidos */}
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
                                    No hay partidos programados para esta fecha
                                </p>
                            </motion.div>
                        ) : (
                            <div className="space-y-6">
                                {partidosPorHora.map(([hora, partidosHora]) => (
                                    <div key={hora}>
                                        {/* Cabecera de hora */}
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="text-sm font-bold text-[#ff6b6b]">{hora}</span>
                                            <div className="flex-1 h-px bg-[var(--card-border)]"></div>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {partidosHora.length} partido{partidosHora.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {/* Grid de partidos */}
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
