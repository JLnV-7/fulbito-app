// src/components/HeadToHead.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

interface H2HMatch {
    id: string
    fecha: string
    golesLocal: number
    golesVisitante: number
    competicion: string
}

interface HeadToHeadProps {
    equipoLocal: string
    equipoVisitante: string
    logoLocal?: string
    logoVisitante?: string
}

interface H2HStats {
    victorias1: number
    empates: number
    victorias2: number
    goles1: number
    goles2: number
    partidos: H2HMatch[]
}

export function HeadToHead({ equipoLocal, equipoVisitante, logoLocal, logoVisitante }: HeadToHeadProps) {
    const [stats, setStats] = useState<H2HStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(false)

    useEffect(() => {
        fetchH2H()
    }, [equipoLocal, equipoVisitante])

    const fetchH2H = async () => {
        setLoading(true)
        try {
            // Buscar partidos entre estos dos equipos
            const { data, error } = await supabase
                .from('partidos')
                .select('*')
                .or(`and(equipo_local.eq.${equipoLocal},equipo_visitante.eq.${equipoVisitante}),and(equipo_local.eq.${equipoVisitante},equipo_visitante.eq.${equipoLocal})`)
                .eq('estado', 'FINALIZADO')
                .order('fecha_inicio', { ascending: false })
                .limit(10)

            if (error) throw error

            if (data && data.length > 0) {
                let v1 = 0, v2 = 0, e = 0, g1 = 0, g2 = 0

                const partidos: H2HMatch[] = data.map(p => {
                    const esLocal1 = p.equipo_local === equipoLocal
                    const golesEquipo1 = esLocal1 ? p.goles_local : p.goles_visitante
                    const golesEquipo2 = esLocal1 ? p.goles_visitante : p.goles_local

                    g1 += golesEquipo1
                    g2 += golesEquipo2

                    if (golesEquipo1 > golesEquipo2) v1++
                    else if (golesEquipo2 > golesEquipo1) v2++
                    else e++

                    return {
                        id: p.id,
                        fecha: p.fecha_inicio,
                        golesLocal: p.goles_local,
                        golesVisitante: p.goles_visitante,
                        competicion: p.liga
                    }
                })

                setStats({
                    victorias1: v1,
                    empates: e,
                    victorias2: v2,
                    goles1: g1,
                    goles2: g2,
                    partidos
                })
            } else {
                // Demo data si no hay historial
                setStats({
                    victorias1: 3,
                    empates: 2,
                    victorias2: 4,
                    goles1: 12,
                    goles2: 14,
                    partidos: []
                })
            }
        } catch (err) {
            console.error('Error fetching H2H:', err)
            // Demo data
            setStats({
                victorias1: 3,
                empates: 2,
                victorias2: 4,
                goles1: 12,
                goles2: 14,
                partidos: []
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 animate-pulse">
                <div className="h-4 w-32 bg-[var(--card-border)] rounded mb-4"></div>
                <div className="flex justify-between items-center">
                    <div className="w-16 h-16 bg-[var(--card-border)] rounded-full"></div>
                    <div className="flex-1 mx-4">
                        <div className="h-6 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="w-16 h-16 bg-[var(--card-border)] rounded-full"></div>
                </div>
            </div>
        )
    }

    if (!stats) return null

    const total = stats.victorias1 + stats.empates + stats.victorias2
    const pct1 = total > 0 ? (stats.victorias1 / total) * 100 : 33
    const pctE = total > 0 ? (stats.empates / total) * 100 : 34
    const pct2 = total > 0 ? (stats.victorias2 / total) * 100 : 33

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-3 bg-[var(--background)] border-b border-[var(--card-border)]">
                <h3 className="text-sm font-bold">⚔️ Historial de Enfrentamientos</h3>
            </div>

            <div className="p-5">
                {/* Escudos y stats */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    {/* Equipo 1 */}
                    <div className="flex flex-col items-center">
                        {logoLocal ? (
                            <div className="relative w-14 h-14 mb-2">
                                <Image src={logoLocal} alt={equipoLocal} fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 bg-[var(--background)] rounded-full flex items-center justify-center mb-2">
                                <span className="text-2xl">⚽</span>
                            </div>
                        )}
                        <span className="text-2xl font-black text-[#10b981]">{stats.victorias1}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Victorias</span>
                    </div>

                    {/* Empates */}
                    <div className="flex flex-col items-center">
                        <div className="w-14 h-14 bg-[var(--background)] rounded-full flex items-center justify-center mb-2">
                            <span className="text-2xl">🤝</span>
                        </div>
                        <span className="text-2xl font-black text-[#6b7280]">{stats.empates}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Empates</span>
                    </div>

                    {/* Equipo 2 */}
                    <div className="flex flex-col items-center">
                        {logoVisitante ? (
                            <div className="relative w-14 h-14 mb-2">
                                <Image src={logoVisitante} alt={equipoVisitante} fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 bg-[var(--background)] rounded-full flex items-center justify-center mb-2">
                                <span className="text-2xl">⚽</span>
                            </div>
                        )}
                        <span className="text-2xl font-black text-[#ef4444]">{stats.victorias2}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Victorias</span>
                    </div>
                </div>

                {/* Barra de victorias */}
                <div className="flex h-3 rounded-full overflow-hidden mb-4">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct1}%` }}
                        transition={{ duration: 0.5 }}
                        className="bg-[#10b981]"
                    />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pctE}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="bg-[#6b7280]"
                    />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct2}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-[#ef4444]"
                    />
                </div>

                {/* Goles totales */}
                <div className="flex justify-between text-xs text-[var(--text-muted)] border-t border-[var(--card-border)] pt-3">
                    <div>
                        <span className="font-bold text-[var(--foreground)]">{stats.goles1}</span> goles
                    </div>
                    <div>
                        <span className="font-bold">{total}</span> partidos
                    </div>
                    <div>
                        <span className="font-bold text-[var(--foreground)]">{stats.goles2}</span> goles
                    </div>
                </div>

                {/* Últimos partidos (expandible) */}
                {stats.partidos.length > 0 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-4 w-full text-center text-xs text-[#ff6b6b] font-bold"
                    >
                        {expanded ? '▲ Ocultar partidos' : '▼ Ver últimos partidos'}
                    </button>
                )}

                {expanded && stats.partidos.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-3 space-y-2"
                    >
                        {stats.partidos.slice(0, 5).map(match => (
                            <div key={match.id} className="flex justify-between items-center text-xs bg-[var(--background)] rounded-lg px-3 py-2">
                                <span className="text-[var(--text-muted)]">
                                    {new Date(match.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </span>
                                <span className="font-bold">
                                    {match.golesLocal} - {match.golesVisitante}
                                </span>
                                <span className="text-[var(--text-muted)]">{match.competicion}</span>
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
        </motion.div>
    )
}
