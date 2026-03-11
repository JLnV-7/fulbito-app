// src/components/FixtureTable.tsx
// Promiedos-style: score centered between team names in single row
import React from 'react'
import Link from 'next/link'
import type { Partido } from '@/types'

interface FixtureTableProps {
    partidos: Partido[]
    isLoading?: boolean
}

export const FixtureTable: React.FC<FixtureTableProps> = ({ partidos, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-1">
                {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-12 bg-[var(--card-bg)] border border-[var(--card-border)] animate-shimmer" />
                ))}
            </div>
        )
    }

    if (partidos.length === 0) {
        return (
            <div className="p-8 text-center bg-[var(--card-bg)] border border-[var(--card-border)]">
                <p className="text-[var(--text-muted)] text-sm italic">No hay partidos programados</p>
            </div>
        )
    }

    return (
        <div className="divide-y divide-[var(--card-border)]">
            {partidos.map((p) => {
                const hora = p.fecha_inicio
                    ? new Date(p.fecha_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'

                const isLive = p.estado === 'EN_JUEGO'
                const isFinished = p.estado === 'FINALIZADO'
                const hasScore = p.goles_local != null && p.goles_visitante != null
                const linkId = p.id || p.fixture_id

                return (
                    <Link
                        key={p.id}
                        href={`/partido/${linkId}`}
                        className="flex items-center gap-2 px-3 py-2.5 hover:bg-[var(--hover-bg)] transition-colors group"
                    >
                        {/* Hora */}
                        <div className="w-12 shrink-0 text-center">
                            {isLive ? (
                                <span className="text-[10px] font-black text-[var(--accent-red)] animate-pulse capitalize">EN VIVO</span>
                            ) : (
                                <span className="text-[11px] font-bold text-[var(--text-muted)]">{hora}</span>
                            )}
                        </div>

                        {/* Match row: Local [score] Visitante */}
                        <div className="flex-1 flex items-center min-w-0">
                            {/* Local */}
                            <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                                <span className="text-xs font-bold truncate text-right">{p.equipo_local}</span>
                                <img
                                    src={p.logo_local}
                                    alt=""
                                    className="w-5 h-5 object-contain shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                            </div>

                            {/* Score centered */}
                            <div className="w-14 shrink-0 text-center mx-1">
                                {hasScore && (isFinished || isLive) ? (
                                    <span className={`text-sm font-black ${isLive ? 'text-[var(--accent-red)]' : ''}`}>
                                        {p.goles_local} - {p.goles_visitante}
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-[var(--text-muted)]">vs</span>
                                )}
                            </div>

                            {/* Visitante */}
                            <div className="flex-1 flex items-center justify-start gap-1.5 min-w-0">
                                <img
                                    src={p.logo_visitante}
                                    alt=""
                                    className="w-5 h-5 object-contain shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <span className="text-xs font-bold truncate">{p.equipo_visitante}</span>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    )
}
