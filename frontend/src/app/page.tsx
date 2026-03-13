// src/app/page.tsx
'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { PublicOnboarding } from '@/components/PublicOnboarding'
import { motion, AnimatePresence } from 'framer-motion'
import { usePartidos } from '@/hooks/usePartidos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { PartidoCard } from '@/components/PartidoCard'
import { FixtureTable } from '@/components/FixtureTable'
import { SearchBar } from '@/components/SearchBar'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { ReglasPuntajeModal } from '@/components/ReglasPuntajeModal'
import { TablaContent } from '@/components/TablaContent'
import { GoleadoresContent } from '@/components/GoleadoresContent'
import { FixturesContent } from '@/components/FixturesContent'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Star, Search, ChevronLeft, ChevronRight, BarChart3, Trophy, Calendar, Globe, Users, Newspaper } from 'lucide-react'
import { PullToRefresh } from '@/components/PullToRefresh'
import { FeedGlobal } from '@/components/feed/FeedGlobal'
import type { Partido } from '@/types'
import { LIGAS, type Liga } from '@/lib/constants'
import { hapticFeedback } from '@/lib/helpers'
import { LeagueChips } from '@/components/LeagueChips'
import { MatchLogCard } from '@/components/MatchLogCard'
import { useMatchLogs } from '@/hooks/useMatchLogs'
import { Button } from '@/components/ui/Button'
import { CommunityHighlights } from '@/components/CommunityHighlights'
import { NewsTab } from '@/components/NewsTab'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LiveMatchesStrip } from '@/components/LiveMatchesStrip'

type HomeTab = 'partidos' | 'tabla' | 'goleadores' | 'fixtures' | 'comunidad' | 'noticias'

const TABS: { id: HomeTab; label: string; icon: React.ReactNode }[] = [
  { id: 'partidos', label: 'Partidos', icon: <span className="text-sm">⚽</span> },
  { id: 'comunidad', label: 'Comunidad', icon: <Users size={14} /> },
  { id: 'tabla', label: 'Tabla', icon: <BarChart3 size={14} /> },
  { id: 'goleadores', label: 'Goleadores', icon: <Trophy size={14} /> },
  { id: 'fixtures', label: 'Fixtures', icon: <Calendar size={14} /> },
  { id: 'noticias', label: 'Noticias', icon: <Newspaper size={14} /> },
]


// ============================================
// Date helpers
// ============================================
function toLocalDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateLabel(date: Date, t: any, localeFormat: string): { label: string; weekday?: string; day?: number; isRelative: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

  const weekday = target.toLocaleDateString(localeFormat, { weekday: 'short' })
  const day = target.getDate()

  if (diff === 0) return { label: t('common.today') || 'Hoy', isRelative: true, weekday, day }
  if (diff === -1) return { label: t('common.yesterday') || 'Ayer', isRelative: true, weekday, day }
  if (diff === 1) return { label: t('common.tomorrow') || 'Mañana', isRelative: true, weekday, day }

  return {
    label: target.toLocaleDateString(localeFormat, {
      day: 'numeric',
      month: 'short',
    }),
    weekday,
    day,
    isRelative: false
  }
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
  const { classicMode } = useTheme()
  const { t, language } = useLanguage()
  const localeFormat = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-AR'
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<HomeTab>(() => {
    const tab = searchParams.get('tab')
    if (tab && ['partidos', 'tabla', 'goleadores', 'fixtures', 'comunidad', 'noticias'].includes(tab)) {
      return tab as HomeTab
    }
    return 'partidos'
  })
  const [filtroLiga, setFiltroLiga] = useState<Liga | 'Favoritos'>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateStr(new Date()))
  const [favoritos, setFavoritos] = useState<string[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [displayLimit, setDisplayLimit] = useState(24)

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
    if (tab && ['partidos', 'tabla', 'goleadores', 'fixtures', 'comunidad', 'noticias'].includes(tab)) {
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

  // Smart fallback: find nearest date with matches
  const fixtureDisplay = useMemo(() => {
    // Tier 1: matches for selected date exist
    if (partidosFiltrados.length > 0) {
      return { matches: partidosFiltrados, type: 'exact' as const, nearestDate: undefined }
    }

    // Tier 2: find nearest future date with real matches
    if (partidos.length > 0) {
      const today = new Date(selectedDate + 'T12:00:00')
      const futureDates = new Map<string, Partido[]>()

      partidos.forEach(p => {
        const dateStr = p.fecha_inicio?.split('T')[0]
        if (dateStr && dateStr >= selectedDate) {
          const existing = futureDates.get(dateStr) || []
          existing.push(p)
          futureDates.set(dateStr, existing)
        }
      })

      // Find first date after selected that has matches
      const sortedDates = [...futureDates.keys()].sort()
      for (const date of sortedDates) {
        if (date > selectedDate) {
          const nearestMatches = futureDates.get(date)!
          return {
            matches: nearestMatches,
            type: 'nearest' as const,
            nearestDate: date
          }
        }
      }

      // Also check past dates (nearest before selected)
      const pastDates = [...new Map(
        partidos.map(p => [p.fecha_inicio?.split('T')[0], p])
      ).keys()].filter(d => d && d < selectedDate).sort().reverse()

      for (const date of pastDates) {
        const pastMatches = partidos.filter(p => p.fecha_inicio?.startsWith(date!))
        if (pastMatches.length > 0) {
          return {
            matches: pastMatches,
            type: 'nearest' as const,
            nearestDate: date
          }
        }
      }
    }

    // Tier 3: no hay partidos
    return { matches: [], type: 'example' as const, nearestDate: undefined }
  }, [partidosFiltrados, partidos, selectedDate])

  // Reset display limit when filters change
  useEffect(() => {
    setDisplayLimit(24)
  }, [searchQuery, selectedDate, filtroLiga])

  const partidosEnVivo = useMemo(() => partidos.filter(p => p.estado === 'EN_JUEGO'), [partidos])
  const liveCount = partidosEnVivo.length

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
          <div className="relative z-10">
            {/* Simple Fixed Branding Header - mobile only (DesktopNav handles desktop) */}
            <div className="md:hidden px-4 py-3 flex justify-between items-center border-b border-[var(--card-border)] bg-[var(--card-bg)] z-30 sticky top-0">
              <h1 className="text-xl font-black tracking-tighter text-[var(--foreground)]">FutLog</h1>
              <div className="flex items-center gap-1.5">
                {/* Desafíos & Feedback Actions */}
                <button title="Desafíos" onClick={() => document.dispatchEvent(new CustomEvent('open-challenges'))} className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-all">
                    <Trophy size={16} />
                </button>
                <div className="w-px h-4 bg-[var(--card-border)] mx-0.5" />
                <button
                  onClick={() => router.push('/buscar')}
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]"
                >
                  <Search size={16} />
                </button>
                <ThemeToggle compact />
                {!user && (
                  <Link href="/login" className="ml-1 px-2 py-1 text-[10px] font-bold bg-[var(--accent)] text-[var(--background)] rounded uppercase tracking-tight">Ingresar</Link>
                )}
              </div>
            </div>
            <div className="max-w-4xl mx-auto px-4 mt-2">
              {/* Sección "En vivo ahora" */}
              {activeTab === 'partidos' && (
                <LiveMatchesStrip partidos={partidosEnVivo} />
              )}

              {/* Categorías de Ligas (Promiedos Style) */}
              <div className="sticky top-0 md:top-[68px] z-20 bg-[var(--background)]/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-[var(--card-border)] mb-4">
                <LeagueChips
                  activeLiga={filtroLiga}
                  onSelect={(l) => {
                    hapticFeedback(10)
                    setFiltroLiga(l)
                  }}
                />
              </div>

              {!user && activeTab === 'partidos' && (
                <div className="mb-4 p-4 bg-[var(--card-bg)] rounded-2xl border border-dashed border-[var(--card-border)] text-center">
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Ve los resultados en tiempo real. Para participar del Prode y ratear jugadores, creá tu cuenta.
                  </p>
                </div>
              )}

              {/* Date Navigation — Promiedos-style (Horizontal Scroll) */}
              {activeTab === 'partidos' && (
                <div className="flex items-center gap-1.5 mb-5 overflow-x-auto no-scrollbar py-1">
                  {dateRange.map((date) => {
                    const dateStr = toLocalDateStr(date)
                    const dateInfo = formatDateLabel(date, t, localeFormat)
                    const label = dateInfo.label
                    const isSelected = dateStr === selectedDate
                    const isToday = dateStr === toLocalDateStr(new Date())
                    return (
                      <button
                        key={dateStr}
                        onClick={() => {
                          hapticFeedback(5)
                          setSelectedDate(dateStr)
                        }}
                        className={`flex flex-col items-center justify-center min-w-[3.5rem] py-1.5 px-2 rounded-xl border transition-all ${isSelected
                            ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-md'
                            : isToday
                              ? 'bg-[var(--card-bg)] border-[var(--accent)]/50 text-[var(--foreground)]'
                              : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--card-border-hover)]'
                          }`}
                      >
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                          {dateInfo.isRelative ? ' ' : dateInfo.weekday}
                        </span>
                        <span className={`text-sm font-black tracking-tighter mt-0.5 ${isSelected ? 'text-[var(--background)]' : ''}`}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* MATCH GRID / SEQUENTIAL CONTENT */}
              <div className="space-y-12 pb-10">
                {activeTab === 'noticias' ? (
                  <NewsTab />
                ) : activeTab === 'comunidad' ? (
                  <div className="space-y-8">
                    <CommunityHighlights />
                    <div className="pt-4 border-t border-[var(--card-border)]/50">
                      <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-[var(--foreground)] font-black text-xl italic tracking-tighter uppercase">
                          💬 LA TRIBUNA HABLA
                        </h2>
                        <Link href="/comunidad" className="text-[10px] font-black text-[var(--accent)] hover:opacity-70 uppercase tracking-widest transition-opacity">
                          Ver todo →
                        </Link>
                      </div>
                      <FeedGlobal />
                    </div>
                  </div>
                ) : activeTab === 'tabla' ? (
                  <TablaContent ligaExterna={currentLigaName || 'Liga Profesional'} />
                ) : activeTab === 'goleadores' ? (
                  <GoleadoresContent ligaExterna={currentLigaName || 'Liga Profesional'} />
                ) : activeTab === 'fixtures' ? (
                  <FixturesContent />
                ) : (
                  <>
                    {/* LIVE STRIP */}
                    <LiveMatchesStrip partidos={partidos.filter(p => p.estado === 'EN_JUEGO')} />

                    {/* 1. SECTION: FIXTURE (Partidos Tab) */}
                    <section>
                      <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize">
                            Fixture: {filtroLiga === 'Todos' || filtroLiga === 'Favoritos'
                              ? formatDateLabel(new Date(selectedDate + 'T12:00:00'), t, localeFormat).label.toUpperCase()
                              : filtroLiga.toUpperCase()}
                          </h2>
                          {liveCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[8px] font-black animate-pulse flex items-center gap-1">
                              {liveCount} VIVO
                            </span>
                          )}
                        </div>
                      </div>

                      {loading ? (
                        <div className="space-y-2">
                          {Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-[var(--card-bg)] border border-[var(--card-border)] animate-shimmer" />)}
                        </div>
                      ) : error ? (
                        <ErrorMessage 
                            message="No pudimos cargar los partidos. Intentá de nuevo." 
                            onRetry={refetch} 
                        />
                      ) : (
                        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                          {/* Disclaimer banners */}
                          {fixtureDisplay.type === 'nearest' && fixtureDisplay.nearestDate && (
                            <div className="px-4 py-2.5 bg-[var(--accent-green)]/10 border-b border-[var(--card-border)] flex items-center justify-between">
                              <p className="text-[10px] font-bold text-[var(--accent)] capitalize tracking-tight">
                                📅 Próximos partidos: {formatDateLabel(new Date(fixtureDisplay.nearestDate + 'T12:00:00'), t, localeFormat).label}
                              </p>
                              <button
                                onClick={() => setSelectedDate(fixtureDisplay.nearestDate!)}
                                className="text-[9px] font-bold text-[var(--accent)] underline capitalize"
                              >
                                Ir a esa fecha
                              </button>
                            </div>
                          )}
                          <FixtureTable partidos={fixtureDisplay.matches} />
                        </div>
                      )}
                      {fixtureDisplay.type === 'example' && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-[var(--text-muted)] text-sm font-bold">
                                No hay partidos programados para esta fecha.
                            </p>
                        </div>
                      )}
                    </section>

                    {/* 2. SECTION: POSITIONS (Desktop Only) */}
                    <section className="hidden md:block pt-12 border-t border-[var(--card-border)]/50">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[var(--foreground)] font-black text-xl italic tracking-tighter uppercase flex items-center gap-2">
                                <BarChart3 size={20} className="text-[var(--accent)]" />
                                Tabla de Posiciones
                            </h2>
                            <Link href="/posiciones" className="text-[10px] font-black text-[var(--accent)] hover:opacity-70 uppercase tracking-widest transition-opacity">Ver completa →</Link>
                        </div>
                        <TablaContent compact ligaExterna={currentLigaName || 'Liga Profesional'} />
                    </section>

                    {/* 3. SECTION: TOP SCORERS (Desktop Only) */}
                    <section className="hidden md:block pt-12 border-t border-[var(--card-border)]/50">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[var(--foreground)] font-black text-xl italic tracking-tighter uppercase flex items-center gap-2">
                                <Trophy size={20} className="text-[var(--accent)]" />
                                Goleadores
                            </h2>
                            <Link href="/goleadores" className="text-[10px] font-black text-[var(--accent)] hover:opacity-70 uppercase tracking-widest transition-opacity">Ver todos →</Link>
                        </div>
                        <GoleadoresContent compact ligaExterna={currentLigaName || 'Liga Profesional'} />
                    </section>
                  </>
                )}
              </div>
            </div>

          </div>

        </main>
      </PullToRefresh>
      <NavBar />
      {!user && <PublicOnboarding />}
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