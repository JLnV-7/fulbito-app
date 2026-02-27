// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePartidos } from '@/hooks/usePartidos'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PartidoCard } from '@/components/PartidoCard'
import { SearchBar } from '@/components/SearchBar'
import { DateFilter } from '@/components/DateFilter'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import { ReglasPuntajeModal } from '@/components/ReglasPuntajeModal'
import { Hand, MessageCircle, Star, Search, CalendarDays, Film } from 'lucide-react'
import type { Partido } from '@/types'

import { LIGAS, type Liga } from '@/lib/constants'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
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

  if (loading) {
    return (
      <>
        <DesktopNav />
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
          <div className="px-4 py-5 md:py-4">
            <h1 className="text-xl font-bold tracking-tight md:hidden">Fulbito</h1>
          </div>
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array(6).fill(0).map((_, idx) => (
                <PartidoCardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </main>
        <NavBar />
      </>
    )
  }

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
        {/* Header Mobile */}
        <div className="px-4 py-4 flex justify-between items-center md:hidden">
          <h1 className="text-xl font-bold tracking-tight">Fulbito</h1>
          <div className="flex items-center gap-2">
            <ReglasPuntajeModal />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4">

          {/* Quick Actions - inline compact */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => router.push('/votar')}
              className="flex items-center gap-2 px-3.5 py-2 bg-[var(--card-bg)] border border-[var(--card-border)]
                         rounded-xl text-sm font-medium hover:border-[#ff6b6b]/50 hover:bg-[#ff6b6b]/5 transition-all group"
            >
              <Hand size={16} className="text-[#ff6b6b] group-hover:scale-110 transition-transform" />
              <span className="text-[var(--foreground)]">Votar Figura</span>
            </button>

            <button
              onClick={() => router.push('/chat')}
              className="flex items-center gap-2 px-3.5 py-2 bg-[var(--card-bg)] border border-[var(--card-border)]
                         rounded-xl text-sm font-medium hover:border-[#10b981]/50 hover:bg-[#10b981]/5 transition-all group"
            >
              <MessageCircle size={16} className="text-[#10b981] group-hover:scale-110 transition-transform" />
              <span className="text-[var(--foreground)]">Chat</span>
            </button>

            <button
              onClick={() => router.push('/log')}
              className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] 
                         rounded-xl text-sm font-semibold text-white hover:shadow-md hover:shadow-[#f59e0b]/20 transition-all group"
            >
              <Film size={16} className="group-hover:scale-110 transition-transform" />
              <span>Loguear</span>
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search and filter toggles */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border transition-all ${showFilters || searchQuery || dateFilter
                ? 'bg-[#ff6b6b]/10 border-[#ff6b6b]/30 text-[#ff6b6b]'
                : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              title="Filtrar"
            >
              <Search size={16} />
            </button>
          </div>

          {/* Search & Date Filter - collapsible */}
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

          {/* League Filters - pill style */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-5 pb-0.5">
            {LIGAS.map((liga) => (
              <button
                key={liga}
                onClick={() => setFiltroLiga(liga)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                  ${filtroLiga === liga
                    ? 'bg-[#ff6b6b] text-white shadow-sm shadow-[#ff6b6b]/25'
                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]'
                  }`}
              >
                {liga}
              </button>
            ))}
            <button
              onClick={() => {
                if (!user) {
                  router.push('/login')
                  return
                }
                setFiltroLiga('Favoritos')
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1
                ${filtroLiga === 'Favoritos'
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/40'
                  : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-amber-500 border border-[var(--card-border)]'
                }`}
            >
              <Star size={11} fill={filtroLiga === 'Favoritos' ? 'currentColor' : 'none'} />
              Mis Equipos
            </button>
          </div>

          {/* Live indicator */}
          {liveCount > 0 && (
            <div className="flex items-center gap-2 mb-4 px-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-medium text-red-500">
                {liveCount} {liveCount === 1 ? 'partido en vivo' : 'partidos en vivo'}
              </span>
            </div>
          )}

          {/* Match List */}
          <div>
            {/* Error State */}
            {error && !loading && (
              <ErrorMessage
                message="No pudimos cargar los partidos"
                onRetry={refetch}
              />
            )}

            {/* Empty State */}
            {!loading && !error && partidosFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-20 h-20 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]
                                flex items-center justify-center mb-4">
                  <span className="text-3xl opacity-60">{searchQuery || dateFilter ? '🔍' : '⚽'}</span>
                </div>
                <h3 className="text-base font-semibold mb-1 text-[var(--foreground)]">
                  {searchQuery || dateFilter
                    ? 'Sin resultados'
                    : 'No hay partidos'}
                </h3>
                <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
                  {searchQuery || dateFilter
                    ? 'Probá cambiando los filtros de búsqueda'
                    : filtroLiga !== 'Todos'
                      ? 'No hay partidos para esta liga. Probá seleccionando "Todos".'
                      : 'No hay partidos programados por el momento'}
                </p>
                {(searchQuery || dateFilter) && (
                  <button
                    onClick={() => { setSearchQuery(''); setDateFilter(''); setShowFilters(false) }}
                    className="mt-4 px-4 py-2 text-xs font-semibold text-[#ff6b6b] bg-[#ff6b6b]/10 rounded-lg
                               hover:bg-[#ff6b6b]/20 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}

            {/* Partidos Grid */}
            {!loading && !error && partidosFiltrados.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {partidosFiltrados.map((partido: Partido) => (
                  <PartidoCard key={partido.id} partido={partido} />
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
      <NavBar />
    </>
  )
}