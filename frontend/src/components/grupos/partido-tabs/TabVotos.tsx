// src/components/grupos/partido-tabs/TabVotos.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import type { JugadorPartidoAmigo, PartidoAmigo, FacetVote, FacetType } from '@/types'
import { VotarModal } from '../VotarModal'
import { FacetVotingCards } from '../FacetVotingCards'
import { DetalleJugadorAmigo } from '../DetalleJugadorAmigo'
import { JugadorAvatar } from '../JugadorAvatar'

interface Props {
    partido: PartidoAmigo
    jugadores: JugadorPartidoAmigo[]
    facetVotes: FacetVote[]
    onVotar: (jugadorId: string, nota: number, comentario?: string) => Promise<void>
    onEliminarVoto: (jugadorId: string) => Promise<void>
    onVotarFaceta: (playerId: string, facet: FacetType) => Promise<void>
    onEliminarFaceta: (facet: FacetType) => Promise<void>
    onRefresh: () => Promise<void>
    onVerDetalle: (jugadorId: string) => Promise<any>
}

export function TabVotos({ partido, jugadores, facetVotes, onVotar, onEliminarVoto, onVotarFaceta, onEliminarFaceta, onRefresh, onVerDetalle }: Props) {
    const { user } = useAuth()
    const [votandoA, setVotandoA] = useState<JugadorPartidoAmigo | null>(null)
    const [jugadorDetalle, setJugadorDetalle] = useState<JugadorPartidoAmigo | null>(null)
    const [guardando, setGuardando] = useState(false)

    const votados = jugadores.filter(j => j.mi_voto).length
    const total = jugadores.length
    const progreso = total > 0 ? Math.round((votados / total) * 100) : 0

    const ranking = [...jugadores]
        .filter(j => (j.total_votos || 0) > 0)
        .sort((a, b) => (b.promedio || 0) - (a.promedio || 0))

    const promEquipo = (eq: 'azul' | 'rojo') => {
        const lista = ranking.filter(j => j.equipo === eq)
        if (!lista.length) return null
        return Math.round(lista.reduce((s, j) => s + (j.promedio || 0), 0) / lista.length * 10) / 10
    }

    const handleVotar = async (nota: number, comentario?: string) => {
        if (!votandoA) return
        setGuardando(true)
        try { await onVotar(votandoA.id, nota, comentario) }
        finally { setGuardando(false); setVotandoA(null) }
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Progreso */}
            <div className="bg-[var(--card-bg)] p-5 rounded-3xl border border-[var(--card-border)]">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tus votos</p>
                        <p className="text-xl font-black italic">{votados} / {total}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-2xl font-black text-[#16a34a]">{progreso}%</p>
                        <button
                            onClick={onRefresh}
                            className="text-[9px] font-black uppercase tracking-widest text-[#16a34a] border border-[#16a34a]/30 px-3 py-1 rounded-full hover:bg-[#16a34a]/10 transition-all"
                        >🔄</button>
                    </div>
                </div>
                <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progreso}%` }} className="h-full bg-[#16a34a] rounded-full" />
                </div>
            </div>

            {/* Ranking en vivo */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
                    <h3 className="font-black italic uppercase tracking-tighter text-sm">📊 Ranking en vivo</h3>
                    <div className="flex gap-3 text-center">
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">Azul</p>
                            <p className="text-lg font-black text-blue-500">{promEquipo('azul') ?? '–'}</p>
                        </div>
                        <div className="w-px bg-[var(--card-border)]" />
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-red-500">Rojo</p>
                            <p className="text-lg font-black text-red-500">{promEquipo('rojo') ?? '–'}</p>
                        </div>
                    </div>
                </div>

                {ranking.length === 0 ? (
                    <div className="py-10 text-center">
                        <p className="text-2xl mb-2">👀</p>
                        <p className="text-xs text-[var(--text-muted)] font-bold">Esperando los primeros votos...</p>
                    </div>
                ) : (
                    ranking.map((j, i) => (
                        <button
                            key={j.id}
                            onClick={() => setJugadorDetalle(j)}
                            className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[var(--card-border)] last:border-0 text-left hover:bg-[var(--hover-bg)] transition-all ${i === 0 ? 'bg-amber-400/5' : ''}`}
                        >
                            {/* Posición */}
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-400 text-amber-900' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}>
                                {i === 0 ? '👑' : i + 1}
                            </div>
                            {/* Avatar */}
                            <JugadorAvatar
                                nombre={j.nombre}
                                avatarUrl={(j as any).avatar_url}
                                equipo={j.equipo}
                                size="sm"
                            />
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold truncate">{j.nombre}</span>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <span className="text-[9px]">{j.equipo === 'azul' ? '🔵' : '🔴'}</span>
                                        <span className="text-base font-black tabular-nums" style={{ color: i === 0 ? '#f59e0b' : j.equipo === 'azul' ? '#3b82f6' : '#ef4444' }}>
                                            {j.promedio}
                                        </span>
                                        <span className="text-[9px] text-[var(--text-muted)]">({j.total_votos}v)</span>
                                    </div>
                                </div>
                                <div className="h-1 bg-[var(--background)] rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${((j.promedio || 0) / 10) * 100}%`,
                                            backgroundColor: i === 0 ? '#f59e0b' : j.equipo === 'azul' ? '#3b82f6' : '#ef4444',
                                            transition: 'width 0.6s ease'
                                        }}
                                    />
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Lista para votar por equipo */}
            {(['azul', 'rojo'] as const).map(eq => (
                <div key={eq}>
                    <h4 className={`font-black text-[10px] uppercase tracking-[0.2em] mb-3 flex items-center gap-2 ${eq === 'azul' ? 'text-blue-500' : 'text-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${eq === 'azul' ? 'bg-blue-500' : 'bg-red-500'}`} />
                        Equipo {eq}
                    </h4>
                    <div className="space-y-2">
                        {jugadores.filter(j => j.equipo === eq).map(j => (
                            <div
                                key={j.id}
                                className={`p-3 rounded-2xl border flex items-center gap-3 ${eq === 'azul' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-red-500/5 border-red-500/10'}`}
                            >
                                {/* Avatar */}
                                <JugadorAvatar
                                    nombre={j.nombre}
                                    avatarUrl={(j as any).avatar_url}
                                    equipo={j.equipo}
                                    size="md"
                                />
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{j.nombre}</p>
                                    {j.mi_voto ? (
                                        <p className="text-[10px] mt-0.5" style={{ color: eq === 'azul' ? '#3b82f6' : '#ef4444' }}>
                                            Tu voto: <strong>{j.mi_voto.nota}/10</strong>
                                            {j.mi_voto.comentario && <span className="text-[var(--text-muted)]"> · "{j.mi_voto.comentario}"</span>}
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Sin votar</p>
                                    )}
                                    {(j.total_votos || 0) > 0 && (
                                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                            Prom: <strong style={{ color: eq === 'azul' ? '#3b82f6' : '#ef4444' }}>{j.promedio}</strong>
                                            <span className="opacity-50"> ({j.total_votos}v)</span>
                                        </p>
                                    )}
                                </div>
                                {/* Botones */}
                                <div className="flex gap-2 shrink-0">
                                    {j.mi_voto && (
                                        <button
                                            onClick={() => onEliminarVoto(j.id)}
                                            className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs"
                                        >🗑️</button>
                                    )}
                                    <button
                                        onClick={() => setVotandoA(j)}
                                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                            j.mi_voto
                                                ? eq === 'azul' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'
                                                : eq === 'azul' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                                        }`}
                                    >
                                        {j.mi_voto ? 'Editar' : 'Votar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Premios especiales */}
            <div className="pt-2">
                <h3 className="font-black italic uppercase tracking-tighter text-sm mb-4">🏆 Premios Especiales</h3>
                <FacetVotingCards
                    partidoId={partido.id}
                    jugadores={jugadores}
                    votosExistentes={facetVotes}
                    onVote={async (pid, facet) => { await onVotarFaceta(pid, facet) }}
                    onDeleteVote={async (facet) => { await onEliminarFaceta(facet) }}
                />
            </div>

            {votandoA && (
                <VotarModal jugador={votandoA} onVotar={handleVotar} onClose={() => setVotandoA(null)} />
            )}
            {jugadorDetalle && (
                <DetalleJugadorAmigo jugador={jugadorDetalle} grupoId="" onClose={() => setJugadorDetalle(null)} />
            )}
        </div>
    )
}
