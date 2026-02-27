// src/app/feed/page.tsx
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, TrendingUp, Clock, Star, Filter, X } from 'lucide-react'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { MatchLogCard } from '@/components/MatchLogCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useMatchLogs, type MatchLogFilters } from '@/hooks/useMatchLogs'
import { useAuth } from '@/contexts/AuthContext'
import { LIGAS } from '@/lib/constants'

type FeedTab = 'recent' | 'popular' | 'myteams'

export default function FeedPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<FeedTab>('recent')
    const [showFilters, setShowFilters] = useState(false)
    const [filterLiga, setFilterLiga] = useState('')
    const [filterEquipo, setFilterEquipo] = useState('')
    const [filterType, setFilterType] = useState('')

    const filters: MatchLogFilters = {
        liga: filterLiga || undefined,
        equipo: filterEquipo || undefined,
        matchType: filterType || undefined,
        feedType: activeTab === 'popular' ? 'popular' : 'recent',
        limit: 20,
    }

    const { logs, loading, toggleLike, hasMore, fetchLogs } = useMatchLogs(filters)
    const activeFiltersCount = [filterLiga, filterEquipo, filterType].filter(Boolean).length

    const clearFilters = () => {
        setFilterLiga('')
        setFilterEquipo('')
        setFilterType('')
    }

    const loadMore = useCallback(() => {
        if (hasMore && !loading) {
            fetchLogs(false)
        }
    }, [hasMore, loading, fetchLogs])

    const tabs = [
        { id: 'recent' as FeedTab, label: 'Recientes', icon: Clock },
        { id: 'popular' as FeedTab, label: 'Popular', icon: TrendingUp },
        { id: 'myteams' as FeedTab, label: 'Mis Equipos', icon: Star },
    ]

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header */}
                <div className="px-4 py-4 flex items-center justify-between md:hidden">
                    <h1 className="text-xl font-bold tracking-tight">Actividad</h1>
                    <button
                        onClick={() => {
                            if (!user) { router.push('/login'); return }
                            router.push('/log')
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#f59e0b] text-white rounded-xl
                     text-xs font-semibold hover:bg-[#d97706] transition-all shadow-sm shadow-[#f59e0b]/20"
                    >
                        <Plus size={14} />
                        Reseña
                    </button>
                </div>

                <div className="max-w-2xl mx-auto px-4">
                    {/* Tabs */}
                    <div className="flex gap-1 mb-4 p-1 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                        }`}
                                >
                                    <Icon size={13} />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Filter Bar */}
                    <div className="flex items-center gap-2 mb-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showFilters || activeFiltersCount > 0
                                    ? 'border-[#f59e0b]/30 bg-[#f59e0b]/5 text-[#f59e0b]'
                                    : 'border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            <Filter size={13} />
                            Filtros
                            {activeFiltersCount > 0 && (
                                <span className="ml-1 w-4 h-4 rounded-full bg-[#f59e0b] text-white text-[10px] flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 px-2 py-2 text-xs text-red-400 hover:text-red-500 transition-colors"
                            >
                                <X size={12} />
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl space-y-3"
                        >
                            <div>
                                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Liga</label>
                                <div className="flex gap-1.5 flex-wrap">
                                    {LIGAS.filter(l => l !== 'Todos').map(liga => (
                                        <button
                                            key={liga}
                                            onClick={() => setFilterLiga(filterLiga === liga ? '' : liga)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${filterLiga === liga
                                                    ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                                                    : 'bg-[var(--hover-bg)] text-[var(--text-muted)] border border-transparent'
                                                }`}
                                        >
                                            {liga}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Equipo</label>
                                <input
                                    type="text"
                                    value={filterEquipo}
                                    onChange={(e) => setFilterEquipo(e.target.value)}
                                    placeholder="Buscar equipo..."
                                    className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-xs
                           focus:outline-none focus:border-[#f59e0b]/50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Tipo</label>
                                <div className="flex gap-1.5">
                                    {[
                                        { value: 'tv', label: '📺 TV' },
                                        { value: 'stadium', label: '🏟️ Cancha' },
                                        { value: 'friend', label: '👥 Amigos' },
                                        { value: 'other', label: '🔮 Otro' },
                                    ].map(t => (
                                        <button
                                            key={t.value}
                                            onClick={() => setFilterType(filterType === t.value ? '' : t.value)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${filterType === t.value
                                                    ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30'
                                                    : 'bg-[var(--hover-bg)] text-[var(--text-muted)] border border-transparent'
                                                }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Feed */}
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center py-16">
                            <LoadingSpinner />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <div className="w-20 h-20 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]
                             flex items-center justify-center mb-4">
                                <span className="text-3xl">🎬</span>
                            </div>
                            <h3 className="text-base font-semibold mb-1">No hay reseñas aún</h3>
                            <p className="text-sm text-[var(--text-muted)] text-center max-w-xs mb-4">
                                Sé el primero en loguear un partido y compartir tu experiencia.
                            </p>
                            <button
                                onClick={() => router.push('/log')}
                                className="px-4 py-2.5 bg-[#f59e0b] text-white rounded-xl text-sm font-semibold
                         hover:bg-[#d97706] transition-all"
                            >
                                Crear primera reseña
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {logs.map((log, i) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <MatchLogCard log={log} onLike={toggleLike} />
                                </motion.div>
                            ))}

                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="w-full py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--foreground)]
                           bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl transition-colors"
                                >
                                    {loading ? 'Cargando...' : 'Cargar más'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* FAB for mobile */}
            <button
                onClick={() => {
                    if (!user) { router.push('/login'); return }
                    router.push('/log')
                }}
                className="fixed bottom-20 right-4 w-14 h-14 bg-[#f59e0b] text-white rounded-full shadow-lg shadow-[#f59e0b]/30
                 flex items-center justify-center hover:bg-[#d97706] active:scale-95 transition-all z-40 md:hidden"
            >
                <Plus size={24} />
            </button>

            <NavBar />
        </>
    )
}
