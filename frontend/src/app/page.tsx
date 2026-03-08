// src/app/page.tsx
'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePartidos } from '@/hooks/usePartidos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PartidoCard } from '@/components/PartidoCard'
import { SearchBar } from '@/components/SearchBar'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { ReglasPuntajeModal } from '@/components/ReglasPuntajeModal'
import { TablaContent } from '@/components/TablaContent'
import { GoleadoresContent } from '@/components/GoleadoresContent'
import { FixturesContent } from '@/components/FixturesContent'
import { Star, Search, ChevronLeft, ChevronRight, BarChart3, Trophy, Calendar, Globe } from 'lucide-react'
import { OnboardingCarousel } from '@/components/OnboardingCarousel'
import { TrendingMatchWidget } from '@/components/TrendingMatchWidget'
import { PullToRefresh } from '@/components/PullToRefresh'
import { NewsFeed } from '@/components/NewsFeed'
import { DailyContestWidget } from '@/components/DailyContestWidget'
import { ProgresoHoyWidget } from '@/components/ProgresoHoyWidget'
import type { Partido } from '@/types'

import { LIGAS, type Liga } from '@/lib/constants'

type HomeTab = 'partidos' | 'tabla' | 'goleadores' | 'fixtures'

const TABS: { id: HomeTab; label: string; icon: React.ReactNode }[] = [
  { id: 'partidos', label: 'Partidos', icon: <span className="text-sm">⚽</span> },
  { id: 'tabla', label: 'Tabla', icon: <BarChart3 size={14} /> },
  { id: 'goleadores', label: 'Goleadores', icon: <Trophy size={14} /> },
  { id: 'fixtures', label: 'Fixtures', icon: <Calendar size={14} /> },
]

// ============================================
// Date helpers
// ============================================
function toLocalDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateLabel(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diff === 0) return 'Hoy'
  if (diff === -1) return 'Ayer'
  if (diff === 1) return 'Mañana'

  return target.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function generateDateRange(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // -7 days to +7 days
  for (let i = -7; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

// ============================================
// Component
// ============================================
function HomeContent() {
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
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateStr(new Date()))
  const [favoritos, setFavoritos] = useState<string[]>([])
  const [showSearch, setShowSearch] = useState(false)

  const dateRange = useMemo(() => generateDateRange(), [])

  // Usamos 'Todos' cuando el filtro es 'Favoritos' para traer todo y filtrar en cliente
  const { partidos, loading, error, refetch } = usePartidos(filtroLiga === 'Favoritos' ? 'Todos' : filtroLiga as Liga)

  // Cargar favoritos
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
    const url = tab === 'partidos' ? '/' : `/?tab=${tab}`
    window.history.replaceState(null, '', url)
  }

  // Filter partidos
  const partidosFiltrados = useMemo(() => {
    return partidos.filter(partido => {
      const matchesSearch = !searchQuery || (
        partido?.equipo_local?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        partido?.equipo_visitante?.toLowerCase()?.includes(searchQuery.toLowerCase())
      )
      const matchesDate = !selectedDate || partido?.fecha_inicio?.startsWith(selectedDate)
      const matchesFavorites = filtroLiga !== 'Favoritos' || (
        favoritos.includes(partido?.equipo_local || '') ||
        favoritos.includes(partido?.equipo_visitante || '')
      )
      return matchesSearch && matchesDate && matchesFavorites
    })
  }, [partidos, searchQuery, selectedDate, filtroLiga, favoritos])

  const liveCount = partidos.filter(p => p.estado === 'EN_JUEGO').length

  const currentLigaName = filtroLiga === 'Todos' || filtroLiga === 'Favoritos'
    ? undefined
    : filtroLiga

  // Date nav helpers
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00')
    current.setDate(current.getDate() + days)
    setSelectedDate(toLocalDateStr(current))
  }

  return (
    <>
      <DesktopNav />
      <PullToRefresh onRefresh={async () => { await refetch() }}>
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28 md:pt-20">
          {/* Header Mobile */}
          <div className="px-4 pt-6 pb-2 flex justify-between items-center md:hidden">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-[var(--accent)] to-[var(--accent-yellow)] bg-clip-text text-transparent">FutLog</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/buscar')}
                className="p-1.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              >
                <Search size={18} />
              </button>
              <ReglasPuntajeModal />
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 mt-2">

            {/* Hero Banner CTA / Onboarding */}
            {!user && <OnboardingCarousel />}

            {/* Quick Progress Dashboard */}
            {user && (
              <div className="mb-4">
                <ProgresoHoyWidget />
              </div>
            )}

            {/* Trending Match Premium Widget */}
            <div className="mb-4">
              <TrendingMatchWidget />
            </div>

            {/* News Feed */}
            <div className="mb-4">
              <NewsFeed userTeams={favoritos} />
            </div>

            {/* Daily Contests */}
            <div className="mb-6">
              <DailyContestWidget />
            </div>

            {/* Section Tabs Premium */}
            <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-none min-w-[100px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all border
                  ${activeTab === tab.id
                      ? 'bg-[#00A651] text-white border-[#00A651] shadow-md shadow-[#00A651]/20'
                      : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)] hover:bg-[var(--hover-bg)]'
                    }`}
                >
                  <div className={`${activeTab === tab.id ? 'text-white' : 'text-[var(--text-muted)]'} transition-colors`}>
                    {tab.icon}
                  </div>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* === PARTIDOS TAB === */}
            {activeTab === 'partidos' && (
              <>
                {/* Date Navigation — Promiedos-style */}
                <div className="flex items-center gap-1 mb-3 bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-1">
                  <button
                    onClick={() => shiftDate(-1)}
                    className="p-1.5 rounded-lg hover:bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex gap-1 overflow-x-auto no-scrollbar flex-1">
                    {dateRange.map((date) => {
                      const dateStr = toLocalDateStr(date)
                      const isSelected = dateStr === selectedDate
                      const isToday = dateStr === toLocalDateStr(new Date())
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap min-w-fit
                          ${isSelected
                              ? 'bg-[#10b981] text-white shadow-sm'
                              : isToday
                                ? 'bg-[#10b981]/10 text-[#10b981]'
                                : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                        >
                          {formatDateLabel(date)}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => shiftDate(1)}
                    className="p-1.5 rounded-lg hover:bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* League Filters + Search */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 pb-1">
                    <button
                      onClick={() => setFiltroLiga('Todos')}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border
                      ${filtroLiga === 'Todos'
                          ? 'bg-[var(--accent-green)] text-white border-[var(--accent-green)] shadow-md shadow-[var(--accent-green)]/20'
                          : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]'
                        }`}
                    >
                      <Globe size={12} />
                      Todos
                    </button>
                    {LIGAS.filter(l => l !== 'Todos').map((liga) => (
                      <button
                        key={liga}
                        onClick={() => setFiltroLiga(liga)}
                        className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border
                        ${filtroLiga === liga
                            ? 'bg-[var(--accent-green)] text-white border-[var(--accent-green)] shadow-md shadow-[var(--accent-green)]/20'
                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]'
                          }`}
                      >
                        <Trophy size={12} className={filtroLiga === liga ? 'text-white' : 'text-[var(--accent-yellow)]'} />
                        {liga}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        if (!user) { router.push('/login'); return }
                        setFiltroLiga('Favoritos')
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border
                      ${filtroLiga === 'Favoritos'
                          ? 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] border-[var(--accent-yellow)]/40'
                          : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--accent-yellow)] border-[var(--card-border)]'
                        }`}
                    >
                      <Star size={12} fill={filtroLiga === 'Favoritos' ? 'currentColor' : 'none'} className={filtroLiga === 'Favoritos' ? "text-[var(--accent-yellow)]" : ""} />
                      Mis Equipos
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSearch(!showSearch)}
                    className={`p-1.5 rounded-lg border transition-all flex-shrink-0 ${showSearch || searchQuery
                      ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]'
                      : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'
                      }`}
                  >
                    <Search size={14} />
                  </button>
                </div>

                {/* Search (collapsible) */}
                {showSearch && (
                  <div className="mb-3">
                    <SearchBar
                      value={searchQuery}
                      onChange={setSearchQuery}
                      placeholder="Buscar equipo..."
                    />
                  </div>
                )}

                {/* Live indicator (Ya no es necesario arriba porque está en el Hero, pero lo dejamos sutil si hay búsqueda activa) */}
                {liveCount > 0 && searchQuery && (
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">Buscando...</span>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
                      </span>
                      <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wide">
                        {liveCount} en vivo
                      </span>
                    </div>
                  </div>
                )}

                {/* Match Grid */}
                <div>
                  {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Array(6).fill(0).map((_, idx) => (
                        <PartidoCardSkeleton key={idx} />
                      ))}
                    </div>
                  )}

                  {error && !loading && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <span className="text-3xl mb-3">❌</span>
                      <h3 className="text-sm font-semibold mb-1">No pudimos cargar los partidos</h3>
                      <button
                        onClick={refetch}
                        className="mt-3 px-4 py-2 text-xs font-semibold text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-lg hover:bg-[#ff6b6b]/20 transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  )}

                  {!loading && !error && partidosFiltrados.length === 0 && (
                    <div className="relative mb-8 rounded-3xl overflow-hidden border border-[var(--card-border)]/50 bg-[var(--card-bg)]/30">
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent z-10" />

                      {/* Mock Blurred Match Background */}
                      <div className="opacity-20 blur-sm pointer-events-none p-4 pb-12">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs font-bold text-[#ff6b6b]">PREVIA</span>
                          <span className="text-xs font-bold text-[var(--text-muted)]">Liga Profesional</span>
                        </div>
                        <div className="flex justify-between items-center bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--card-border)]">
                          <span className="font-bold">River Plate</span>
                          <span className="text-[10px] font-black text-[var(--text-muted)]">VS</span>
                          <span className="font-bold">Boca Juniors</span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                          <div className="h-4 bg-[var(--card-border)] rounded-full w-full"></div>
                          <div className="h-4 bg-[var(--card-border)] rounded-full w-2/3"></div>
                        </div>
                      </div>

                      {/* Glassmorphism Teaser Overlay */}
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center py-6 px-4 bg-[var(--background)]/60 backdrop-blur-md">
                        <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center mb-4 border border-[var(--accent-green)]/30 shadow-[0_0_20px_rgba(0,166,81,0.2)]">
                          {searchQuery ? (
                            <Search size={28} className="text-[var(--accent-green)]" />
                          ) : filtroLiga === 'Favoritos' ? (
                            <Star size={28} className="text-[var(--accent-yellow)]" />
                          ) : (
                            <span className="text-3xl filter drop-shadow-md">⚽</span>
                          )}
                        </div>

                        <h3 className="text-lg font-black mb-1 bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)] bg-clip-text text-transparent">
                          {searchQuery
                            ? 'Sin resultados'
                            : filtroLiga === 'Favoritos'
                              ? 'Tus equipos descansan hoy'
                              : 'No hay partidos programados'}
                        </h3>

                        <p className="text-[var(--text-muted)] text-sm max-w-[280px] text-center mb-5 font-medium leading-relaxed">
                          {searchQuery
                            ? `No encontramos "${searchQuery}". Probá con otro equipo.`
                            : filtroLiga === 'Favoritos'
                              ? 'Añadí equipos a tus favoritos haciendo click en la estrella.'
                              : `No hay encuentros de ${filtroLiga} para esta fecha.`}
                        </p>

                        {!user && !searchQuery && filtroLiga !== 'Favoritos' && (
                          <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-2.5 rounded-full bg-[var(--accent-green)] text-white font-bold text-sm shadow-[0_4px_14px_rgba(0,166,81,0.4)] hover:-translate-y-0.5 transition-all"
                          >
                            Iniciá sesión para ver más
                          </button>
                        )}

                        {(searchQuery || filtroLiga !== 'Todos') && (
                          <button
                            onClick={() => { setSearchQuery(''); setFiltroLiga('Todos'); setShowSearch(false); }}
                            className="mt-3 px-5 py-2.5 text-xs font-bold text-white bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] transition-all"
                          >
                            Ver todos los partidos
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {!loading && !error && partidosFiltrados.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[11px] text-[var(--text-muted)] font-medium">
                          {partidosFiltrados.length} {partidosFiltrados.length === 1 ? 'partido' : 'partidos'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {partidosFiltrados.map((partido: Partido) => (
                          <PartidoCard key={partido.id} partido={partido} />
                        ))}
                      </div>
                    </>
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
      </PullToRefresh>
      <NavBar />
    </>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] p-4 flex flex-col gap-4 pt-24 max-w-5xl mx-auto">
        {Array(4).fill(0).map((_, i) => <PartidoCardSkeleton key={i} />)}
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}