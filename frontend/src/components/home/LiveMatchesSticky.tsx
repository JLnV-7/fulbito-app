'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TeamLogo } from '@/components/TeamLogo'
import type { Partido } from '@/types'

export function LiveMatchesSticky({ 
    liveMatches, 
    upcomingMatches 
}: { 
    liveMatches: Partido[], 
    upcomingMatches: Partido[] 
}) {
    const isLive = liveMatches.length > 0
    const displayMatches = isLive ? liveMatches : upcomingMatches.slice(0, 5)

    if (displayMatches.length === 0) return null

    return (
        <div className="sticky top-[60px] md:top-[70px] z-30 pt-4 pb-2 bg-gradient-to-b from-[var(--background)] via-[var(--background)] to-transparent -mx-4 px-4">
            <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                    {isLive ? (
                        <>
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">En vivo ahora</span>
                        </>
                    ) : (
                        <>
                            <span className="text-[12px]">🔥</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] italic">Partidos Calientes</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                {displayMatches.map((p, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={p.id}
                        className="shrink-0"
                    >
                        <Link href={`/partido/${p.id}`} className="block transition-transform active:scale-95">
                            <div className={`w-60 bg-[var(--card-bg)]/80 backdrop-blur-xl border rounded-[1.5rem] p-4 shadow-md transition-all
                                ${isLive ? 'border-red-500/30 hover:border-red-500/60' : 'border-[var(--card-border)]/50 hover:border-[var(--accent)]/50'}
                            `}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col items-center gap-1 w-[40%]">
                                        <TeamLogo src={p.logo_local || undefined} teamName={p.equipo_local} size={32} />
                                        <span className="text-[8px] font-bold text-center uppercase truncate w-full text-[var(--text-muted)]">{p.equipo_local}</span>
                                    </div>

                                    <div className="flex flex-col items-center justify-center w-[20%]">
                                        {isLive || p.estado === 'FINALIZADO' ? (
                                            <span className="text-2xl font-black tabular-nums tracking-tighter text-[var(--foreground)]">
                                                {p.goles_local ?? 0}<span className="text-[var(--text-muted)] opacity-30 mx-0.5">-</span>{p.goles_visitante ?? 0}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-black tabular-nums tracking-widest text-[var(--text-muted)]">
                                                {new Date(p.fecha_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        {isLive && <span className="text-[8px] font-black text-red-500 animate-pulse bg-red-500/10 px-1.5 rounded">LIVE</span>}
                                    </div>

                                    <div className="flex flex-col items-center gap-1 w-[40%]">
                                        <TeamLogo src={p.logo_visitante || undefined} teamName={p.equipo_visitante} size={32} />
                                        <span className="text-[8px] font-bold text-center uppercase truncate w-full text-[var(--text-muted)]">{p.equipo_visitante}</span>
                                    </div>
                                </div>
                                
                                <button className="w-full py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-full text-[9px] font-black uppercase tracking-widest text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors">
                                    Ver + Ratear
                                </button>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
