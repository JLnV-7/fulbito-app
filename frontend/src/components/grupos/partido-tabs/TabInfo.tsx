// src/components/grupos/partido-tabs/TabInfo.tsx
'use client'

import { useState, useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PartidoAmigo, JugadorPartidoAmigo } from '@/types'

interface Props {
    partido: PartidoAmigo
    jugadores: JugadorPartidoAmigo[]
    grupoId: string
    canEdit: boolean
    onAgregarJugador: (nombre: string, equipo: 'azul' | 'rojo', userId?: string) => Promise<void>
    onEliminarJugador: (id: string) => Promise<void>
}

export function TabInfo({ partido, jugadores, grupoId, canEdit, onAgregarJugador, onEliminarJugador }: Props) {
    const [miembros, setMiembros] = useState<any[]>([])
    const [agregando, setAgregando] = useState<'azul' | 'rojo' | null>(null)
    const [nombre, setNombre] = useState('')
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        supabase
            .from('miembros_grupo')
            .select('user_id, profile:profiles(username)')
            .eq('grupo_id', grupoId)
            .then(({ data }) => setMiembros(data || []))
    }, [grupoId])

    const handleAgregar = async () => {
        if (!nombre.trim() || !agregando) return
        setGuardando(true)
        try {
            await onAgregarJugador(nombre.trim(), agregando, selectedUser || undefined)
            setNombre('')
            setSelectedUser(null)
            setAgregando(null)
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Info básica */}
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] text-center">
                <p className="text-4xl mb-2">🏟️</p>
                <h3 className="font-black text-xl italic">{partido.cancha || 'Sin cancha definida'}</h3>
                <p className="text-[var(--text-muted)] font-bold text-sm mt-1">
                    Fútbol {partido.tipo_partido} · {partido.hora.slice(0, 5)} hs
                </p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    partido.estado === 'votacion_abierta' ? 'bg-[#16a34a]/10 text-[#16a34a]' :
                    partido.estado === 'finalizado' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-[var(--hover-bg)] text-[var(--text-muted)]'
                }`}>
                    {partido.estado === 'votacion_abierta' ? '🗳️ Votación abierta' :
                     partido.estado === 'finalizado' ? '✅ Finalizado' : '📝 Borrador'}
                </span>
            </div>

            {/* Contador de jugadores */}
            <div className="grid grid-cols-2 gap-4">
                {(['azul', 'rojo'] as const).map(eq => (
                    <div key={eq} className={`p-4 rounded-2xl border text-center ${eq === 'azul' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <p className="text-2xl mb-1">{eq === 'azul' ? '🔵' : '🔴'}</p>
                        <p className={`font-black text-xs uppercase ${eq === 'azul' ? 'text-blue-500' : 'text-red-500'}`}>Equipo {eq}</p>
                        <p className="text-2xl font-black mt-1">{jugadores.filter(j => j.equipo === eq).length}</p>
                    </div>
                ))}
            </div>

            {/* Lista de equipos */}
            {(['azul', 'rojo'] as const).map(eq => (
                <div key={eq} className={`rounded-3xl border overflow-hidden ${eq === 'azul' ? 'bg-blue-500/5 border-blue-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                    <div className={`px-5 py-4 border-b flex items-center justify-between ${eq === 'azul' ? 'border-blue-500/10' : 'border-red-500/10'}`}>
                        <h4 className={`font-black text-xs uppercase tracking-widest ${eq === 'azul' ? 'text-blue-500' : 'text-red-500'}`}>
                            {eq === 'azul' ? '🔵' : '🔴'} Equipo {eq}
                        </h4>
                        {canEdit && (
                            <button
                                onClick={() => setAgregando(eq)}
                                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${eq === 'azul' ? 'text-blue-500 border-blue-500/30 hover:bg-blue-500/10' : 'text-red-500 border-red-500/30 hover:bg-red-500/10'}`}
                            >
                                + Agregar
                            </button>
                        )}
                    </div>
                    {jugadores.filter(j => j.equipo === eq).length === 0 ? (
                        <p className="text-center py-6 text-xs text-[var(--text-muted)] italic opacity-50">Sin jugadores</p>
                    ) : (
                        jugadores.filter(j => j.equipo === eq).map(j => (
                            <div key={j.id} className="flex items-center justify-between px-5 py-3 border-b border-[var(--card-border)] last:border-0">
                                <p className="font-bold text-sm">👤 {j.nombre}</p>
                                {canEdit && (
                                    <button
                                        onClick={() => onEliminarJugador(j.id)}
                                        className="text-[10px] text-red-400 hover:text-red-500 transition-colors"
                                    >🗑️</button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            ))}

            {/* Modal agregar jugador */}
            {agregando && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setAgregando(null)}>
                    <div className="bg-[var(--card-bg)] rounded-3xl p-6 w-full max-w-sm border border-[var(--card-border)] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h4 className="text-xl font-black mb-1 italic">➕ Agregar jugador</h4>
                        <p className="text-xs text-[var(--text-muted)] mb-5 uppercase tracking-widest font-bold">
                            Equipo {agregando === 'azul' ? '🔵 Azul' : '🔴 Rojo'}
                        </p>

                        {/* Miembros del grupo */}
                        {miembros.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Miembro del grupo</p>
                                <div className="max-h-36 overflow-y-auto border border-[var(--card-border)] rounded-2xl bg-[var(--background)] p-2 space-y-1">
                                    {miembros.map(m => (
                                        <button
                                            key={m.user_id}
                                            onClick={() => { setNombre(m.profile?.username || ''); setSelectedUser(m.user_id) }}
                                            className={`w-full text-left p-3 rounded-xl text-xs flex items-center gap-2 transition-all ${selectedUser === m.user_id ? 'bg-[#16a34a] text-white font-bold' : 'hover:bg-[var(--hover-bg)]'}`}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                                                {m.profile?.username?.[0]?.toUpperCase()}
                                            </div>
                                            {m.profile?.username}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input nombre */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <UserPlus size={16} className="text-[var(--text-muted)]" />
                            </div>
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => { setNombre(e.target.value); setSelectedUser(null) }}
                                onKeyDown={e => e.key === 'Enter' && handleAgregar()}
                                placeholder="O escribí un nombre..."
                                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/50"
                            />
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setAgregando(null); setNombre(''); setSelectedUser(null) }}
                                className="flex-1 py-3 rounded-2xl text-[var(--text-muted)] font-black text-xs uppercase tracking-widest hover:bg-[var(--hover-bg)] transition-all"
                            >Cancelar</button>
                            <button
                                onClick={handleAgregar}
                                disabled={!nombre.trim() || guardando}
                                className="flex-1 py-3 rounded-2xl font-black text-white bg-[#16a34a] disabled:opacity-40 text-xs uppercase tracking-widest"
                            >{guardando ? '⏳' : 'Agregar'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
