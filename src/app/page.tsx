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
import type { Partido } from '@/types'

import { LIGAS, type Liga } from '@/lib/constants'

export default function Home() {
  const { user } = useAuth()
  const router = useRouter()
  const [filtroLiga, setFiltroLiga] = useState<Liga | 'Favoritos'>('Todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [favoritos, setFavoritos] = useState<string[]>([])

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
    // 1. Filter by Search
    const matchesSearch = !searchQuery || (
      partido.equipo_local.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partido.equipo_visitante.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // 2. Filter by Date
    const matchesDate = !dateFilter || partido.fecha_inicio.startsWith(dateFilter)

    // 3. Filter by Favorites
    const matchesFavorites = filtroLiga !== 'Favoritos' || (
      favoritos.includes(partido.equipo_local) ||
      favoritos.includes(partido.equipo_visitante)
    )

    return matchesSearch && matchesDate && matchesFavorites
  })

  if (loading) {
    return (
      <>
        <DesktopNav />
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
          <div className="px-6 py-6 md:py-4">
            <h1 className="text-2xl font-bold tracking-tight md:hidden">
              Fulbito
            </h1>
          </div>
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        {/* Header */}
        <div className="px-6 py-6 md:py-4 flex justify-between items-center md:hidden">
          <h1 className="text-2xl font-bold tracking-tight">
            Fulbito
          </h1>
          <ReglasPuntajeModal />
        </div>

        {/* Container para desktop */}
        <div className="max-w-4xl mx-auto px-6">

          {/* Accesos Rápidos (Votar y Chat) */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => router.push('/votar')}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl
                         flex flex-col items-center justify-center gap-2 group hover:border-[#ff6b6b] transition-all"
            >
              <div className="bg-[#ff6b6b]/10 p-3 rounded-full group-hover:bg-[#ff6b6b]/20 transition-colors">
                <span className="text-2xl">✋</span>
              </div>
              <span className="font-bold text-[var(--foreground)]">Votar Figura</span>
            </button>

            <button
              onClick={() => router.push('/chat')}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl
                         flex flex-col items-center justify-center gap-2 group hover:border-[#10b981] transition-all"
            >
              <div className="bg-[#10b981]/10 p-3 rounded-full group-hover:bg-[#10b981]/20 transition-colors">
                <span className="text-2xl">💬</span>
              </div>
              <span className="font-bold text-[var(--foreground)]">Chat Global</span>
            </button>
          </div>

          {/* Filtros de Liga */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 md:justify-center">
            {LIGAS.map((liga) => (
              <button
                key={liga}
                onClick={() => setFiltroLiga(liga)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                           transition-all whitespace-nowrap uppercase tracking-wide
                           ${filtroLiga === liga
                    ? 'bg-[#ff6b6b] text-white'
                    : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]'
                  }`}
              >
                {liga}
              </button>
            ))}
            {/* Botón de Favoritos */}
            <button
              onClick={() => {
                if (!user) {
                  alert('Iniciá sesión para ver tus favoritos ⭐')
                  return
                }
                setFiltroLiga('Favoritos')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold
                         transition-all whitespace-nowrap uppercase tracking-wide flex items-center gap-1
                         ${filtroLiga === 'Favoritos'
                  ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                  : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-yellow-500 hover:bg-[var(--hover-bg)]'
                }`}
            >
              ⭐ Mis Equipos
            </button>
          </div>

          {/* Search Bar & Date Filter */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
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

          {/* Lista de Partidos */}
          <div>
            {/* Loading State */}
            {loading && <LoadingSpinner />}

            {/* Error State */}
            {error && !loading && (
              <ErrorMessage
                message="No pudimos cargar los partidos"
                onRetry={refetch}
              />
            )}

            {/* Empty State */}
            {!loading && !error && partidosFiltrados.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">{searchQuery || dateFilter ? '🔍' : '⚽'}</div>
                <p className="text-[var(--text-muted)] font-semibold text-sm">
                  {searchQuery || dateFilter
                    ? 'No encontramos partidos con esos filtros'
                    : 'No hay partidos programados'
                  }
                </p>
                {searchQuery || dateFilter ? (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setDateFilter('')
                    }}
                    className="mt-4 text-sm text-[#ff6b6b] hover:underline"
                  >
                    Limpiar filtros
                  </button>
                ) : (
                  <p className="text-[var(--text-muted)] text-xs mt-2 opacity-70">
                    {filtroLiga !== 'Todos' && `Probá con otra liga`}
                  </p>
                )}
              </div>
            )}

            {/* Partidos Grid - responsive */}
            {!loading && !error && partidosFiltrados.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {partidosFiltrados.map((partido: any) => (
                  <PartidoCard key={partido.id} partido={partido} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nav Bar */}
        <NavBar />
      </main>
    </>
  )
}