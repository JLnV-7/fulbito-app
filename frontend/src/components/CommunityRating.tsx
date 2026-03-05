// src/components/CommunityRating.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CommunityRatingProps {
    partidoId: string | number
    equipoLocal: string
    equipoVisitante: string
}

export function CommunityRating({ partidoId, equipoLocal, equipoVisitante }: CommunityRatingProps) {
    const [stats, setStats] = useState({
        total_reviews: 0,
        avg_rating: 0,
        avg_arbitro: 0,
        avg_atmosfera: 0,
        avg_dt: 0,
        top_estrella: '',
        top_villano: '',
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCommunityStats = async () => {
            try {
                const { data } = await supabase
                    .from('match_logs')
                    .select('rating_partido, rating_arbitro, rating_atmosfera, rating_dt, jugador_estrella, jugador_villano')
                    .eq('partido_id', String(partidoId))
                    .eq('is_private', false)

                if (data && data.length > 0) {
                    const total = data.length
                    const avgRating = data.reduce((acc, l) => acc + l.rating_partido, 0) / total
                    const avgArbitro = data.filter(l => l.rating_arbitro).reduce((acc, l) => acc + (l.rating_arbitro || 0), 0) / (data.filter(l => l.rating_arbitro).length || 1)
                    const avgAtmosfera = data.filter(l => l.rating_atmosfera).reduce((acc, l) => acc + (l.rating_atmosfera || 0), 0) / (data.filter(l => l.rating_atmosfera).length || 1)
                    const avgDt = data.filter(l => l.rating_dt).reduce((acc, l) => acc + (l.rating_dt || 0), 0) / (data.filter(l => l.rating_dt).length || 1)

                    // Count most mentioned estrella/villano
                    const estrellaCount: Record<string, number> = {}
                    const villanoCount: Record<string, number> = {}
                    data.forEach(l => {
                        if (l.jugador_estrella) estrellaCount[l.jugador_estrella] = (estrellaCount[l.jugador_estrella] || 0) + 1
                        if (l.jugador_villano) villanoCount[l.jugador_villano] = (villanoCount[l.jugador_villano] || 0) + 1
                    })

                    const topEstrella = Object.entries(estrellaCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''
                    const topVillano = Object.entries(villanoCount).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

                    setStats({
                        total_reviews: total,
                        avg_rating: avgRating,
                        avg_arbitro: avgArbitro,
                        avg_atmosfera: avgAtmosfera,
                        avg_dt: avgDt,
                        top_estrella: topEstrella,
                        top_villano: topVillano,
                    })
                }
            } catch {
                console.log('Community stats no disponibles')
            } finally {
                setLoading(false)
            }
        }

        fetchCommunityStats()
    }, [partidoId])

    if (loading || stats.total_reviews === 0) return null

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-[#6366f1]" />
                <h3 className="text-sm font-bold">Rating de la comunidad</h3>
                <span className="text-[10px] text-[var(--text-muted)]">{stats.total_reviews} reseñas</span>
            </div>

            {/* Main community rating */}
            <div className="flex items-center gap-3 mb-3">
                <div className="text-3xl font-black text-[#f59e0b]">{stats.avg_rating.toFixed(1)}</div>
                <div className="flex-1">
                    <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <Star
                                key={star}
                                size={14}
                                fill={star <= Math.round(stats.avg_rating) ? '#f59e0b' : 'none'}
                                stroke={star <= Math.round(stats.avg_rating) ? '#f59e0b' : 'var(--text-muted)'}
                            />
                        ))}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                        Basado en {stats.total_reviews} opiniones
                    </div>
                </div>
            </div>

            {/* Sub-ratings */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {stats.avg_arbitro > 0 && (
                    <div className="text-center p-2 rounded-lg bg-[var(--background)]">
                        <div className="text-xs font-bold">{stats.avg_arbitro.toFixed(1)}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">🟨 Árbitro</div>
                    </div>
                )}
                {stats.avg_atmosfera > 0 && (
                    <div className="text-center p-2 rounded-lg bg-[var(--background)]">
                        <div className="text-xs font-bold">{stats.avg_atmosfera.toFixed(1)}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">🏟️ Atmósfera</div>
                    </div>
                )}
                {stats.avg_dt > 0 && (
                    <div className="text-center p-2 rounded-lg bg-[var(--background)]">
                        <div className="text-xs font-bold">{stats.avg_dt.toFixed(1)}</div>
                        <div className="text-[9px] text-[var(--text-muted)]">🧥 DT</div>
                    </div>
                )}
            </div>

            {/* Top estrella/villano */}
            {(stats.top_estrella || stats.top_villano) && (
                <div className="flex gap-2">
                    {stats.top_estrella && (
                        <span className="flex-1 text-center text-[10px] px-2 py-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] font-medium">
                            ⭐ {stats.top_estrella}
                        </span>
                    )}
                    {stats.top_villano && (
                        <span className="flex-1 text-center text-[10px] px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 font-medium">
                            😈 {stats.top_villano}
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
