'use client'

import { motion } from 'framer-motion'
import type { UserStats } from '@/types'

interface Props {
    stats: UserStats
    prodeStats: any
}

export function UserStatsCard({ stats, prodeStats }: Props) {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 mb-4" style={{ borderRadius: 'var(--radius)' }}>
            <h3 className="text-[10px] font-black text-[var(--foreground)] capitalize tracking-widest mb-4 border-b border-[var(--card-border)] pb-2 border-dashed">
                📊 Estadísticas Generales
            </h3>

            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-3 bg-[var(--background)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="text-2xl font-black">{stats.total_votos}</div>
                    <div className="text-[9px] text-[var(--text-muted)] capitalize font-bold">Votos</div>
                </div>
                <div className="text-center p-3 bg-[var(--background)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="text-2xl font-black">{stats.partidos_vistos}</div>
                    <div className="text-[9px] text-[var(--text-muted)] capitalize font-bold">Partidos</div>
                </div>
                <div className="text-center p-3 bg-[var(--background)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                    <div className="text-2xl font-black">{stats.promedio_general.toFixed(1)}</div>
                    <div className="text-[9px] text-[var(--text-muted)] capitalize font-bold">Promedio</div>
                </div>
            </div>

            {prodeStats && (
                <div className="pt-4 border-t border-[var(--card-border)]">
                    <h4 className="text-[10px] font-black text-[#16a34a] capitalize tracking-widest mb-3 italic">🎯 Prode</h4>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="text-center border border-[var(--card-border)] bg-[var(--background)] p-2" style={{ borderRadius: 'var(--radius)' }}>
                            <div className="text-lg font-black text-[#16a34a]">{prodeStats.puntos_totales || 0}</div>
                            <div className="text-[8px] text-[var(--text-muted)] font-black capitalize">Pts</div>
                        </div>
                        <div className="text-center border border-[var(--card-border)] bg-[var(--background)] p-2" style={{ borderRadius: 'var(--radius)' }}>
                            <div className="text-lg font-black">{prodeStats.partidos_jugados || 0}</div>
                            <div className="text-[8px] text-[var(--text-muted)] font-black capitalize">Jug</div>
                        </div>
                        <div className="text-center border border-[var(--card-border)] bg-[var(--background)] p-2" style={{ borderRadius: 'var(--radius)' }}>
                            <div className="text-lg font-black text-[#d97706]">{prodeStats.aciertos_exactos || 0}</div>
                            <div className="text-[8px] text-[var(--text-muted)] font-black capitalize">Exa</div>
                        </div>
                        <div className="text-center border border-[var(--card-border)] bg-[var(--background)] p-2" style={{ borderRadius: 'var(--radius)' }}>
                            <div className="text-lg font-black text-[#3b82f6]">{prodeStats.aciertos_ganador || 0}</div>
                            <div className="text-[8px] text-[var(--text-muted)] font-black capitalize">Gan</div>
                        </div>
                    </div>
                </div>
            )}

            {(stats.friend_matches_votes !== undefined || stats.friend_matches_average !== undefined) && (
                <div className="pt-4 border-t border-[var(--card-border)] mt-4">
                    <h4 className="text-[10px] font-black text-[#2563eb] capitalize tracking-widest mb-3 italic">🤝 Amistosos</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-center border border-[var(--card-border)] bg-[var(--background)] p-2" style={{ borderRadius: 'var(--radius)' }}>
                            <div className="text-xl font-black text-[#2563eb]">{stats.friend_matches_votes || 0}</div>
                            <div className="text-[8px] text-[var(--text-muted)] font-black capitalize">Votos</div>
                        </div>
                        <div className="text-center border border-[var(--card-border)] bg-[var(--background)] p-2" style={{ borderRadius: 'var(--radius)' }}>
                            <div className="text-xl font-black text-[#fbbf24]">{
                                stats.friend_matches_average ? stats.friend_matches_average.toFixed(1) : '-'
                            }</div>
                            <div className="text-[8px] text-[var(--text-muted)] font-black capitalize">Promedio</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
