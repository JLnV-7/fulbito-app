'use client'

import { motion } from 'framer-motion'
import type { UserStats } from '@/types'

interface Props {
    stats: UserStats
    prodeStats: any
}

export function UserStatsCard({ stats, prodeStats }: Props) {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--card-bg)] rounded-3xl shadow-xl border border-[var(--card-border)] p-6 mb-6"
        >
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">📊 Estadísticas</h3>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                    <div className="text-3xl font-black text-[#ff6b6b]">{stats.total_votos}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Votos</div>
                </div>
                <div className="text-center p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                    <div className="text-3xl font-black text-[#ff6b6b]">{stats.partidos_vistos}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Partidos</div>
                </div>
                <div className="text-center p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                    <div className="text-3xl font-black text-[#ff6b6b]">{stats.promedio_general.toFixed(1)}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Promedio</div>
                </div>
            </div>

            {prodeStats && (
                <div className="pt-4 border-t border-[var(--card-border)]">
                    <h4 className="text-xs font-bold text-[#10b981] uppercase tracking-wider mb-3">🎯 Prode</h4>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="text-center">
                            <div className="text-2xl font-black text-[#10b981]">{prodeStats.puntos_totales || 0}</div>
                            <div className="text-[9px] text-[var(--text-muted)]">Puntos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-[var(--foreground)]">{prodeStats.partidos_jugados || 0}</div>
                            <div className="text-[9px] text-[var(--text-muted)]">Jugados</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-[#ffd700]">{prodeStats.aciertos_exactos || 0}</div>
                            <div className="text-[9px] text-[var(--text-muted)]">Exactos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-[#3b82f6]">{prodeStats.aciertos_ganador || 0}</div>
                            <div className="text-[9px] text-[var(--text-muted)]">Ganador</div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
