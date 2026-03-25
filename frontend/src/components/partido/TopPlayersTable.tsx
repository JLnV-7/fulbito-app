'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Star, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getTeamColor } from '@/lib/helpers'

interface JugadorAPI {
    id: number
    nombre: string
    numero: number
    posicion: string
}

interface EquipoLineup {
    id: number
    nombre: string
    logo: string
    titulares: JugadorAPI[]
    suplentes: JugadorAPI[]
}

interface TopPlayersTableProps {
    partidoId: number | string
    equipos: EquipoLineup[]
}

interface PlayerStats {
    id: number
    nombre: string
    equipoNombre: string
    numero: number
    posicion: string
    avgNota: number
    votosTotales: number
}

export function TopPlayersTable({ partidoId, equipos }: TopPlayersTableProps) {
    const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTopPlayers = async () => {
            if (!equipos || equipos.length === 0) return
            
            try {
                const supabase = createClient()
                // Fetch votes for this match
                const { data, error } = await supabase
                    .from('votaciones')
                    .select('jugador_id, nota')
                    .eq('partido_id', String(partidoId))
                
                if (error) throw error

                if (data && data.length > 0) {
                    const statsMap = new Map<number, { sum: number; count: number }>()
                    
                    data.forEach(voto => {
                        const current = statsMap.get(voto.jugador_id) || { sum: 0, count: 0 }
                        statsMap.set(voto.jugador_id, {
                            sum: current.sum + voto.nota,
                            count: current.count + 1
                        })
                    })

                    const allPlayers: JugadorAPI[] = []
                    const playerToTeam = new Map<number, string>()
                    
                    equipos.forEach(eq => {
                        const teamPlayers = [...eq.titulares, ...eq.suplentes]
                        allPlayers.push(...teamPlayers)
                        teamPlayers.forEach(p => playerToTeam.set(p.id, eq.nombre))
                    })

                    const calculatedStats: PlayerStats[] = []
                    
                    statsMap.forEach((stats, jId) => {
                        const player = allPlayers.find(p => p.id === jId)
                        if (player && stats.count > 0) {
                            calculatedStats.push({
                                id: player.id,
                                nombre: player.nombre,
                                equipoNombre: playerToTeam.get(player.id) || 'Desconocido',
                                numero: player.numero,
                                posicion: player.posicion,
                                avgNota: stats.sum / stats.count,
                                votosTotales: stats.count
                            })
                        }
                    })

                    // Sort by average note descending, then by votes count
                    calculatedStats.sort((a, b) => b.avgNota - a.avgNota || b.votosTotales - a.votosTotales)
                    
                    setTopPlayers(calculatedStats.slice(0, 5)) // Top 5
                }
            } catch (err) {
                console.error("Error fetching top players:", err)
            } finally {
                setLoading(false)
            }
        }
        
        fetchTopPlayers()
    }, [partidoId, equipos])

    if (loading || topPlayers.length === 0) return null

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-[#fde047]" />
                    <h3 className="font-black text-sm uppercase tracking-widest text-[var(--foreground)]">
                        Mejores Jugadores (Comunidad)
                    </h3>
                </div>
                <TrendingUp size={16} className="text-[var(--text-muted)] opacity-50" />
            </div>

            <div className="space-y-3 relative z-10">
                {topPlayers.map((player, idx) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={player.id}
                        className="flex items-center justify-between group p-2 rounded-2xl hover:bg-[var(--hover-bg)] transition-colors border border-transparent hover:border-[var(--card-border)]"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-inner
                                ${idx === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 
                                  idx === 1 ? 'bg-gray-400/20 text-gray-400 border border-gray-400/30' : 
                                  idx === 2 ? 'bg-amber-700/20 text-amber-700 border border-amber-700/30' :
                                  'bg-[var(--background)] text-[var(--text-muted)] border border-[var(--card-border)]'}
                            `}>
                                #{idx + 1}
                            </div>
                            
                            <div className="flex flex-col">
                                <span className="font-bold text-sm tracking-tight capitalize text-[var(--foreground)] flex items-center gap-2">
                                    {player.nombre}
                                    {idx === 0 && <span className="text-[8px] bg-[#fde047]/20 text-[#ca8a04] px-1.5 py-0.5 rounded-full uppercase tracking-widest border border-[#fde047]/30">MVP</span>}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] font-black uppercase text-[var(--text-muted)] border-r border-[var(--text-muted)]/30 pr-2">
                                        {player.equipoNombre}
                                    </span>
                                    <span className="text-[9px] font-bold text-[var(--text-muted)]">
                                        POS: {player.posicion}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                                <span className="font-black text-xl tabular-nums tracking-tighter" style={{ color: player.avgNota >= 8 ? '#16a34a' : player.avgNota >= 6 ? '#ca8a04' : '#var(--foreground)' }}>
                                    {player.avgNota.toFixed(1)}
                                </span>
                                <Star size={12} className={player.avgNota >= 8 ? 'fill-[#16a34a] text-[#16a34a]' : 'fill-[#ca8a04] text-[#ca8a04]'} />
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-muted)] opacity-60">
                                {player.votosTotales} votos
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
