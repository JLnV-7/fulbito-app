// src/app/prode/page.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { usePartidos } from '@/hooks/usePartidos'
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


import { LIGAS, type Liga } from '@/lib/constants'
type FiltroPronostico = 'todos' | 'sin_pronosticar' | 'pronosticados'

export default function ProdePage() {
    const router = useRouter()
    const { user } = useAuth()
    const { showToast } = useToast()
    const [filtroLiga, setFiltroLiga] = useState<Liga>('Todos')
    const [filtroPronostico, setFiltroPronostico] = useState<FiltroPronostico>('todos')

    const { partidos, loading: loadingPartidos } = usePartidos(filtroLiga)
    const { pronosticos, loading: loadingPronosticos, guardarPronostico } = usePronosticos()

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
        try {
            await guardarPronostico(String(partidoId), golesLocal, golesVisitante)
        } catch (error: any) {
            showToast(error.message || 'Error al guardar pronóstico', 'error')
        }
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

            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header */}
                <div className="px-6 py-6 md:py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                                    Hacer Pronósticos 🎯
                                </h1>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Predecí los resultados y sumá puntos.
                                </p>
                            </div>
                            <ReglasPuntajeModal />
                        </div>
                    </div>
                </div>

                {/* Filtros de liga */}
                <div className="px-6 mb-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {LIGAS.map(liga => (
                                <button
                                    key={liga}
                                    onClick={() => setFiltroLiga(liga)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                             ${filtroLiga === liga
                                            ? 'bg-[#10b981] text-white'
                                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]'
                                        }`}
                                >
                                    {liga}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Filtros de pronóstico */}
                <div className="px-6 mb-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 bg-[var(--card-bg)] p-1 rounded-xl border border-[var(--card-border)] w-fit">
                            <button
                                onClick={() => setFiltroPronostico('todos')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                                    ${filtroPronostico === 'todos'
                                        ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                                        : 'text-[var(--text-muted)]'}`}
                            >
                                Todos <span className="bg-[var(--card-border)] px-2 py-0.5 rounded-full">{contadores.todos}</span>
                            </button>
                            <button
                                onClick={() => setFiltroPronostico('sin_pronosticar')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                                    ${filtroPronostico === 'sin_pronosticar'
                                        ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] shadow-sm'
                                        : 'text-[var(--text-muted)]'}`}
                            >
                                Pendientes <span className="bg-[#ff6b6b]/20 text-[#ff6b6b] px-2 py-0.5 rounded-full">{contadores.sinPronosticar}</span>
                            </button>
                            <button
                                onClick={() => setFiltroPronostico('pronosticados')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2
                                    ${filtroPronostico === 'pronosticados'
                                        ? 'bg-[#10b981]/10 text-[#10b981] shadow-sm'
                                        : 'text-[var(--text-muted)]'}`}
                            >
                                Completados <span className="bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-full">{contadores.conPronostico}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats del usuario y Simulador */}
                <div className="px-6 mb-8">
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Array(6).fill(0).map((_, idx) => (
                                    <PartidoCardSkeleton key={idx} />
                                ))}
                            </div>
                        ) : partidosFiltrados.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="text-6xl mb-4 block">
                                    {filtroPronostico === 'sin_pronosticar' ? '🎉' : filtroPronostico === 'pronosticados' ? '📝' : '🎯'}
                                </span>
                                <h3 className="text-lg font-semibold mb-2">
                                    {filtroPronostico === 'sin_pronosticar'
                                        ? '¡Completaste todos los pronósticos!'
                                        : filtroPronostico === 'pronosticados'
                                            ? 'No tenés pronósticos todavía'
                                            : 'No hay partidos disponibles'}
                                </h3>
                                <p className="text-sm text-[var(--text-muted)]">
                                    {filtroPronostico === 'sin_pronosticar'
                                        ? 'No hay más partidos pendientes para pronosticar'
                                        : filtroPronostico === 'pronosticados'
                                            ? 'Hacé tu primer pronóstico para sumar puntos'
                                            : 'No hay partidos próximos para pronosticar en esta liga'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-fade">
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
                    <div className="px-6 mt-8">
                        <div className="max-w-4xl mx-auto text-center">
                            <button
                                onClick={() => router.push('/ranking')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--card-bg)] 
                           border-2 border-[#10b981] text-[#10b981] rounded-xl font-semibold
                           hover:bg-[#10b981] hover:text-white transition-all"
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
