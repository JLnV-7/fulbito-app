'use client'

import { useState, useEffect } from 'react'
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
    mvps: number
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

            const { data: jugadoresHistorial } = await supabase
                .from('jugadores_partido_amigo')
                .select('id, user_id, goles, asistencias, nombre')
                .in('partido_amigo_id', partidoIds)
                .not('user_id', 'is', null)

            // Fix: dos queries separadas en vez del join embebido que fallaba con PGRST200
            const { data: votos } = await supabase
                .from('votos_partido_amigo')
                .select('jugador_id, nota, user_id')
                .in('partido_amigo_id', partidoIds)

            const statsMap: Record<string, EstadisticaJugador> = {}

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

            jugadoresHistorial?.forEach((j: any) => {
                const uid = j.user_id
                if (!statsMap[uid]) return
                statsMap[uid].pj += 1
                statsMap[uid].goles += (j.goles || 0)
                statsMap[uid].asistencias += (j.asistencias || 0)
            })

            // Mapeamos votos usando jugadores como tabla de lookup
            const jugadorToUser: Record<string, string> = {}
            jugadoresHistorial?.forEach((j: any) => {
                if (j.user_id) jugadorToUser[j.id] = j.user_id
            })

            const notasSum: Record<string, number> = {}
            const notasCount: Record<string, number> = {}

            votos?.forEach((v: any) => {
                const uid = jugadorToUser[v.jugador_id]
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

    if (loading) return <div className="text-center py-20 animate-pulse text-[var(--text-muted)] font-bold italic capitalize tracking-widest">Calculando estadísticas...</div>

    if (stats.length === 0) return (
        <div className="text-center py-20 text-[var(--text-muted)] bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
            <p className="text-4xl mb-4">📉</p>
            <p className="font-bold italic">Aún no hay estadísticas. ¡Jueguen partidos para generar datos!</p>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex gap-2 justify-center pb-2 overflow-x-auto no-scrollbar px-2">
                <FilterButton active={orden === 'goles'} onClick={() => setOrden('goles')} label="⚽ Goles" />
                <FilterButton active={orden === 'asistencias'} onClick={() => setOrden('asistencias')} label="👟 Asistencias" />
                <FilterButton active={orden === 'promedio'} onClick={() => setOrden('promedio')} label="⭐ Promedio" />
                <FilterButton active={orden === 'pj'} onClick={() => setOrden('pj')} label="📅 PJ" />
            </div>

            <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] overflow-hidden shadow-xl">
                <table className="w-full text-sm">
                    <thead className="bg-[#10b981]/10 text-[#10b981]">
                        <tr>
                            <th className="p-4 text-left font-black capitalize italic text-xs">Jugador</th>
                            <th className="p-4 text-center font-black capitalize italic text-xs">PJ</th>
                            <th className="p-4 text-center font-black capitalize italic text-xs">⚽</th>
                            <th className="p-4 text-center font-black capitalize italic text-xs">👟</th>
                            <th className="p-4 text-center font-black capitalize italic text-xs">⭐</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--card-border)]">
                        {sortedStats.map((s, i) => (
                            <tr key={s.userId} className="hover:bg-[var(--hover-bg)] transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                    <span className="text-[10px] font-black w-4 text-[var(--text-muted)]">#{i + 1}</span>
                                    <div className="w-10 h-10 rounded-full bg-[var(--background)] overflow-hidden border-2 border-[var(--card-border)] flex items-center justify-center shrink-0 shadow-sm">
                                        {s.foto ? <img src={s.foto} alt={s.nombre} className="w-full h-full object-cover" /> : '👤'}
                                    </div>
                                    <span className="font-bold truncate max-w-[120px]">{s.nombre}</span>
                                </td>
                                <td className={`p-4 text-center text-xs ${orden === 'pj' ? 'font-black text-[var(--foreground)]' : 'font-medium text-[var(--text-muted)]'}`}>{s.pj}</td>
                                <td className={`p-4 text-center text-xs ${orden === 'goles' ? 'font-black text-[#10b981]' : 'font-medium text-[var(--text-muted)]'}`}>{s.goles}</td>
                                <td className={`p-4 text-center text-xs ${orden === 'asistencias' ? 'font-black text-blue-400' : 'font-medium text-[var(--text-muted)]'}`}>{s.asistencias}</td>
                                <td className={`p-4 text-center text-xs ${orden === 'promedio' ? 'font-black text-yellow-400' : 'font-medium text-[var(--text-muted)]'}`}>{s.promedio || '-'}</td>
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
            className={`px-4 py-2 rounded-full text-xs font-black capitalize tracking-wider transition-all shadow-sm shrink-0
                ${active ? 'bg-[#10b981] text-white shadow-emerald-500/20' : 'bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'}`}
        >
            {label}
        </button>
    )
}