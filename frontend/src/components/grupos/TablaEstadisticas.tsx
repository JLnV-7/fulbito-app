'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface TablaEstadisticasProps {
    grupoId: string
    miembros: any[]
}

interface EstadisticaJugador {
    userId: string
    nombre: string
    foto?: string
    pj: number
    goles: number
    asistencias: number
    promedio: number
    mvps: number // Opcional, por ahora 0
}

export function TablaEstadisticas({ grupoId, miembros }: TablaEstadisticasProps) {
    const [stats, setStats] = useState<EstadisticaJugador[]>([])
    const [loading, setLoading] = useState(true)
    const [orden, setOrden] = useState<'goles' | 'asistencias' | 'promedio' | 'pj'>('goles')

    useEffect(() => {
        fetchStats()
    }, [grupoId])

    const fetchStats = async () => {
        setLoading(true)
        try {
            // ... (ommited fetch logic for brevity)
            // 1. Obtener todos los partidos del grupo
            const { data: partidos } = await supabase
                .from('partidos_amigos')
                .select('id')
                .eq('grupo_id', grupoId)
                .eq('estado', 'finalizado')

            if (!partidos || partidos.length === 0) {
                setStats([])
                setLoading(false)
                return
            }

            const partidoIds = partidos.map(p => p.id)

            // 2. Obtener todos los jugadores de esos partidos (que tengan usuario real)
            const { data: jugadoresHistorial } = await supabase
                .from('jugadores_partido_amigo')
                .select('user_id, goles, asistencias, nombre')
                .in('partido_amigo_id', partidoIds)
                .not('user_id', 'is', null)

            // 3. Obtener votos
            const { data: votos } = await supabase
                .from('votos_partido_amigo')
                .select('jugador_id, nota, jugadores_partido_amigo!inner(user_id)')
                .in('partido_amigo_id', partidoIds)

            // 4. Agregar datos
            const statsMap: Record<string, EstadisticaJugador> = {}

            // Inicializar con miembros
            miembros.forEach(m => {
                if (m.user_id) {
                    statsMap[m.user_id] = {
                        userId: m.user_id,
                        nombre: m.profile?.username || 'Usuario',
                        foto: m.profile?.avatar_url,
                        pj: 0,
                        goles: 0,
                        asistencias: 0,
                        promedio: 0,
                        mvps: 0
                    }
                }
            })

            // Procesar historial
            jugadoresHistorial?.forEach((j: any) => {
                const uid = j.user_id
                if (!statsMap[uid]) return

                statsMap[uid].pj += 1
                statsMap[uid].goles += (j.goles || 0)
                statsMap[uid].asistencias += (j.asistencias || 0)
            })

            // Procesar votos
            const notasSum: Record<string, number> = {}
            const notasCount: Record<string, number> = {}

            votos?.forEach((v: any) => {
                const uid = v.jugadores_partido_amigo?.user_id
                if (!uid || !statsMap[uid]) return

                notasSum[uid] = (notasSum[uid] || 0) + v.nota
                notasCount[uid] = (notasCount[uid] || 0) + 1
            })

            Object.values(statsMap).forEach(s => {
                if (notasCount[s.userId]) {
                    s.promedio = Number((notasSum[s.userId] / notasCount[s.userId]).toFixed(1))
                }
            })

            setStats(Object.values(statsMap))

        } catch (error) {
            console.error('Error stats', error)
        } finally {
            setLoading(false)
        }
    }

    const sortedStats = [...stats].sort((a, b) => b[orden] - a[orden])

    if (loading) return <div className="text-center py-10">⏳ Calculando estadísticas...</div>

    if (stats.length === 0) return (
        <div className="text-center py-10 text-[var(--text-muted)]">
            📉 Aún no hay estadísticas. ¡Jueguen partidos para generar datos!
        </div>
    )

    return (
        <div className="space-y-4">
            {/* Filtros Orden */}
            <div className="flex gap-2 justify-center pb-4">
                <FilterButton active={orden === 'goles'} onClick={() => setOrden('goles')} label="⚽ Goles" />
                <FilterButton active={orden === 'asistencias'} onClick={() => setOrden('asistencias')} label="👟 Asistencias" />
                <FilterButton active={orden === 'promedio'} onClick={() => setOrden('promedio')} label="⭐ Promedio" />
                <FilterButton active={orden === 'pj'} onClick={() => setOrden('pj')} label="📅 PJ" />
            </div>

            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-[#10b981]/10 text-[#10b981]">
                        <tr>
                            <th className="p-3 text-left">Jugador</th>
                            <th className="p-3 text-center">PJ</th>
                            <th className="p-3 text-center">⚽</th>
                            <th className="p-3 text-center">👟</th>
                            <th className="p-3 text-center">⭐</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedStats.map((s, i) => (
                            <tr key={s.userId} className="border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--hover-bg)]">
                                <td className="p-3 flex items-center gap-2 font-bold">
                                    <span className={`text-xs w-5 text-[var(--text-muted)]`}>#{i + 1}</span>
                                    <div className="w-8 h-8 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--card-border)] flex items-center justify-center">
                                        {s.foto || '👤'}
                                    </div>
                                    <span className="truncate max-w-[100px]">{s.nombre}</span>
                                </td>
                                <td className={`p-3 text-center ${orden === 'pj' ? 'font-black text-white' : ''}`}>{s.pj}</td>
                                <td className={`p-3 text-center ${orden === 'goles' ? 'font-black text-[#10b981]' : ''}`}>{s.goles}</td>
                                <td className={`p-3 text-center ${orden === 'asistencias' ? 'font-black text-blue-400' : ''}`}>{s.asistencias}</td>
                                <td className={`p-3 text-center ${orden === 'promedio' ? 'font-black text-yellow-400' : ''}`}>{s.promedio || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function FilterButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${active ? 'bg-[#10b981] text-white shadow-lg' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)]'
                }`}
        >
            {label}
        </button>
    )
}
