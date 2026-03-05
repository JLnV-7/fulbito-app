// src/app/buscar/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, X, Users, Trophy, Film, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCard } from '@/components/PartidoCard'
import { LIGAS } from '@/lib/constants'
import type { Partido, Profile, MatchLog } from '@/types'
import { MatchLogCard } from '@/components/MatchLogCard'

type SearchTab = 'partidos' | 'usuarios' | 'resenas'

export default function BuscarPage() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState<SearchTab>('partidos')
    const [filterLiga, setFilterLiga] = useState('')
    const [partidos, setPartidos] = useState<Partido[]>([])
    const [usuarios, setUsuarios] = useState<(Profile & { logs_count?: number })[]>([])
    const [resenas, setResenas] = useState<MatchLog[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // Trending tags
    const trendingTags = ['clasico', 'remontada', 'goleada', 'final', 'derbi', 'penales']

    const searchPartidos = useCallback(async (q: string) => {
        let queryBuilder = supabase
            .from('partidos')
            .select('*')
            .order('fecha_inicio', { ascending: false })
            .limit(20)

        if (q) {
            queryBuilder = queryBuilder.or(`equipo_local.ilike.%${q}%,equipo_visitante.ilike.%${q}%`)
        }

        if (filterLiga) {
            queryBuilder = queryBuilder.eq('liga', filterLiga)
        }

        const { data } = await queryBuilder
        setPartidos(data || [])
    }, [filterLiga])

    const searchUsuarios = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setUsuarios([])
            return
        }

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .ilike('username', `%${q}%`)
            .limit(20)

        setUsuarios(data || [])
    }, [])

    const searchResenas = useCallback(async (q: string) => {
        if (!q || q.length < 2) {
            setResenas([])
            return
        }

        const { data } = await supabase
            .from('match_logs')
            .select(`
                *,
                profile:profiles!match_logs_user_id_fkey(id, username, avatar_url),
                tags:match_log_tags(tag),
                likes_count:match_log_likes(count)
            `)
            .or(`review_text.ilike.%${q}%,review_title.ilike.%${q}%`)
            .eq('is_private', false)
            .order('created_at', { ascending: false })
            .limit(20)

        // Process data formatting tags correctly
        const processedResenas = (data || []).map((log: any) => ({
            ...log,
            tags: (log.tags || []).map((t: any) => t.tag),
            likes_count: log.likes_count?.[0]?.count || 0
        }))

        setResenas(processedResenas)
    }, [])

    const handleSearch = useCallback(async () => {
        if (!query && !filterLiga) return
        setLoading(true)
        setHasSearched(true)

        if (tab === 'partidos') {
            await searchPartidos(query)
        } else if (tab === 'usuarios') {
            await searchUsuarios(query)
        } else {
            await searchResenas(query)
        }

        setLoading(false)
    }, [query, tab, filterLiga, searchPartidos, searchUsuarios, searchResenas])

    // Auto-search on tab/filter change
    useEffect(() => {
        if (hasSearched || filterLiga) {
            handleSearch()
        }
    }, [tab, filterLiga]) // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced search on query change
    useEffect(() => {
        if (!query && !filterLiga) {
            setHasSearched(false)
            setPartidos([])
            setUsuarios([])
            setResenas([])
            return
        }

        const timeout = setTimeout(() => {
            handleSearch()
        }, 400)

        return () => clearTimeout(timeout)
    }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

    const tabs = [
        { id: 'partidos' as SearchTab, label: 'Partidos', icon: Trophy },
        { id: 'usuarios' as SearchTab, label: 'Usuarios', icon: Users },
        { id: 'resenas' as SearchTab, label: 'Reseñas', icon: Film },
    ]

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    {/* Search Input */}
                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={
                                tab === 'partidos' ? 'Buscar equipo o liga...' :
                                    tab === 'usuarios' ? 'Buscar usuario...' :
                                        'Buscar en reseñas o títulos...'
                            }
                            autoFocus
                            className="w-full pl-10 pr-10 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl
                       text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors
                       placeholder:text-[var(--text-muted)] text-sm"
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(''); setHasSearched(false) }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 mb-4 p-1 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
                        {tabs.map((t) => {
                            const Icon = t.icon
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id
                                        ? 'bg-[#ff6b6b]/10 text-[#ff6b6b]'
                                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    <Icon size={13} />
                                    {t.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Liga Filter (for partidos tab) */}
                    {tab === 'partidos' && (
                        <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-4 pb-0.5">
                            <button
                                onClick={() => setFilterLiga('')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${!filterLiga
                                    ? 'bg-[#10b981] text-white'
                                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'
                                    }`}
                            >
                                Todas
                            </button>
                            {LIGAS.filter(l => l !== 'Todos').map(liga => (
                                <button
                                    key={liga}
                                    onClick={() => setFilterLiga(filterLiga === liga ? '' : liga)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${filterLiga === liga
                                        ? 'bg-[#10b981] text-white'
                                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'
                                        }`}
                                >
                                    {liga}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No search yet - show trending */}
                    {!hasSearched && !loading && (
                        <div className="py-8">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={14} className="text-[#f59e0b]" />
                                <span className="text-xs font-semibold text-[var(--text-muted)]">TRENDING TAGS</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {trendingTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => { setQuery(tag); if (tab === 'usuarios') setTab('resenas'); }}
                                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#f59e0b]/10 text-[#f59e0b]
                             border border-[#f59e0b]/20 hover:bg-[#f59e0b]/20 transition-all"
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]
                               flex items-center justify-center mx-auto mb-3">
                                    <Search size={24} className="text-[var(--text-muted)]" />
                                </div>
                                <p className="text-sm text-[var(--text-muted)]">
                                    Buscá partidos por equipo o encontrá usuarios
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center py-16">
                            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {/* Results: Partidos */}
                    {!loading && hasSearched && tab === 'partidos' && (
                        <div>
                            {partidos.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-3xl mb-3 block">🔍</span>
                                    <p className="text-sm text-[var(--text-muted)]">No se encontraron partidos</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {partidos.map((partido, i) => (
                                        <motion.div
                                            key={partido.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                        >
                                            <PartidoCard partido={partido} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results: Usuarios */}
                    {!loading && hasSearched && tab === 'usuarios' && (
                        <div>
                            {usuarios.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-3xl mb-3 block">👤</span>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {query.length < 2 ? 'Escribí al menos 2 caracteres para buscar' : 'No se encontraron usuarios'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {usuarios.map((user, i) => (
                                        <motion.button
                                            key={user.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            onClick={() => router.push(`/perfil/${user.id}`)}
                                            className="w-full flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--card-border)]
                               rounded-xl hover:border-[var(--accent)]/30 transition-all text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#ef4444]
                                    flex items-center justify-center text-white text-lg shrink-0">
                                                {user.avatar_url || user.username?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold truncate">{user.username || 'Usuario'}</div>
                                                {user.equipo && (
                                                    <div className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                        <span>❤️</span> {user.equipo}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs text-[var(--text-muted)]">Ver perfil →</span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results: Reseñas */}
                    {!loading && hasSearched && tab === 'resenas' && (
                        <div>
                            {resenas.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-3xl mb-3 block">📜</span>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {query.length < 2 ? 'Escribí al menos 2 caracteres para buscar' : 'No se encontraron reseñas con ese texto'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {resenas.map((resena, i) => (
                                        <motion.div
                                            key={resena.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                        >
                                            <MatchLogCard log={resena} />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <NavBar />
        </>
    )
}
