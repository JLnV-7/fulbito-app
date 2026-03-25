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
import { FixtureTable } from '@/components/FixtureTable'
import { DateScroller } from '@/components/DateScroller'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { TablaContent } from '@/components/TablaContent'
import { GoleadoresContent } from '@/components/GoleadoresContent'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Search, BarChart3, Trophy, Calendar, Globe, Users, Newspaper } from 'lucide-react'
import { PullToRefresh } from '@/components/PullToRefresh'
import { FeedGlobal } from '@/components/feed/FeedGlobal'
import { CommunityHighlights } from '@/components/CommunityHighlights'
import { NewsTab } from '@/components/NewsTab'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LiveMatchesStrip } from '@/components/LiveMatchesStrip'
import { LeagueChips } from '@/components/LeagueChips'
import { HeroHeader } from '@/components/home/HeroHeader'
import { LiveMatchesSticky } from '@/components/home/LiveMatchesSticky'
import { TopRatedMatches } from '@/components/home/TopRatedMatches'
import { hapticFeedback } from '@/lib/helpers'
import { LIGAS, type Liga } from '@/lib/constants'
import type { Partido } from '@/types'

type HomeTab = 'partidos' | 'tabla' | 'goleadores' | 'fixtures' | 'comunidad' | 'noticias'

const TABS: { id: HomeTab; label: string; icon: React.ReactNode }[] = [
  { id: 'partidos', label: 'Partidos', icon: <span className="text-sm">⚽</span> },
  { id: 'comunidad', label: 'Comunidad', icon: <Users size={14} /> },
  { id: 'tabla', label: 'Tabla', icon: <BarChart3 size={14} /> },
  { id: 'goleadores', label: 'Goleadores', icon: <Trophy size={14} /> },
  { id: 'noticias', label: 'Noticias', icon: <Newspaper size={14} /> },
]

function toLocalDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateLabel(date: Date, t: any, localeFormat: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diff === 0) return t('common.today') || 'Hoy'
  if (diff === -1) return t('common.yesterday') || 'Ayer'
  if (diff === 1) return t('common.tomorrow') || 'Mañana'

  return target.toLocaleDateString(localeFormat, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function generateDateRange(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = -7; i <= 7; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function HomeContent() {
  const { user } = useAuth()
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

  const dateRange = useMemo(() => generateDateRange(), [])
  const { partidos, loading, error, refetch } = usePartidos(filtroLiga === 'Favoritos' ? 'Todos' : filtroLiga as Liga)

  useEffect(() => {
    if (user) {
      supabase
        .from('favoritos')
        .select('equipo_nombre')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setFavoritos(data.map((f: any) => f.equipo_nombre))
        })
    }
  }, [user])

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

  const fixtureDisplay = useMemo(() => {
    if (partidosFiltrados.length > 0) {
      return { matches: partidosFiltrados, type: 'exact' as const, nearestDate: undefined }
    }
    if (partidos.length > 0) {
      const futureDates = new Map<string, Partido[]>()
      partidos.forEach(p => {
        const dateStr = p.fecha_inicio?.split('T')[0]
        if (dateStr && dateStr >= selectedDate) {
          const existing = futureDates.get(dateStr) || []
          existing.push(p)
          futureDates.set(dateStr, existing)
        }
      })
      const sortedDates = [...futureDates.keys()].sort()
      for (const date of sortedDates) {
        if (date > selectedDate) {
          return { matches: futureDates.get(date)!, type: 'nearest' as const, nearestDate: date }
        }
      }
      const pastDates = [...new Map(
        partidos.map(p => [p.fecha_inicio?.split('T')[0], p])
      ).keys()].filter(d => d && d < selectedDate).sort().reverse()
      for (const date of pastDates) {
        const pastMatches = partidos.filter(p => p.fecha_inicio?.startsWith(date!))
        if (pastMatches.length > 0) {
          return { matches: pastMatches, type: 'nearest' as const, nearestDate: date }
        }
      }
    }
    return { matches: [], type: 'example' as const, nearestDate: undefined }
  }, [partidosFiltrados, partidos, selectedDate])

  const liveCount = partidos.filter(p => p.estado === 'EN_JUEGO').length
  const livePartidos = partidos.filter(p => p.estado === 'EN_JUEGO')
  const currentLigaName = filtroLiga === 'Todos' || filtroLiga === 'Favoritos' ? undefined : filtroLiga

  return (
    <>
      <DesktopNav />
      <PullToRefresh onRefresh={async () => { await refetch() }}>
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28 md:pt-20">
          <div className="relative z-10">

            {/* Header mobile */}
            <div className="md:hidden px-4 py-3 flex justify-between items-center border-b border-[var(--card-border)] bg-[var(--card-bg)] z-30 sticky top-0">
              <h1 className="text-xl font-black tracking-tighter text-[var(--foreground)]">FutLog</h1>
              <div className="flex items-center gap-1.5">
                <button
                  title="Desafíos"
                  onClick={() => document.dispatchEvent(new CustomEvent('open-challenges'))}
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-all"
                >
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
                  <Link href="/login" className="ml-1 px-2 py-1 text-[10px] font-bold bg-[var(--accent)] text-[var(--background)] rounded uppercase tracking-tight">
                    Ingresar
                  </Link>
                )}
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-2">

              {/* League chips */}
              <div className="sticky top-0 md:top-[68px] z-20 bg-[var(--background)]/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-[var(--card-border)] mb-4">
                <LeagueChips
                  activeLiga={filtroLiga}
                  onSelect={(l) => {
                    hapticFeedback(10)
                    setFiltroLiga(l)
                  }}
                />
              </div>

              {/* Tabs — solo mobile, en desktop usa DesktopNav */}
              <div className="flex md:hidden gap-1 overflow-x-auto no-scrollbar mb-6 -mx-1 px-1">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all
                      ${activeTab === tab.id
                        ? 'bg-[var(--foreground)] text-[var(--background)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.id === 'partidos' && liveCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {!user && activeTab === 'partidos' && (
                <div className="mb-4 p-4 bg-[var(--card-bg)] rounded-2xl border border-dashed border-[var(--card-border)] text-center">
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Ve los resultados en tiempo real. Para participar del Prode y ratear jugadores, creá tu cuenta.
                  </p>
                </div>
              )}

              {/* Contenido por tab */}
              <div className="space-y-10 pb-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="w-full"
                  >
                    {/* TAB: NOTICIAS */}
                    {activeTab === 'noticias' && <NewsTab />}

                    {/* TAB: COMUNIDAD */}
                    {activeTab === 'comunidad' && (
                      <div className="space-y-8">
                        <CommunityHighlights />
                        <div className="pt-4 border-t border-[var(--card-border)]/50">
                          <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-[var(--foreground)] font-black text-xl italic tracking-tighter uppercase">
                              💬 La Tribuna Habla
                            </h2>
                            <Link
                              href="/comunidad"
                              className="text-[10px] font-black text-[var(--accent)] hover:opacity-70 uppercase tracking-widest transition-opacity"
                            >
                              Ver todo →
                            </Link>
                          </div>
                          <FeedGlobal />
                        </div>
                      </div>
                    )}

                    {/* TAB: TABLA */}
                    {activeTab === 'tabla' && (
                      <TablaContent ligaExterna={currentLigaName || 'Liga Profesional'} />
                    )}

                    {/* TAB: GOLEADORES */}
                    {activeTab === 'goleadores' && (
                      <GoleadoresContent ligaExterna={currentLigaName || 'Liga Profesional'} />
                    )}

                    {/* TAB: PARTIDOS (default) */}
                    {(activeTab === 'partidos' || activeTab === 'fixtures') && (
                      <div className="space-y-4">
                        {/* 1. Hero Header */}
                        <HeroHeader />

                        {/* 2. Sticky Live / Hot matches carrousel */}
                        <LiveMatchesSticky liveMatches={livePartidos} upcomingMatches={partidosFiltrados} />

                        {/* 3. Top Rated Matches today */}
                        <div className="px-1 mt-6">
                            <TopRatedMatches />
                        </div>

                        {/* 4. Mini Feed (La Tribuna Habla) inside home */}
                        <div className="mt-8 px-1 pb-10 border-b border-[var(--card-border)]/50">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-[var(--foreground)] font-black text-xl italic tracking-tighter uppercase">
                                    💬 La Tribuna Habla
                                </h2>
                                <Link
                                    href="/comunidad"
                                    className="text-[10px] font-black text-[var(--accent)] hover:opacity-70 uppercase tracking-widest transition-opacity"
                                >
                                    Ver todo →
                                </Link>
                            </div>
                            <FeedGlobal />
                        </div>

                        {/* 5. Classic Fixture underneath */}
                        <section className="mt-8">
                          <div className="flex justify-center mb-6">
                            <h3 className="text-[10px] font-black px-4 py-1.5 rounded-full border border-[var(--card-border)] uppercase tracking-widest text-[var(--text-muted)]">
                                Explorar Fixture
                            </h3>
                          </div>
                          <DateScroller
                            dateRange={dateRange}
                            selectedDate={selectedDate}
                            onSelect={setSelectedDate}
                            localeFormat={localeFormat}
                          />

                          <div className="flex items-center justify-between mb-3 px-1 mt-6">
                            <div className="flex items-center gap-2">
                              <h2 className="text-[12px] font-bold tracking-tight capitalize">
                                Fixture: {filtroLiga === 'Todos' || filtroLiga === 'Favoritos'
                                  ? formatDateLabel(new Date(selectedDate + 'T12:00:00'), t, localeFormat).toUpperCase()
                                  : filtroLiga.toUpperCase()}
                              </h2>
                            </div>
                          </div>

                          {loading ? (
                            <div className="space-y-2">
                              {Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-12 bg-[var(--card-bg)] border border-[var(--card-border)] animate-shimmer" />
                              ))}
                            </div>
                          ) : error ? (
                            <ErrorMessage message="No pudimos cargar los partidos." onRetry={refetch} />
                          ) : (
                            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                              {fixtureDisplay.type === 'nearest' && fixtureDisplay.nearestDate && (
                                <div className="px-4 py-2.5 bg-[var(--accent-green)]/10 border-b border-[var(--card-border)] flex items-center justify-between">
                                  <p className="text-[10px] font-bold text-[var(--accent)] capitalize tracking-tight">
                                    📅 Próximos: {formatDateLabel(new Date(fixtureDisplay.nearestDate + 'T12:00:00'), t, localeFormat)}
                                  </p>
                                  <button
                                    onClick={() => setSelectedDate(fixtureDisplay.nearestDate!)}
                                    className="text-[9px] font-bold text-[var(--accent)] underline capitalize"
                                  >
                                    Ir a esa fecha
                                  </button>
                                </div>
                              )}
                              {fixtureDisplay.type === 'example' && (
                                <div className="px-4 py-2.5 bg-[var(--hover-bg)] border-b border-[var(--card-border)]">
                                  <p className="text-[10px] font-bold text-[var(--text-muted)] text-center">
                                    No hay partidos programados para esta fecha
                                  </p>
                                </div>
                              )}
                              {fixtureDisplay.matches.length > 0
                                ? <FixtureTable partidos={fixtureDisplay.matches} />
                                : (
                                  <div className="p-8 text-center">
                                    <p className="text-[var(--text-muted)] text-sm">Sin partidos para esta fecha</p>
                                  </div>
                                )
                              }
                            </div>
                          )}
                        </section>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
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