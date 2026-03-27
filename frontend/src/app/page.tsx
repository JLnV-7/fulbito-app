// src/app/page.tsx
'use client'
//
// CAMBIOS vs original:
// ✅ ComunidadFeed eliminado — componente definido pero NUNCA renderizado (usaba FeedGlobal en su lugar)
//    Eliminarlo saca useMatchLogs del bundle de la home (hook pesado con 5 queries)
// ✅ Imports muertos eliminados: PartidoCard, Button, Star, ChevronLeft, ChevronRight, Globe, useMatchLogs
// ✅ displayLimit: estado rastreado y reseteado en useEffect pero NUNCA usado para limitar renders
// ✅ showSearch: estado seteado pero nunca usado (la búsqueda hace router.push('/buscar'))
// ✅ classicMode: destructurado de useTheme pero nunca usado
// ✅ TABS array: definido pero nunca renderizado como tabs (el contenido es siempre scroll vertical)
//    Solo 'noticias' condicionalmente muestra NewsTab — el resto siempre se muestra
// ✅ activeTab sync con searchParams: simplificado

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { PublicOnboarding } from '@/components/PublicOnboarding'
import { motion, AnimatePresence } from 'framer-motion'
import { usePartidos } from '@/hooks/usePartidos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { FixtureTable } from '@/components/FixtureTable'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { TablaContent } from '@/components/TablaContent'
import { GoleadoresContent } from '@/components/GoleadoresContent'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Search, BarChart3, Trophy, Calendar, Users, Newspaper, Eye, EyeOff } from 'lucide-react'
import { PullToRefresh } from '@/components/PullToRefresh'
import { FeedGlobal } from '@/components/feed/FeedGlobal'
import type { Partido } from '@/types'
import { LIGAS, type Liga } from '@/lib/constants'
import { hapticFeedback } from '@/lib/helpers'
import { LeagueChips } from '@/components/LeagueChips'
import { CommunityHighlights } from '@/components/CommunityHighlights'
import { NewsTab } from '@/components/NewsTab'
import { ThemeToggle } from '@/components/ThemeToggle'
import { PWAInstallBanner } from '@/components/PWAInstallBanner'
import { useSpoilerMode } from '@/hooks/useSpoilerMode'

// ✅ TABS array eliminado — el contenido es siempre scroll vertical, no hay tab switching real
// Solo 'noticias' es condicional. Si en el futuro querés tabs reales, ese es el momento de re-agregarlo.
type HomeTab = 'partidos' | 'noticias'

// ============================================
// Fallback fixtures (último recurso si la API falla)
// ============================================
const EXAMPLE_FIXTURES: Partido[] = [
  {
    id: 'mock-prev-1', fixture_id: 1001,
    equipo_local: 'Boca Juniors', equipo_visitante: 'River Plate',
    logo_local: 'https://media.api-sports.io/football/teams/451.png',
    logo_visitante: 'https://media.api-sports.io/football/teams/435.png',
    goles_local: 0, goles_visitante: 0,
    fecha_inicio: new Date().toISOString().split('T')[0] + 'T20:00:00',
    estado: 'PREVIA', liga: 'Liga Profesional'
  },
  {
    id: 'mock-prev-2', fixture_id: 1002,
    equipo_local: 'Racing Club', equipo_visitante: 'Independiente',
    logo_local: 'https://media.api-sports.io/football/teams/436.png',
    logo_visitante: 'https://media.api-sports.io/football/teams/438.png',
    goles_local: 0, goles_visitante: 0,
    fecha_inicio: new Date().toISOString().split('T')[0] + 'T18:00:00',
    estado: 'PREVIA', liga: 'Liga Profesional'
  },
  {
    id: 'mock-live-1', fixture_id: 1003,
    equipo_local: 'Real Madrid', equipo_visitante: 'FC Barcelona',
    logo_local: 'https://media.api-sports.io/football/teams/541.png',
    logo_visitante: 'https://media.api-sports.io/football/teams/529.png',
    goles_local: 2, goles_visitante: 1,
    fecha_inicio: new Date().toISOString().split('T')[0] + 'T21:00:00',
    estado: 'EN_JUEGO', liga: 'La Liga'
  },
  {
    id: 'mock-fin-1', fixture_id: 1004,
    equipo_local: 'Man City', equipo_visitante: 'Liverpool',
    logo_local: 'https://media.api-sports.io/football/teams/50.png',
    logo_visitante: 'https://media.api-sports.io/football/teams/40.png',
    goles_local: 3, goles_visitante: 2,
    fecha_inicio: new Date().toISOString().split('T')[0] + 'T13:30:00',
    estado: 'FINALIZADO', liga: 'Premier League'
  },
  {
    id: 'mock-prev-3', fixture_id: 1005,
    equipo_local: 'San Lorenzo', equipo_visitante: 'Huracán',
    logo_local: 'https://media.api-sports.io/football/teams/458.png',
    logo_visitante: 'https://media.api-sports.io/football/teams/440.png',
    goles_local: 0, goles_visitante: 0,
    fecha_inicio: new Date().toISOString().split('T')[0] + 'T15:00:00',
    estado: 'PREVIA', liga: 'Liga Profesional'
  }
] as Partido[]

// ============================================
// Date helpers
// ============================================
function toLocalDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDateLabel(date: Date, t: any, localeFormat: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

  if (diff === 0)  return t('common.today')     || 'Hoy'
  if (diff === -1) return t('common.yesterday') || 'Ayer'
  if (diff === 1)  return t('common.tomorrow')  || 'Mañana'

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

// ============================================
// HomeContent
// ============================================
function HomeContent() {
  const { user }              = useAuth()
  const { t, language }       = useLanguage()
  const localeFormat = language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-AR'
  const router                = useRouter()
  const searchParams          = useSearchParams()

  // ✅ activeTab simplificado: solo 'partidos' | 'noticias'
  const [activeTab, setActiveTab] = useState<HomeTab>(() =>
    searchParams.get('tab') === 'noticias' ? 'noticias' : 'partidos'
  )
  const [filtroLiga, setFiltroLiga]       = useState<Liga | 'Favoritos'>('Todos')
  const [searchQuery, setSearchQuery]     = useState('')
  const [selectedDate, setSelectedDate]   = useState<string>(toLocalDateStr(new Date()))
  const [favoritos, setFavoritos]         = useState<string[]>([])

  const { spoilerMode, toggleSpoilerMode, isRevealed, revealMatch } = useSpoilerMode()

  const dateRange = useMemo(() => generateDateRange(), [])

  const { partidos, loading, error, refetch } = usePartidos(
    filtroLiga === 'Favoritos' ? 'Todos' : filtroLiga as Liga
  )

  // Cargar favoritos del usuario
  useEffect(() => {
    if (!user) return
    supabase
      .from('favoritos')
      .select('equipo_nombre')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setFavoritos(data.map(f => f.equipo_nombre))
      })
  }, [user])

  // Sync tab con URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    setActiveTab(tab === 'noticias' ? 'noticias' : 'partidos')
  }, [searchParams])

  const handleTabChange = (tab: HomeTab) => {
    setActiveTab(tab)
    window.history.replaceState(null, '', tab === 'partidos' ? '/' : `/?tab=${tab}`)
  }

  // Partidos filtrados
  const partidosFiltrados = useMemo(() => {
    return partidos.filter(partido => {
      const matchesSearch = !searchQuery || (
        partido?.equipo_local?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
        partido?.equipo_visitante?.toLowerCase()?.includes(searchQuery.toLowerCase())
      )
      const matchesDate       = !selectedDate || partido?.fecha_inicio?.startsWith(selectedDate)
      const matchesFavorites  = filtroLiga !== 'Favoritos' || (
        favoritos.includes(partido?.equipo_local || '') ||
        favoritos.includes(partido?.equipo_visitante || '')
      )
      return matchesSearch && matchesDate && matchesFavorites
    })
  }, [partidos, searchQuery, selectedDate, filtroLiga, favoritos])

  // Smart fallback: si no hay partidos en la fecha seleccionada, mostrar la más cercana
  const fixtureDisplay = useMemo(() => {
    if (partidosFiltrados.length > 0) {
      return { matches: partidosFiltrados, type: 'exact' as const, nearestDate: undefined }
    }

    if (partidos.length > 0) {
      const futureDates = new Map<string, Partido[]>()
      partidos.forEach(p => {
        const dateStr = p.fecha_inicio?.split('T')[0]
        if (dateStr && dateStr >= selectedDate) {
          futureDates.set(dateStr, [...(futureDates.get(dateStr) || []), p])
        }
      })

      const sortedFuture = [...futureDates.keys()].sort()
      for (const date of sortedFuture) {
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

    return { matches: EXAMPLE_FIXTURES, type: 'example' as const, nearestDate: undefined }
  }, [partidosFiltrados, partidos, selectedDate])

  const liveCount        = partidos.filter(p => p.estado === 'EN_JUEGO').length
  const currentLigaName  = filtroLiga === 'Todos' || filtroLiga === 'Favoritos' ? undefined : filtroLiga

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
                  title={spoilerMode ? 'Mostrar resultados' : 'Ocultar resultados'}
                  onClick={() => { hapticFeedback(10); toggleSpoilerMode() }}
                  className={`p-1.5 rounded-md transition-all ${spoilerMode ? 'text-[var(--accent)] bg-[var(--accent)]/10' : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'}`}
                >
                  {spoilerMode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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

            {/* Banner de instalación PWA — aparece solo si no está instalada */}
            <PWAInstallBanner />

            <div className="max-w-4xl mx-auto px-4 mt-2">

              {/* League chips */}
              <div className="sticky top-0 md:top-[68px] z-20 bg-[var(--background)]/95 backdrop-blur-sm py-3 -mx-4 px-4 border-b border-[var(--card-border)] mb-4">
                <LeagueChips
                  activeLiga={filtroLiga}
                  onSelect={(l) => { hapticFeedback(10); setFiltroLiga(l) }}
                />
              </div>

              {/* CTA no logueados */}
              {!user && (
                <div className="mb-4 p-4 bg-[var(--card-bg)] rounded-2xl border border-dashed border-[var(--card-border)] text-center">
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    Ve los resultados en tiempo real. Para participar del Prode y ratear jugadores, creá tu cuenta.
                  </p>
                </div>
              )}

              {/* Tab switcher: Partidos / Noticias */}
              <div className="flex gap-2 mb-5">
                {(['partidos', 'noticias'] as HomeTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { hapticFeedback(5); handleTabChange(tab) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                      ${activeTab === tab
                        ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)] hover:border-[var(--card-border-hover)]'
                      }`}
                  >
                    {tab === 'partidos' ? <><span>⚽</span> Partidos</> : <><Newspaper size={12} /> Noticias</>}
                  </button>
                ))}
              </div>

              {activeTab === 'noticias' ? (
                <NewsTab />
              ) : (
                <div className="space-y-12 pb-10">

                  {/* Date scroller */}
                  <div className="flex items-center gap-1.5 mb-5 overflow-x-auto no-scrollbar py-1">
                    {dateRange.map((date) => {
                      const dateStr  = toLocalDateStr(date)
                      const label    = formatDateLabel(date, t, localeFormat)
                      const isSelected = dateStr === selectedDate
                      const isToday  = dateStr === toLocalDateStr(new Date())
                      const isSpecialLabel = ['Hoy', 'Ayer', 'Mañana',
                        t('common.today'), t('common.yesterday'), t('common.tomorrow')
                      ].includes(label)
                      return (
                        <button
                          key={dateStr}
                          onClick={() => { hapticFeedback(5); setSelectedDate(dateStr) }}
                          className={`flex flex-col items-center justify-center min-w-[3.5rem] py-1.5 px-2 rounded-xl border transition-all
                            ${isSelected
                              ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] shadow-md'
                              : isToday
                                ? 'bg-[var(--card-bg)] border-[var(--accent)]/50 text-[var(--foreground)]'
                                : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--card-border-hover)]'
                            }`}
                        >
                          <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                            {isSpecialLabel ? ' ' : new Date(dateStr + 'T12:00:00').toLocaleDateString(localeFormat, { weekday: 'short' })}
                          </span>
                          <span className={`text-sm font-black tracking-tighter mt-0.5 ${isSelected ? 'text-[var(--background)]' : ''}`}>
                            {isSpecialLabel ? label : new Date(dateStr + 'T12:00:00').getDate()}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 1. Fixture */}
                  <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize">
                          Fixture: {filtroLiga === 'Todos' || filtroLiga === 'Favoritos'
                            ? formatDateLabel(new Date(selectedDate + 'T12:00:00'), t, localeFormat).toUpperCase()
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
                        {Array(4).fill(0).map((_, i) => (
                          <div key={i} className="h-12 bg-[var(--card-bg)] border border-[var(--card-border)] animate-shimmer" />
                        ))}
                      </div>
                    ) : error ? (
                      <ErrorMessage message="No pudimos cargar los partidos. Intentá de nuevo." onRetry={refetch} />
                    ) : (
                      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl overflow-hidden shadow-sm">
                        {fixtureDisplay.type === 'nearest' && fixtureDisplay.nearestDate && (
                          <div className="px-4 py-2.5 bg-[var(--accent-green)]/10 border-b border-[var(--card-border)] flex items-center justify-between">
                            <p className="text-[10px] font-bold text-[var(--accent)] capitalize tracking-tight">
                              📅 Próximos partidos: {formatDateLabel(new Date(fixtureDisplay.nearestDate + 'T12:00:00'), t, localeFormat)}
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
                            <p className="text-[10px] font-bold text-[var(--text-muted)] capitalize tracking-tight text-center">
                              No hay partidos próximos programados · Mostrando clásicos destacados
                            </p>
                          </div>
                        )}
                        <FixtureTable
                          partidos={fixtureDisplay.matches}
                          spoilerMode={spoilerMode}
                          isRevealed={isRevealed}
                          onReveal={revealMatch}
                        />
                      </div>
                    )}
                  </section>

                  {/* 2. Tabla de posiciones */}
                  <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize">
                        Tabla de Posiciones: {currentLigaName || 'Argentina LPF'}
                      </h2>
                    </div>
                    <TablaContent ligaExterna={currentLigaName || 'Liga Profesional'} />
                  </section>

                  {/* 3. Goleadores */}
                  <section>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] capitalize">
                        Goleadores: {currentLigaName || 'Argentina LPF'}
                      </h2>
                    </div>
                    <GoleadoresContent ligaExterna={currentLigaName || 'Liga Profesional'} />
                  </section>

                  {/* 4. Community highlights */}
                  <section className="pt-6 border-t border-[var(--card-border)]">
                    <CommunityHighlights />
                  </section>

                  {/* 5. La Tribuna Habla */}
                  <section className="pt-8 border-t border-[var(--card-border)]/50">
                    <div className="flex items-center justify-between mb-6 px-1">
                      <h2 className="text-[var(--foreground)] font-black text-xl italic tracking-tighter uppercase">
                        💬 LA TRIBUNA HABLA
                      </h2>
                      <Link href="/comunidad" className="text-[10px] font-black text-[var(--accent)] hover:opacity-70 uppercase tracking-widest transition-opacity">
                        Ver muro →
                      </Link>
                    </div>
                    <FeedGlobal />
                  </section>

                </div>
              )}

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
