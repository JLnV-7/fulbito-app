// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePartidos } from '@/hooks/usePartidos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PartidoCard } from '@/components/PartidoCard'
import { SearchBar } from '@/components/SearchBar'
import { DateFilter } from '@/components/DateFilter'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { ReglasPuntajeModal } from '@/components/ReglasPuntajeModal'
import { TablaContent } from '@/components/TablaContent'
import { GoleadoresContent } from '@/components/GoleadoresContent'
import { FixturesContent } from '@/components/FixturesContent'
import { Star, Search, BarChart3, Trophy, Calendar } from 'lucide-react'
import type { Partido } from '@/types'

import { LIGAS, type Liga } from '@/lib/constants'

type HomeTab = 'partidos' | 'tabla' | 'goleadores' | 'fixtures'

const TABS: { id: HomeTab; label: string; icon: React.ReactNode }[] = [
  { id: 'partidos', label: 'Partidos', icon: <span className="text-sm">⚽</span> },
  { id: 'tabla', label: 'Tabla', icon: <BarChart3 size={14} /> },
  { id: 'goleadores', label: 'Goleadores', icon: <Trophy size={14} /> },
  { id: 'fixtures', label: 'Fixtures', icon: <Calendar size={14} /> },
]

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    const tab = searchParams.get('tab')
    if (tab && ['partidos', 'tabla', 'goleadores', 'fixtures'].includes(tab)) {
      return tab as HomeTab
    }
    return 'partidos'
  })
  const [filtroLiga, setFiltroLiga] = useState<Liga | 'Favoritos'>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [favoritos, setFavoritos] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Usamos 'Todos' cuando el filtro es 'Favoritos' para traer todo y filtrar en cliente
  const { partidos, loading, error, refetch } = usePartidos(filtroLiga === 'Favoritos' ? 'Todos' : filtroLiga as Liga)

  // Cargar favoritos al inicio
  useEffect(() => {
    if (user) {
      supabase
        .from('favoritos')
        .select('equipo_nombre')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setFavoritos(data.map(f => f.equipo_nombre))
        })
    }
  }, [user])

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['partidos', 'tabla', 'goleadores', 'fixtures'].includes(tab)) {
      setActiveTab(tab as HomeTab)
    }
  }, [searchParams])

  const handleTabChange = (tab: HomeTab) => {
    setActiveTab(tab)
    // Update URL without full navigation
    const url = tab === 'partidos' ? '/' : `/?tab=${tab}`
    window.history.replaceState(null, '', url)
  }

  // Filter partidos by search query, date and favorites
  const partidosFiltrados = partidos.filter(partido => {
    const matchesSearch = !searchQuery || (
      partido.equipo_local.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partido.equipo_visitante.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesDate = !dateFilter || partido.fecha_inicio.startsWith(dateFilter)
    const matchesFavorites = filtroLiga !== 'Favoritos' || (
      favoritos.includes(partido.equipo_local) ||
      favoritos.includes(partido.equipo_visitante)
    )
    return matchesSearch && matchesDate && matchesFavorites
  })

  // Count live matches
  const liveCount = partidos.filter(p => p.estado === 'EN_JUEGO').length

  // Get the current liga name for passing to sub-components
  const currentLigaName = filtroLiga === 'Todos' || filtroLiga === 'Favoritos'
    ? undefined
    : filtroLiga

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
        {/* Header Mobile */}
        <div className="px-4 py-4 flex justify-between items-center md:hidden">
          <h1 className="text-xl font-bold tracking-tight">FutLog</h1>
          <div className="flex items-center gap-2">
            <ReglasPuntajeModal />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">

          {/* Tabs de sección */}
          <div className="flex gap-1 mb-4 p-1 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all
                  ${activeTab === tab.id
                    ? 'bg-[#10b981]/10 text-[#10b981] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                  }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}{tab.label.length > 4 ? '.' : ''}</span>
              </button>
            ))}
          </div>

          {/* === PARTIDOS TAB === */}
          {activeTab === 'partidos' && (
            <>
              {/* League Filters + Actions */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 pb-0.5">
                  {LIGAS.map((liga) => (
                    <button
                      key={liga}
                      onClick={() => setFiltroLiga(liga)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
                        ${filtroLiga === liga
                          ? 'bg-[#10b981] text-white shadow-sm shadow-[#10b981]/25'
                          : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]'
                        }`}
                    >
                      {liga}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      if (!user) { router.push('/login'); return }
                      setFiltroLiga('Favoritos')
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1
                      ${filtroLiga === 'Favoritos'
                        ? 'bg-amber-500/15 text-amber-500 border border-amber-500/40'
                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-amber-500 border border-[var(--card-border)]'
                      }`}
                  >
                    <Star size={11} fill={filtroLiga === 'Favoritos' ? 'currentColor' : 'none'} />
                    Fav
                  </button>
                </div>

                {/* Compact actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg border transition-all ${showFilters || searchQuery || dateFilter
                      ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
                      : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'
                      }`}
                    title="Filtrar"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>

              {/* Search & Date Filter (collapsible) */}
              {showFilters && (
                <div className="flex flex-col md:flex-row gap-3 mb-4 animate-in slide-in-from-top-2 duration-200">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por equipo..."
                  />
                  <div className="w-full md:w-auto">
                    <DateFilter
                      value={dateFilter}
                      onChange={setDateFilter}
                    />
                  </div>
                </div>
              )}

              {/* Live indicator */}
              {liveCount > 0 && (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-medium text-red-500">
                    {liveCount} {liveCount === 1 ? 'partido en vivo' : 'partidos en vivo'}
                  </span>
                </div>
              )}

              {/* Match Grid */}
              <div>
                {loading && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {Array(6).fill(0).map((_, idx) => (
                      <PartidoCardSkeleton key={idx} />
                    ))}
                  </div>
                )}

                {error && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <span className="text-3xl mb-3">❌</span>
                    <h3 className="text-base font-semibold mb-1">No pudimos cargar los partidos</h3>
                    <button
                      onClick={refetch}
                      className="mt-4 px-4 py-2 text-xs font-semibold text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-lg
                                 hover:bg-[#ff6b6b]/20 transition-colors"
                    >
                      Reintentar
                    </button>
                  </div>
                )}

                {!loading && !error && partidosFiltrados.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 px-4">
                    <span className="text-3xl mb-3">{searchQuery || dateFilter ? '🔍' : '⚽'}</span>
                    <h3 className="text-base font-semibold mb-1">
                      {searchQuery || dateFilter ? 'Sin resultados' : 'No hay partidos'}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
                      {searchQuery || dateFilter
                        ? 'Probá cambiando los filtros'
                        : filtroLiga !== 'Todos'
                          ? 'No hay partidos para esta liga'
                          : 'No hay partidos programados'}
                    </p>
                    {(searchQuery || dateFilter) && (
                      <button
                        onClick={() => { setSearchQuery(''); setDateFilter(''); setShowFilters(false) }}
                        className="mt-4 px-4 py-2 text-xs font-semibold text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-lg"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                )}

                {!loading && !error && partidosFiltrados.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {partidosFiltrados.map((partido: Partido) => (
                      <PartidoCard key={partido.id} partido={partido} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* === TABLA TAB === */}
          {activeTab === 'tabla' && (
            <TablaContent ligaExterna={currentLigaName} />
          )}

          {/* === GOLEADORES TAB === */}
          {activeTab === 'goleadores' && (
            <GoleadoresContent ligaExterna={currentLigaName} />
          )}

          {/* === FIXTURES TAB === */}
          {activeTab === 'fixtures' && (
            <FixturesContent ligaExterna={currentLigaName} />
          )}
        </div>

      </main>
      <NavBar />
    </>
  )
}