// src/app/historial/page.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { motion } from 'framer-motion'

export default function HistorialPage() {
    const { user } = useAuth()
    const [historial, setHistorial] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filtroLiga, setFiltroLiga] = useState<string>('Todas')

    useEffect(() => {
        if (user) {
            fetchHistorial()
        }
    }, [user])

    const fetchHistorial = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('pronosticos')
                .select(`
                    *,
                    partido:partidos(*),
                    puntuacion:puntuaciones_prode(*)
                `)
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            const finalizados = (data || []).filter(p =>
                p.partido?.estado === 'FINALIZADO' || p.puntuacion?.length > 0
            )

            setHistorial(finalizados)
        } catch (error) {
            console.error('Error fetching historial:', error)
        } finally {
            setLoading(false)
        }
    }

    // Calcular stats detalladas
    const stats = useMemo(() => {
        if (historial.length === 0) return null

        const conPuntos = historial.filter(p => p.puntuacion?.[0]?.puntos !== undefined)
        const totalPuntos = conPuntos.reduce((acc, p) => acc + (p.puntuacion?.[0]?.puntos || 0), 0)

        const exactos = conPuntos.filter(p => p.puntuacion?.[0]?.puntos === 8).length
        const ganadorDif = conPuntos.filter(p => p.puntuacion?.[0]?.puntos === 5).length
        const soloGanador = conPuntos.filter(p => p.puntuacion?.[0]?.puntos === 3).length
        const fallos = conPuntos.filter(p => p.puntuacion?.[0]?.puntos === 0).length

        // Racha actual (desde el último pronóstico)
        let racha = 0
        for (const p of historial) {
            const pts = p.puntuacion?.[0]?.puntos || 0
            if (pts > 0) racha++
            else break
        }

        // Stats por liga
        const ligaStats: Record<string, { puntos: number; count: number }> = {}
        conPuntos.forEach(p => {
            const liga = p.partido?.liga || 'Otra'
            if (!ligaStats[liga]) ligaStats[liga] = { puntos: 0, count: 0 }
            ligaStats[liga].puntos += p.puntuacion?.[0]?.puntos || 0
            ligaStats[liga].count++
        })

        return {
            total: conPuntos.length,
            totalPuntos,
            promedio: conPuntos.length > 0 ? (totalPuntos / conPuntos.length).toFixed(1) : '0',
            exactos,
            ganadorDif,
            soloGanador,
            fallos,
            porcentajeExactos: conPuntos.length > 0 ? ((exactos / conPuntos.length) * 100).toFixed(0) : '0',
            porcentajeAciertos: conPuntos.length > 0 ? (((exactos + ganadorDif + soloGanador) / conPuntos.length) * 100).toFixed(0) : '0',
            racha,
            ligaStats
        }
    }, [historial])

    // Ligas disponibles
    const ligas = useMemo(() => {
        const set = new Set(historial.map(p => p.partido?.liga).filter(Boolean))
        return ['Todas', ...Array.from(set)]
    }, [historial])

    // Filtrar por liga
    const historialFiltrado = useMemo(() => {
        if (filtroLiga === 'Todas') return historial
        return historial.filter(p => p.partido?.liga === filtroLiga)
    }, [historial, filtroLiga])

    const getPuntosColor = (puntos: number) => {
        if (puntos === 8) return 'text-[#10b981]'
        if (puntos === 5) return 'text-[#3b82f6]'
        if (puntos === 3) return 'text-[#6366f1]'
        return 'text-[var(--text-muted)]'
    }

    const getPuntosBadge = (puntos: number) => {
        if (puntos === 8) return { text: 'EXACTO', color: 'bg-[#10b981]' }
        if (puntos === 5) return { text: 'GANADOR+DIF', color: 'bg-[#3b82f6]' }
        if (puntos === 3) return { text: 'GANADOR', color: 'bg-[#6366f1]' }
        return { text: 'FALLADO', color: 'bg-[#ef4444]' }
    }

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                <div className="px-6 py-8">
                    <div className="max-w-4xl mx-auto text-center md:text-left">
                        <h1 className="text-3xl font-black mb-2">📜 Mi Historial</h1>
                        <p className="text-[var(--text-muted)] text-sm">
                            Repasá tus aciertos y errores en el PRODE.
                        </p>
                    </div>
                </div>

                {/* Stats Summary */}
                {stats && (
                    <div className="px-6 mb-8">
                        <div className="max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 rounded-3xl border border-[#10b981]/30 p-6"
                            >
                                {/* Stats principales */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-[#10b981]">{stats.totalPuntos}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Puntos Total</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black">{stats.total}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Pronósticos</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-[#ffd700]">{stats.porcentajeExactos}%</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Exactos</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-[#3b82f6]">{stats.porcentajeAciertos}%</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Aciertos</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-black text-[#ff6b6b]">{stats.racha}🔥</div>
                                        <div className="text-[10px] text-[var(--text-muted)] uppercase">Racha</div>
                                    </div>
                                </div>

                                {/* Breakdown por tipo */}
                                <div className="flex flex-wrap gap-2 justify-center mb-4">
                                    <span className="text-xs bg-[#10b981]/20 text-[#10b981] px-3 py-1 rounded-full font-bold">
                                        {stats.exactos} exactos
                                    </span>
                                    <span className="text-xs bg-[#3b82f6]/20 text-[#3b82f6] px-3 py-1 rounded-full font-bold">
                                        {stats.ganadorDif} ganador+dif
                                    </span>
                                    <span className="text-xs bg-[#6366f1]/20 text-[#6366f1] px-3 py-1 rounded-full font-bold">
                                        {stats.soloGanador} solo ganador
                                    </span>
                                    <span className="text-xs bg-[#ef4444]/20 text-[#ef4444] px-3 py-1 rounded-full font-bold">
                                        {stats.fallos} fallados
                                    </span>
                                </div>

                                {/* Stats por liga */}
                                {Object.keys(stats.ligaStats).length > 1 && (
                                    <div className="pt-4 border-t border-[#10b981]/20">
                                        <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 text-center">Por Liga</h4>
                                        <div className="flex flex-wrap gap-4 justify-center">
                                            {Object.entries(stats.ligaStats).map(([liga, data]) => (
                                                <div key={liga} className="bg-[var(--card-bg)] px-4 py-2 rounded-xl text-center">
                                                    <div className="text-xs font-bold truncate max-w-[100px]">{liga}</div>
                                                    <div className="text-lg font-black text-[#10b981]">{data.puntos}</div>
                                                    <div className="text-[9px] text-[var(--text-muted)]">{data.count} partidos</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Filtro por liga */}
                {ligas.length > 2 && (
                    <div className="px-6 mb-6">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {ligas.map(liga => (
                                    <button
                                        key={liga}
                                        onClick={() => setFiltroLiga(liga)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all
                                            ${filtroLiga === liga
                                                ? 'bg-[#ff6b6b] text-white'
                                                : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)]'
                                            }`}
                                    >
                                        {liga}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-6">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {loading ? (
                            <div className="text-center py-12 opacity-50">
                                <span className="animate-spin inline-block text-2xl">⚽</span>
                                <p className="mt-2 text-xs uppercase tracking-widest">Cargando tus prodes...</p>
                            </div>
                        ) : historialFiltrado.length === 0 ? (
                            <div className="bg-[var(--card-bg)] rounded-3xl p-12 text-center border border-[var(--card-border)] border-dashed">
                                <span className="text-5xl mb-4 block opacity-30">📭</span>
                                <h3 className="text-lg font-bold">No hay historial todavía</h3>
                                <p className="text-sm text-[var(--text-muted)] mt-2">
                                    Tus pronósticos aparecerán acá una vez que los partidos finalicen.
                                </p>
                            </div>
                        ) : (
                            historialFiltrado.map((p, index) => {
                                const puntos = p.puntuacion?.[0]?.puntos || 0
                                const badge = getPuntosBadge(puntos)

                                return (
                                    <motion.div
                                        key={p.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden hover:border-[var(--text-muted)]/30 transition-all"
                                    >
                                        <div className="px-4 py-2 bg-[var(--background)]/50 text-[10px] font-bold text-[var(--text-muted)] flex justify-between items-center">
                                            <span>{p.partido?.liga}</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`${badge.color} text-white px-2 py-0.5 rounded text-[9px]`}>
                                                    {badge.text}
                                                </span>
                                                <span>{new Date(p.partido?.fecha_inicio).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="truncate">{p.partido?.equipo_local}</span>
                                                    <span className="font-bold">{p.partido?.goles_local}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="truncate">{p.partido?.equipo_visitante}</span>
                                                    <span className="font-bold">{p.partido?.goles_visitante}</span>
                                                </div>
                                                <div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">Resultado Final</div>
                                            </div>

                                            <div className="bg-[var(--background)] rounded-xl p-3 border border-[var(--card-border)]">
                                                <div className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-2 text-center">Mi Prode</div>
                                                <div className="flex items-center justify-center gap-3">
                                                    <span className="text-lg font-black">{p.goles_local_pronostico}</span>
                                                    <span className="opacity-20">-</span>
                                                    <span className="text-lg font-black">{p.goles_visitante_pronostico}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center justify-center">
                                                <div className={`text-4xl font-black ${getPuntosColor(puntos)}`}>
                                                    +{puntos}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">puntos</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}

