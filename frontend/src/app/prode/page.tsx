// src/app/prode/page.tsx
'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { usePronosticos } from '@/hooks/usePronosticos'
import { useAuth } from '@/contexts/AuthContext'
import { ProdeCard } from '@/components/ProdeCard'
import { ProdeStats } from '@/components/ProdeStats'
import { SimuladorPuntos } from '@/components/SimuladorPuntos'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { ReglasPuntajeModal } from '@/components/ReglasPuntajeModal'
import { useRouter } from 'next/navigation'
import { useToast } from '@/contexts/ToastContext'
import { fetchFixturesWithSyncAction } from '@/app/actions/football'
import type { Partido } from '@/types'


import { LIGAS, type Liga } from '@/lib/constants'
type FiltroPronostico = 'todos' | 'sin_pronosticar' | 'pronosticados'

export default function ProdePage() {
    const router = useRouter()
    const { user } = useAuth()
    const { showToast } = useToast()
    const [filtroLiga, setFiltroLiga] = useState<Liga>('Todos')
    const [filtroPronostico, setFiltroPronostico] = useState<FiltroPronostico>('todos')
    const [partidos, setPartidos] = useState<Partido[]>([])
    const [loadingPartidos, setLoadingPartidos] = useState(true)
    const { pronosticos, loading: loadingPronosticos, guardarPronostico } = usePronosticos()

    // Fetch partidos synced with Supabase (returns UUIDs)
    const fetchPartidos = useCallback(async () => {
        try {
            setLoadingPartidos(true)
            const ligaName = filtroLiga === 'Todos' ? 'Liga Profesional' : filtroLiga
            const data = await fetchFixturesWithSyncAction(ligaName)
            setPartidos(data || [])
        } catch (err) {
            console.error('Error fetching synced partidos:', err)
        } finally {
            setLoadingPartidos(false)
        }
    }, [filtroLiga])

    useEffect(() => {
        fetchPartidos()
    }, [fetchPartidos])

    // Manejar redirección en useEffect para evitar errores de hooks
    useEffect(() => {
        if (!user && !loadingPronosticos) {
            router.push('/login')
        }
    }, [user, loadingPronosticos, router])

    // Filtrar solo partidos en PREVIA o próximos
    const partidosDisponibles = useMemo(() => {
        return partidos.filter(partido => {
            const fechaInicio = new Date(partido.fecha_inicio)
            const ahora = new Date()
            return fechaInicio > ahora || partido.estado === 'PREVIA'
        }).sort((a, b) => {
            return new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
        })
    }, [partidos])

    // Aplicar filtro de pronóstico
    const partidosFiltrados = useMemo(() => {
        if (filtroPronostico === 'todos') return partidosDisponibles

        return partidosDisponibles.filter(partido => {
            const tienePronostico = pronosticos.some(p => String(p.partido_id) === String(partido.id))
            return filtroPronostico === 'pronosticados' ? tienePronostico : !tienePronostico
        })
    }, [partidosDisponibles, pronosticos, filtroPronostico])

    // Contadores para los tabs
    const contadores = useMemo(() => {
        const sinPronosticar = partidosDisponibles.filter(p =>
            !pronosticos.some(pr => String(pr.partido_id) === String(p.id))
        ).length
        const conPronostico = partidosDisponibles.length - sinPronosticar
        return { todos: partidosDisponibles.length, sinPronosticar, conPronostico }
    }, [partidosDisponibles, pronosticos])

    const handleGuardarPronostico = async (partidoId: string | number, golesLocal: number, golesVisitante: number) => {
        // Toast is now handled inside ProdeCard for better UX
        await guardarPronostico(String(partidoId), golesLocal, golesVisitante)
    }

    const getPronosticoExistente = (partidoId: string | number) => {
        return pronosticos.find(p => String(p.partido_id) === String(partidoId)) || null
    }

    // Mostrar loader o nada mientras redirige
    if (!user && !loadingPronosticos) {
        return null
    }

    return (
        <>
            <DesktopNav />

            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20 overflow-x-hidden">
                {/* Header */}
                <div className="px-6 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                                    Hacer Pronósticos 🎯
                                </h1>
                                <p className="text-sm text-[var(--text-muted)] font-medium">
                                    Predecí los resultados y sumá puntos.
                                </p>
                            </div>
                            <ReglasPuntajeModal />
                        </div>
                    </div>
                </div>

                {/* Filtros de liga */}
                <div className="px-6 mb-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {LIGAS.map(liga => (
                                <button
                                    key={liga}
                                    onClick={() => setFiltroLiga(liga)}
                                    className={`px-5 py-2.5 rounded-xl text-xs font-bold capitalize tracking-tight transition-all whitespace-nowrap border
                             ${filtroLiga === liga
                                            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-purple-500/20'
                                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]'
                                        }`}
                                >
                                    {liga}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filtros de pronóstico */}
                <div className="px-6 mb-10">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] w-fit shadow-sm">
                            <button
                                onClick={() => setFiltroPronostico('todos')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold capitalize tracking-tight transition-all flex items-center gap-2
                                    ${filtroPronostico === 'todos'
                                        ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                                        : 'text-[var(--text-muted)]'}`}
                            >
                                Todos <span className="bg-[var(--card-border)] px-2 py-0.5 rounded-full text-[9px] font-bold">{contadores.todos}</span>
                            </button>
                            <button
                                onClick={() => setFiltroPronostico('sin_pronosticar')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold capitalize tracking-tight transition-all flex items-center gap-2
                                    ${filtroPronostico === 'sin_pronosticar'
                                        ? 'bg-[#ef4444]/10 text-[#ef4444] shadow-sm'
                                        : 'text-[var(--text-muted)]'}`}
                            >
                                Pendientes <span className="bg-[#ef4444]/20 text-[#ef4444] px-2 py-0.5 rounded-full text-[9px] font-bold">{contadores.sinPronosticar}</span>
                            </button>
                            <button
                                onClick={() => setFiltroPronostico('pronosticados')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-bold capitalize tracking-tight transition-all flex items-center gap-2
                                    ${filtroPronostico === 'pronosticados'
                                        ? 'bg-[var(--accent)]/10 text-[var(--accent)] shadow-sm'
                                        : 'text-[var(--text-muted)]'}`}
                            >
                                Completados <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${filtroPronostico === 'pronosticados' ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--card-border)]'}`}>{contadores.conPronostico}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats del usuario y Simulador */}
                <div className="px-6 mb-16">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Mis Stats (Col 1) */}
                        <div className="md:col-span-1">
                            <ProdeStats />
                        </div>

                        {/* Simulador (Col 2-3) */}
                        <div className="md:col-span-2">
                            <SimuladorPuntos />
                        </div>
                    </div>
                </div>

                {/* Grid de partidos */}
                <div className="px-6">
                    <div className="max-w-4xl mx-auto">
                        {loadingPartidos || loadingPronosticos ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {Array(6).fill(0).map((_, idx) => (
                                    <PartidoCardSkeleton key={idx} />
                                ))}
                            </div>
                        ) : partidosFiltrados.length === 0 ? (
                            <div className="text-center py-20 bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] shadow-xl">
                                <span className="text-6xl mb-6 block">
                                    {filtroPronostico === 'sin_pronosticar' ? '🎉' : filtroPronostico === 'pronosticados' ? '📝' : '🎯'}
                                </span>
                                <h3 className="text-xl font-bold tracking-tight mb-2">
                                    {filtroPronostico === 'sin_pronosticar'
                                        ? '¡Completaste todo!'
                                        : filtroPronostico === 'pronosticados'
                                            ? 'Sin pronósticos'
                                            : 'Sin partidos'}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                                    {filtroPronostico === 'sin_pronosticar'
                                        ? 'No hay más partidos pendientes para pronosticar.'
                                        : filtroPronostico === 'pronosticados'
                                            ? 'Hacé tu primer pronóstico para sumar puntos.'
                                            : 'No hay partidos próximos en esta liga.'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger-fade">
                                {partidosFiltrados.map(partido => (
                                    <ProdeCard
                                        key={partido.id}
                                        partido={partido}
                                        pronosticoExistente={getPronosticoExistente(partido.id)}
                                        onGuardar={(golesLocal, golesVisitante) =>
                                            handleGuardarPronostico(partido.id, golesLocal, golesVisitante)
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CTA para ver ranking */}
                {partidosFiltrados.length > 0 && (
                    <div className="px-6 mt-12 mb-8">
                        <div className="max-w-4xl mx-auto text-center">
                            <button
                                onClick={() => router.push('/ranking')}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--card-bg)] 
                            border border-[var(--accent-green)] text-[var(--accent-green)] rounded-2xl font-bold capitalize tracking-tight text-xs
                            hover:bg-[var(--accent-green)] hover:text-black transition-all shadow-lg hover:shadow-green-500/10"
                            >
                                <span>🏆</span>
                                Ver Tabla de Posiciones
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <NavBar />
        </>
    )
}
