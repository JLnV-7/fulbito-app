'use client'

import { motion } from 'framer-motion'
import type { UserStats } from '@/types'

interface Props {
    stats: UserStats
    prodeStats: any
}

export function UserStatsCard({ stats, prodeStats }: Props) {
    return (
        <div className="space-y-4 mb-4">
            
            {/* General Stats Bento Base */}
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)]/50 rounded-[2rem] p-5 flex flex-col items-center justify-center shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#f59e0b]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="text-3xl mb-1 drop-shadow-sm">⭐</span>
                    <div className="text-3xl font-black text-[var(--foreground)] mt-1">{stats.promedio_general.toFixed(1)}</div>
                    <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-black mt-1">Rating</div>
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-3">
                    <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)]/50 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🗳️</span>
                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Votos</span>
                        </div>
                        <div className="text-2xl font-black">{stats.total_votos}</div>
                    </div>
                    <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)]/50 rounded-3xl p-4 flex flex-col justify-between shadow-sm hover:scale-[1.02] transition-all">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🏟️</span>
                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Partidos</span>
                        </div>
                        <div className="text-2xl font-black">{stats.partidos_vistos}</div>
                    </div>
                </div>
            </div>

            {/* Prode Section */}
            {prodeStats && (
                <div className="relative overflow-hidden bg-gradient-to-br from-[#16a34a]/10 to-transparent border border-[#16a34a]/30 rounded-[2rem] p-5 shadow-sm">
                    <div className="absolute top-0 right-0 -transtale-y-4 translate-x-4 opacity-5 text-8xl pointer-events-none">🎯</div>
                    <h4 className="text-[10px] font-black text-[#16a34a] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <span className="text-sm">🎯</span> Prode
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center justify-center p-3 bg-[var(--background)]/50 rounded-2xl backdrop-blur-md">
                            <div className="text-xl font-black text-[#16a34a]">{prodeStats.puntos_totales || 0}</div>
                            <div className="text-[8px] text-[#16a34a]/70 font-black uppercase tracking-widest mt-1">Pts</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-[var(--background)]/50 rounded-2xl backdrop-blur-md">
                            <div className="text-xl font-black text-[var(--foreground)]">{prodeStats.partidos_jugados || 0}</div>
                            <div className="text-[8px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">Jug</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-[var(--background)]/50 rounded-2xl backdrop-blur-md">
                            <div className="text-xl font-black text-[#d97706]">{prodeStats.aciertos_exactos || 0}</div>
                            <div className="text-[8px] text-[#d97706]/70 font-black uppercase tracking-widest mt-1">Exa</div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-3 bg-[var(--background)]/50 rounded-2xl backdrop-blur-md">
                            <div className="text-xl font-black text-[#3b82f6]">{prodeStats.aciertos_ganador || 0}</div>
                            <div className="text-[8px] text-[#3b82f6]/70 font-black uppercase tracking-widest mt-1">Gan</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Amistosos Section */}
            {(stats.friend_matches_votes !== undefined || stats.friend_matches_average !== undefined) && (
                <div className="relative overflow-hidden bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)]/50 rounded-[2rem] p-5 shadow-sm">
                    <h4 className="text-[10px] font-black text-[#2563eb] uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <span className="text-sm">🤝</span> Amistosos
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-4 bg-[var(--background)]/50 p-4 rounded-2xl backdrop-blur-md">
                            <div className="w-10 h-10 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-lg">⚽</div>
                            <div>
                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Votos dados</div>
                                <div className="text-xl font-black text-[var(--foreground)] mt-0.5">{stats.friend_matches_votes || 0}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-[var(--background)]/50 p-4 rounded-2xl backdrop-blur-md">
                            <div className="w-10 h-10 rounded-full bg-[#fbbf24]/10 text-[#fbbf24] flex items-center justify-center text-lg">📈</div>
                            <div>
                                <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Promedio global</div>
                                <div className="text-xl font-black text-[var(--foreground)] mt-0.5">{
                                    stats.friend_matches_average ? stats.friend_matches_average.toFixed(1) : '-'
                                }</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
