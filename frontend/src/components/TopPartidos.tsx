// src/components/TopPartidos.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Search, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { TeamLogo } from './TeamLogo'
import type { Partido } from '@/types'

interface FavMatch {
    id: string
    user_id: string
    partido_id?: string
    equipo_local: string
    equipo_visitante: string
    logo_local?: string
    logo_visitante?: string
    goles_local?: number
    goles_visitante?: number
    liga?: string
    fecha?: string
    position: number // 1-4
    motivo?: string  // why it's memorable
}

interface TopPartidosProps {
    userId: string
    editable?: boolean
}

export function TopPartidos({ userId, editable = false }: TopPartidosProps) {
    const { user } = useAuth()
    const [favorites, setFavorites] = useState<FavMatch[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<Partido[]>([])
    const [searching, setSearching] = useState(false)
    const [expanded, setExpanded] = useState(false)

    const isOwner = user?.id === userId

    useEffect(() => {
        fetchFavorites()
    }, [userId])

    const fetchFavorites = async () => {
        try {
            const { data } = await supabase
                .from('partidos_favoritos')
                .select('*')
                .eq('user_id', userId)
                .order('position', { ascending: true })
                .limit(4)

            setFavorites(data || [])
        } catch {
            console.log('Favoritos no disponibles')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([])
            return
        }

        const timeout = setTimeout(async () => {
            setSearching(true)
            try {
                const { data } = await supabase
                    .from('partidos')
                    .select('*')
                    .or(`equipo_local.ilike.%${searchQuery}%,equipo_visitante.ilike.%${searchQuery}%`)
                    .order('fecha_inicio', { ascending: false })
                    .limit(8)

                setSearchResults(data || [])
            } catch {
                setSearchResults([])
            } finally {
                setSearching(false)
            }
        }, 300)

        return () => clearTimeout(timeout)
    }, [searchQuery])

    const addFavorite = async (partido: Partido) => {
        if (!user || favorites.length >= 4) return

        const newFav: Partial<FavMatch> = {
            user_id: user.id,
            partido_id: String(partido.id),
            equipo_local: partido.equipo_local,
            equipo_visitante: partido.equipo_visitante,
            logo_local: partido.logo_local,
            logo_visitante: partido.logo_visitante,
            goles_local: partido.goles_local,
            goles_visitante: partido.goles_visitante,
            liga: partido.liga,
            fecha: partido.fecha_inicio,
            position: favorites.length + 1,
        }

        const { data, error } = await supabase
            .from('partidos_favoritos')
            .insert(newFav)
            .select()
            .single()

        if (!error && data) {
            setFavorites(prev => [...prev, data])
            setAdding(false)
            setSearchQuery('')
            setSearchResults([])
        }
    }

    const removeFavorite = async (favId: string) => {
        await supabase.from('partidos_favoritos').delete().eq('id', favId)
        setFavorites(prev => prev.filter(f => f.id !== favId))
    }

    if (loading) return null

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <Trophy size={14} className="text-[#f59e0b]" />
                    Top Partidos
                    <span className="text-xs font-normal text-[var(--text-muted)]">{favorites.length}/4</span>
                </h3>
                {favorites.length > 0 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                    >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                )}
            </div>

            {favorites.length === 0 && !editable && (
                <p className="text-xs text-[var(--text-muted)]">Aún no tiene partidos favoritos</p>
            )}

            {/* Favorite matches grid */}
            <div className={`space-y-2 ${!expanded && favorites.length > 2 ? 'max-h-32 overflow-hidden' : ''}`}>
                <AnimatePresence>
                    {favorites.map((fav, i) => (
                        <motion.div
                            key={fav.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)] group"
                        >
                            <span className="text-[10px] font-black text-[#f59e0b] w-5 text-center">#{i + 1}</span>
                            <TeamLogo src={fav.logo_local} teamName={fav.equipo_local} size={18} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold truncate">
                                    {fav.equipo_local} vs {fav.equipo_visitante}
                                </div>
                                <div className="text-[9px] text-[var(--text-muted)]">
                                    {fav.goles_local != null && `${fav.goles_local}-${fav.goles_visitante} · `}
                                    {fav.liga}
                                </div>
                            </div>
                            <TeamLogo src={fav.logo_visitante} teamName={fav.equipo_visitante} size={18} />
                            {editable && isOwner && (
                                <button
                                    onClick={() => removeFavorite(fav.id)}
                                    className="p-1 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Add button */}
            {editable && isOwner && favorites.length < 4 && (
                <div className="mt-3">
                    {!adding ? (
                        <button
                            onClick={() => setAdding(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-[var(--card-border)]
                       text-xs text-[var(--text-muted)] hover:border-[#f59e0b]/30 hover:text-[#f59e0b] transition-all"
                        >
                            <Plus size={14} /> Agregar partido memorable
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar partido..."
                                    autoFocus
                                    className="w-full pl-9 pr-8 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl text-xs
                           focus:outline-none focus:border-[#f59e0b]/50"
                                />
                                <button onClick={() => { setAdding(false); setSearchQuery('') }}
                                    className="absolute right-2 top-2 text-[var(--text-muted)]">
                                    <X size={14} />
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {searchResults.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => addFavorite(p)}
                                            className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-xs
                               hover:bg-[var(--hover-bg)] transition-colors"
                                        >
                                            <TeamLogo src={p.logo_local} teamName={p.equipo_local} size={16} />
                                            <span className="flex-1 truncate">{p.equipo_local} vs {p.equipo_visitante}</span>
                                            {p.goles_local != null && (
                                                <span className="text-[var(--text-muted)]">{p.goles_local}-{p.goles_visitante}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
