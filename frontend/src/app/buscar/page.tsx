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
import { SearchSkeleton } from '@/components/SearchSkeleton'
import { FollowButton } from '@/components/FollowButton'

type SearchTab = 'partidos' | 'usuarios' | 'resenas' | 'jugadores'

const COMMON_TEAMS = [
    'River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo',
    'Talleres', 'Belgrano', 'Estudiantes', 'Gimnasia', 'Rosario Central',
    "Newell's Old Boys", 'Argentinos Juniors', 'Velez Sarsfield', 'Huracán',
    'River', 'Boca', 'Racing', 'Ciclón', 'Lanús', 'Banfield', 'Godoy Cruz', 'Unión'
]

export default function BuscarPage() {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState<SearchTab>('partidos')
    const [filterLiga, setFilterLiga] = useState('')
    const [partidos, setPartidos] = useState<Partido[]>([])
    const [usuarios, setUsuarios] = useState<(Profile & { logs_count?: number })[]>([])
    const [resenas, setResenas] = useState<MatchLog[]>([])
    const [jugadores, setJugadores] = useState<{
      player_name: string
      avg_rating: number
      total_ratings: number
      best_log_id?: string
    }[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)

    const autocompleteSuggestions = (() => {
        if (!query || query.length < 2 || tab !== 'partidos') return []
        const lowerQ = query.toLowerCase()
        const ligasMatch = LIGAS.filter(l => l !== 'Todos' && l.toLowerCase().includes(lowerQ))
        const equiposMatch = COMMON_TEAMS.filter(t => t.toLowerCase().includes(lowerQ))
        return [...ligasMatch, ...equiposMatch].slice(0, 5)
    })()

    const [trendingTags, setTrendingTags] = useState<string[]>([])

    useEffect(() => {
        // Fetch real trending tags from Supabase
        const fetchTrendingTags = async () => {
            const { data, error } = await supabase
                .from('match_log_tags')
                .select('tag')

            if (data && data.length > 0) {
                // Count tag occurrences
                const tagCounts = data.reduce((acc, curr) => {
                    acc[curr.tag] = (acc[curr.tag] || 0) + 1
                    return acc
                }, {} as Record<string, number>)

                // Sort by occurrence and take top 6
                const sortedTags = Object.entries(tagCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([tag]) => tag)

                if (sortedTags.length >= 3) {
                    setTrendingTags(sortedTags)
                } else {
                    setTrendingTags(['clasico', 'goles', 'Libertadores'])
                }
            } else {
                setTrendingTags(['clasico', 'goles', 'Libertadores'])
            }
        }
        fetchTrendingTags()
    }, [])

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

    const searchJugadores = useCallback(async (q: string) => {
        if (!q || q.length < 2) { setJugadores([]); return }

        const { data } = await supabase
            .from('match_log_player_ratings')
            .select('player_name, rating, match_log_id')
            .ilike('player_name', `%${q}%`)

        if (!data) return

        const playerMap = new Map<string, {
            total: number
            count: number
            best_log_id?: string
            best_rating: number
        }>()

        data.forEach((r: any) => {
            const existing = playerMap.get(r.player_name) || {
                total: 0, count: 0, best_rating: 0
            }
            existing.total += r.rating
            existing.count++
            if (r.rating > existing.best_rating) {
                existing.best_rating = r.rating
                existing.best_log_id = r.match_log_id
            }
            playerMap.set(r.player_name, existing)
        })

        const result = Array.from(playerMap.entries())
            .map(([player_name, d]) => ({
                player_name,
                avg_rating: d.total / d.count,
                total_ratings: d.count,
                best_log_id: d.best_log_id
            }))
            .sort((a, b) => b.total_ratings - a.total_ratings)
            .slice(0, 20)

        setJugadores(result)
    }, [])

    const handleSearch = useCallback(async () => {
        // Permitir búsqueda vacía si hay filtro de liga o si estamos en Partidos (para ver recientes)
        if (!query && !filterLiga && tab !== 'partidos') {
            setLoading(false)
            setHasSearched(false)
            return
        }
        setLoading(true)
        setHasSearched(true)

        if (tab === 'partidos') {
            await searchPartidos(query)
        } else if (tab === 'usuarios') {
            await searchUsuarios(query)
        } else if (tab === 'jugadores') {
            await searchJugadores(query)
        } else {
            await searchResenas(query)
        }

        setLoading(false)
    }, [query, tab, filterLiga, searchPartidos, searchUsuarios, searchResenas, searchJugadores])

    // Auto-search on tab/filter change
    useEffect(() => {
        if (hasSearched || filterLiga || query) {
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
        { id: 'jugadores' as SearchTab, label: 'Jugadores', icon: TrendingUp },
    ]

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    {/* Search Input */}
                    <div className="relative mb-4">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setShowSuggestions(true)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setShowSuggestions(false)
                                    handleSearch()
                                }
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder={
                                tab === 'partidos' ? 'BÚSQUEDA POR EQUIPO O LIGA...' :
                                    tab === 'usuarios' ? 'BÚSQUEDA DE USUARIOS...' :
                                        'BÚSQUEDA EN RESEÑAS...'
                            }
                            autoFocus
                            className="w-full pl-10 pr-10 py-3 bg-[var(--card-bg)] border border-[var(--card-border)]
                       text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]
                       placeholder:text-[var(--text-muted)] text-[11px] font-black capitalize tracking-widest"
                            style={{ borderRadius: 'var(--radius)' }}
                        />
                        {query && (
                            <button
                                onClick={() => { setQuery(''); setHasSearched(false); setShowSuggestions(false); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)]"
                            >
                                <X size={14} />
                            </button>
                        )}

                        {/* Autocomplete Dropdown */}
                        {showSuggestions && autocompleteSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-0 bg-[var(--card-bg)] border border-[var(--card-border)] z-50 overflow-hidden"
                                style={{ borderTop: 'none', borderRadius: `0 0 var(--radius) var(--radius)` }}>
                                {autocompleteSuggestions.map(sug => (
                                    <button
                                        key={sug}
                                        onClick={() => {
                                            if (LIGAS.includes(sug as any)) {
                                                setFilterLiga(sug)
                                                setQuery('')
                                            } else {
                                                setQuery(sug)
                                            }
                                            setShowSuggestions(false)
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[10px] font-black capitalize hover:bg-[var(--hover-bg)] transition-colors border-b border-[var(--card-border)] last:border-b-0 flex items-center"
                                    >
                                        <Search size={12} className="mr-3 opacity-50" />
                                        {sug}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border border-[var(--card-border)] bg-[var(--card-bg)] mb-4 overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex-1 py-3 text-[10px] font-black capitalize tracking-widest transition-colors ${tab === t.id
                                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Liga Filter (for partidos tab) */}
                    {tab === 'partidos' && (
                        <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4">
                            <button
                                onClick={() => setFilterLiga('')}
                                className={`px-3 py-2 text-[9px] font-black capitalize tracking-tighter border transition-all whitespace-nowrap ${!filterLiga
                                    ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)]'
                                    }`}
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                TODAS
                            </button>
                            {LIGAS.filter(l => l !== 'Todos').map(liga => (
                                <button
                                    key={liga}
                                    onClick={() => setFilterLiga(filterLiga === liga ? '' : liga)}
                                    className={`px-3 py-2 text-[9px] font-black capitalize tracking-tighter border transition-all whitespace-nowrap ${filterLiga === liga
                                        ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)]'
                                        }`}
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    {liga}
                                </button>
                            ))}
                        </div>
                    )}

                    {!hasSearched && !loading && (
                        <div className="py-4 space-y-6">
                            {/* Tags trending */}
                            <div>
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                                    Tendencias
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {trendingTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => { setQuery(tag); if (tab === 'usuarios') setTab('resenas') }}
                                            className="px-3 py-1.5 border border-[var(--card-border)] text-[10px] font-black capitalize hover:bg-[var(--hover-bg)] transition-all"
                                            style={{ borderRadius: 'var(--radius)' }}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Top reseñas de la semana */}
                            <TopResenasSemana />

                            {/* Top usuarios activos */}
                            <TopUsuariosActivos />
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="pt-4 opacity-50">
                            <SearchSkeleton tab={tab} />
                        </div>
                    )}

                    {/* Results: Partidos */}
                    {!loading && hasSearched && tab === 'partidos' && (
                        <div className="space-y-4">
                            {partidos.length === 0 ? (
                                <div className="text-center py-12 border border-[var(--card-border)] border-dashed" style={{ borderRadius: 'var(--radius)' }}>
                                    <p className="text-[10px] font-black capitalize text-[var(--text-muted)]">SIN RESULTADOS</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {partidos.map((partido) => (
                                        <PartidoCard key={partido.id} partido={partido} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results: Usuarios */}
                    {!loading && hasSearched && tab === 'usuarios' && (
                        <div className="space-y-1">
                            {usuarios.length === 0 ? (
                                <div className="text-center py-12 border border-[var(--card-border)] border-dashed" style={{ borderRadius: 'var(--radius)' }}>
                                    <p className="text-[10px] font-black capitalize text-[var(--text-muted)]">
                                        {query.length < 2 ? 'ESCRIBÍ AL MENOS 2 CARACTERES' : 'SIN RESULTADOS'}
                                    </p>
                                </div>
                            ) : (
                                <div className="border border-[var(--card-border)] bg-[var(--card-bg)] divide-y divide-[var(--card-border)] overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                                    {usuarios.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center gap-3 p-3 hover:bg-[var(--background)] transition-colors"
                                        >
                                            <div
                                                className="w-10 h-10 border border-[var(--card-border)] bg-[var(--background)] flex flex-shrink-0 items-center justify-center cursor-pointer overflow-hidden"
                                                onClick={() => router.push(`/perfil/${user.id}`)}
                                                style={{ borderRadius: 'var(--radius)' }}
                                            >
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-black">{user.username?.charAt(0)?.toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-black capitalize tracking-widest hover:underline cursor-pointer" onClick={() => router.push(`/perfil/${user.id}`)}>
                                                    {user.username}
                                                </div>
                                                {user.equipo && (
                                                    <div className="text-[9px] text-[var(--text-muted)] font-black capitalize">
                                                        {user.equipo}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <FollowButton targetUserId={user.id} targetUsername={user.username || ''} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results: Reseñas */}
                    {!loading && hasSearched && tab === 'resenas' && (
                        <div className="space-y-4">
                            {resenas.length === 0 ? (
                                <div className="text-center py-12 border border-[var(--card-border)] border-dashed" style={{ borderRadius: 'var(--radius)' }}>
                                    <p className="text-[10px] font-black capitalize text-[var(--text-muted)]">SIN RESULTADOS</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {resenas.map((resena) => (
                                        <MatchLogCard key={resena.id} log={resena} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results: Jugadores */}
                    {!loading && hasSearched && tab === 'jugadores' && (
                        <div className="space-y-2">
                            {jugadores.length === 0 ? (
                                <div className="text-center py-12 border border-[var(--card-border)] border-dashed" style={{ borderRadius: 'var(--radius)' }}>
                                    <p className="text-[10px] font-black capitalize text-[var(--text-muted)]">
                                        {query.length < 2 ? 'ESCRIBÍ AL MENOS 2 CARACTERES' : 'SIN RESULTADOS'}
                                    </p>
                                </div>
                            ) : (
                                <div className="border border-[var(--card-border)] bg-[var(--card-bg)] divide-y divide-[var(--card-border)] overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                                    {jugadores.map((j) => (
                                        <div
                                            key={j.player_name}
                                            className="flex items-center gap-3 p-3 hover:bg-[var(--background)] transition-colors cursor-pointer"
                                            onClick={() => j.best_log_id && router.push(`/log/${j.best_log_id}`)}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-lg font-black shrink-0">
                                                ⚽
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-black truncate">{j.player_name}</div>
                                                <div className="text-[10px] text-[var(--text-muted)]">
                                                    {j.total_ratings} calificación{j.total_ratings !== 1 ? 'es' : ''}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 px-2 py-1 bg-[var(--hover-bg)] rounded-lg">
                                                <span className="text-xs font-black">⭐ {j.avg_rating.toFixed(1)}</span>
                                            </div>
                                        </div>
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

function TopResenasSemana() {
    const [resenas, setResenas] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            const unaSemanAtras = new Date(Date.now() - 7 * 86400000).toISOString()
            const { data } = await supabase
                .from('match_logs')
                .select(`
                    id, equipo_local, equipo_visitante, rating_partido, review_title,
                    likes_count:match_log_likes(count),
                    profile:profiles!match_logs_user_id_fkey(username)
                `)
                .eq('is_private', false)
                .not('review_text', 'is', null)
                .gte('created_at', unaSemanAtras)
                .order('created_at', { ascending: false })
                .limit(3)

            if (data) setResenas(data.map((r: any) => ({
                ...r,
                likes_count: r.likes_count?.[0]?.count || 0
            })))
        }
        fetchData()
    }, [])

    if (!resenas.length) return null

    return (
        <div>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                🔥 Reseñas populares esta semana
            </p>
            <div className="space-y-2">
                {resenas.map(r => (
                    <button
                        key={r.id}
                        onClick={() => router.push(`/log/${r.id}`)}
                        className="w-full flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--foreground)] transition-all text-left"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate">
                                {r.equipo_local} vs {r.equipo_visitante}
                            </p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                                por @{r.profile?.username} · ⭐ {r.rating_partido?.toFixed(1)}
                            </p>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                            ❤️ {r.likes_count}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}

function TopUsuariosActivos() {
    const [usuarios, setUsuarios] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await supabase
                .from('match_logs')
                .select(`
                    user_id,
                    profile:profiles!match_logs_user_id_fkey(username, avatar_url)
                `)
                .eq('is_private', false)
                .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())

            if (!data) return

            const counts = new Map<string, { username: string; avatar_url?: string; count: number }>()
            data.forEach((d: any) => {
                const cur = counts.get(d.user_id) || { username: d.profile?.username, avatar_url: d.profile?.avatar_url, count: 0 }
                cur.count++
                counts.set(d.user_id, cur)
            })

            const sorted = Array.from(counts.entries())
                .map(([user_id, d]) => ({ user_id, ...d }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

            setUsuarios(sorted)
        }
        fetchData()
    }, [])

    if (!usuarios.length) return null

    return (
        <div>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">
                👤 Más activos este mes
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {usuarios.map(u => (
                    <button
                        key={u.user_id}
                        onClick={() => router.push(`/perfil/${u.user_id}`)}
                        className="flex flex-col items-center gap-1.5 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--foreground)] transition-all shrink-0 min-w-[70px]"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                            {u.avatar_url
                                ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                : <span className="text-sm font-black">{u.username?.[0]?.toUpperCase()}</span>
                            }
                        </div>
                        <span className="text-[9px] font-black truncate max-w-[60px]">{u.username}</span>
                        <span className="text-[8px] text-[var(--text-muted)]">{u.count} reseñas</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
