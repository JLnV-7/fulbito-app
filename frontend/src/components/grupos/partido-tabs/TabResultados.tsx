// src/components/grupos/partido-tabs/TabResultados.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { PartidoAmigo, JugadorPartidoAmigo, FacetVote } from '@/types'
import { DetalleJugadorAmigo } from '../DetalleJugadorAmigo'

interface Props {
    partido: PartidoAmigo
    jugadores: JugadorPartidoAmigo[]
    facetVotes: FacetVote[]
    onVerDetalle: (jugadorId: string) => Promise<any>
    onRefresh: () => Promise<void>
}

export function TabResultados({ partido, jugadores, facetVotes, onVerDetalle, onRefresh }: Props) {
    const [jugadorDetalle, setJugadorDetalle] = useState<JugadorPartidoAmigo | null>(null)

    const sorted = [...jugadores].sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
    const mvp = sorted.find(j => (j.promedio || 0) > 0)
    const hayVotos = jugadores.some(j => (j.total_votos || 0) > 0)

    const azules = jugadores.filter(j => j.equipo === 'azul').sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
    const rojos  = jugadores.filter(j => j.equipo === 'rojo').sort((a, b) => (b.promedio || 0) - (a.promedio || 0))

    const promEquipo = (lista: JugadorPartidoAmigo[]) => {
        const con = lista.filter(j => (j.promedio || 0) > 0)
        if (!con.length) return null
        return Math.round(con.reduce((s, j) => s + (j.promedio || 0), 0) / con.length * 10) / 10
    }

    const marcadorAzul = partido.resultado_azul ?? jugadores.filter(j => j.equipo === 'azul').reduce((a, j) => a + Number(j.goles || 0), 0)
    const marcadorRojo = partido.resultado_rojo ?? jugadores.filter(j => j.equipo === 'rojo').reduce((a, j) => a + Number(j.goles || 0), 0)

    return (
        <div className="space-y-6 pb-8">
            {/* Marcador */}
            <div className="bg-gradient-to-br from-[#16a34a] to-emerald-600 p-8 rounded-3xl text-white text-center shadow-xl">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Marcador</p>
                    <button onClick={onRefresh} className="text-[9px] font-black opacity-60 hover:opacity-100">🔄</button>
                </div>
                <div className="flex items-center justify-center gap-10 mt-2">
                    <div className="text-center">
                        <p className="text-5xl font-black tabular-nums">{marcadorAzul}</p>
                        <p className="text-[9px] font-bold uppercase opacity-70 mt-1">🔵 AZUL</p>
                    </div>
                    <p className="text-3xl font-light opacity-40">—</p>
                    <div className="text-center">
                        <p className="text-5xl font-black tabular-nums">{marcadorRojo}</p>
                        <p className="text-[9px] font-bold uppercase opacity-70 mt-1">🔴 ROJO</p>
                    </div>
                </div>
                {partido.estado !== 'finalizado' && (
                    <p className="text-[9px] opacity-40 mt-4 uppercase tracking-widest">Partido en curso</p>
                )}
            </div>

            {/* Sin votos */}
            {!hayVotos && (
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 text-center">
                    <p className="text-3xl mb-2">🗳️</p>
                    <p className="font-black text-sm">Todavía no hay votos</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Andá al tab Votos para puntuar</p>
                </div>
            )}

            {/* MVP */}
            {mvp && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl p-8 text-center shadow-xl cursor-pointer"
                    onClick={() => setJugadorDetalle(mvp)}
                >
                    <p className="text-[10px] text-white/80 font-black tracking-[0.4em] mb-3">MEMBER OF THE MATCH</p>
                    <p className="text-5xl mb-3">👑</p>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">{mvp.nombre}</h2>
                    <p className="text-4xl font-black text-white mt-2">⭐ {mvp.promedio}</p>
                    <p className="text-[10px] text-white/70 font-bold mt-3">{mvp.total_votos} VOTOS · Tocá para ver detalle</p>
                </motion.div>
            )}

            {/* Ranking por equipo */}
            {[
                { lista: azules, color: '#3b82f6', emoji: '🔵', nombre: 'Azul' },
                { lista: rojos,  color: '#ef4444', emoji: '🔴', nombre: 'Rojo' }
            ].map(team => (
                <div key={team.nombre} className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] overflow-hidden">
                    <div className="p-5 border-b border-[var(--card-border)] flex justify-between items-center" style={{ borderLeftColor: team.color, borderLeftWidth: 4 }}>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: team.color }}>{team.emoji} Equipo {team.nombre}</p>
                            <p className="text-xl font-black italic tracking-tighter">Ranking</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-widest">Prom. equipo</p>
                            <p className="text-xl font-black" style={{ color: team.color }}>{promEquipo(team.lista) ?? '–'}</p>
                        </div>
                    </div>
                    {team.lista.map((j, i) => (
                        <button
                            key={j.id}
                            onClick={() => setJugadorDetalle(j)}
                            className={`w-full flex items-center gap-4 px-5 py-4 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--hover-bg)] transition-all text-left ${i === 0 && (j.promedio || 0) > 0 ? 'bg-amber-400/5' : ''}`}
                        >
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 && (j.promedio || 0) > 0 ? 'bg-amber-400 text-amber-900' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}>
                                {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                                <span className="font-bold text-sm block truncate">{j.nombre}</span>
                                <div className="h-1.5 bg-[var(--background)] rounded-full mt-1.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${((j.promedio || 0) / 10) * 100}%` }}
                                        transition={{ duration: 0.7 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: team.color }}
                                    />
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-sm font-black" style={{ color: team.color }}>
                                    {(j.promedio || 0) > 0 ? j.promedio : '–'}
                                </span>
                                <p className="text-[8px] text-[var(--text-muted)] font-bold">{j.total_votos || 0} V</p>
                            </div>
                        </button>
                    ))}
                </div>
            ))}

            {/* Goleador / Asistidor */}
            {jugadores.some(j => j.goles || j.asistencias) && (
                <>
                    <h3 className="font-black italic uppercase tracking-tighter text-sm">📈 Estadísticas</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Goleador', emoji: '⚽', lista: jugadores.filter(j => (j.goles || 0) > 0).sort((a, b) => (b.goles||0)-(a.goles||0)), stat: 'goles' as const },
                            { label: 'Asistidor', emoji: '🎯', lista: jugadores.filter(j => (j.asistencias || 0) > 0).sort((a, b) => (b.asistencias||0)-(a.asistencias||0)), stat: 'asistencias' as const }
                        ].map(s => s.lista.length > 0 ? (
                            <div key={s.label} className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--card-border)] flex items-center gap-3">
                                <span className="text-2xl">{s.emoji}</span>
                                <div>
                                    <p className="text-[9px] font-black text-[#16a34a] uppercase tracking-widest">{s.label}</p>
                                    <p className="font-bold text-sm">{s.lista[0].nombre}</p>
                                    <p className="text-[10px] text-[var(--text-muted)] font-black">{s.lista[0][s.stat]} {s.emoji}</p>
                                </div>
                            </div>
                        ) : null)}
                    </div>
                </>
            )}

            {/* Premios facet */}
            {facetVotes.length > 0 && (
                <>
                    <h3 className="font-black italic uppercase tracking-tighter text-sm">🏅 Premios</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {([
                            { id: 'goleador', label: 'El Goleador', emoji: '⚽' },
                            { id: 'comilon',  label: 'El Comilón',  emoji: '🍔' },
                            { id: 'patadas',  label: 'Pegapatadas', emoji: '🦵' },
                            { id: 'arquero',  label: 'Buen Arquero', emoji: '🧤' },
                        ] as const).map(facet => {
                            const counts = facetVotes
                                .filter(v => v.facet === facet.id)
                                .reduce((acc, v) => { acc[v.player_id] = (acc[v.player_id] || 0) + 1; return acc }, {} as Record<string, number>)
                            const entries = Object.entries(counts)
                            if (!entries.length) return null
                            const [winnerId, votes] = entries.sort((a, b) => b[1] - a[1])[0]
                            const winner = jugadores.find(j => j.id === winnerId)
                            const totalVotes = facetVotes.filter(v => v.facet === facet.id).length
                            return (
                                <div key={facet.id} className="bg-[var(--card-bg)] p-4 rounded-2xl border border-[var(--card-border)] flex items-center gap-3">
                                    <span className="text-2xl">{facet.emoji}</span>
                                    <div>
                                        <p className="text-[9px] font-black text-[#16a34a] uppercase tracking-widest">{facet.label}</p>
                                        <p className="font-bold text-sm">{winner?.nombre ?? '?'}</p>
                                        <p className="text-[10px] text-[var(--text-muted)]">{votes} votos ({Math.round((votes/totalVotes)*100)}%)</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {jugadorDetalle && (
                <DetalleJugadorAmigo
                    jugador={jugadorDetalle}
                    grupoId=""
                    onClose={() => setJugadorDetalle(null)}
                />
            )}
        </div>
    )
}
