// src/app/votar/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PartidoCard } from '@/components/PartidoCard'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { LIGAS, type Liga } from '@/lib/constants'
import { PartidoCardSkeleton } from '@/components/skeletons/PartidoCardSkeleton'
import type { Partido } from '@/types'

export default function VotarPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [filtroLiga, setFiltroLiga] = useState<Liga>('Todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 📊 Fetch partidos con manejo de errores
  const fetchPartidos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('partidos')
        .select('*')
        // Solo partidos en juego o finalizados recientemente para votar
        .in('estado', ['EN_JUEGO', 'FINALIZADO'])
        .order('fecha_inicio', { ascending: false })

      if (filtroLiga !== 'Todos') {
        query = query.eq('liga', filtroLiga)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setPartidos(data || [])
    } catch (err) {
      console.error('Error cargando partidos:', err)
      setError('No pudimos cargar los partidos habilitados para votación.')
    } finally {
      setLoading(false)
    }
  }, [filtroLiga])

  useEffect(() => {
    fetchPartidos()
  }, [fetchPartidos])

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] pb-24 md:pt-20">
        <DesktopNav />
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold mb-6 text-[var(--foreground)]">Votar Figura del Partido ✋</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, idx) => (
              <PartidoCardSkeleton key={idx} />
            ))}
          </div>
        </div>
        <NavBar />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--background)] pb-24 md:pt-20 transition-colors duration-300">
      <DesktopNav />
      {/* Header */}
      <div className="p-6 bg-[var(--card-bg)] border-b border-[var(--card-border)] mb-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors mb-2 text-sm"
          >
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            ✋ Votación de Figuras
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Elegí el partido y votá a la figura. Solo partidos en vivo o terminados.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Filtros de Liga */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
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
        </div>

        {/* Lista de Partidos */}
        <div>
          {/* Error State */}
          {error && (
            <ErrorMessage
              message={error}
              onRetry={() => fetchPartidos()}
            />
          )}

          {/* Empty State */}
          {!loading && !error && partidos.length === 0 && (
            <div className="text-center py-20 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
              <div className="text-6xl mb-4">⌛</div>
              <p className="text-[var(--foreground)] font-bold text-lg mb-2">No hay partidos para votar</p>
              <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto">
                La votación se habilita cuando los partidos comienzan o terminan.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-6 text-[#ff6b6b] font-semibold hover:underline"
              >
                Ver próximos partidos
              </button>
            </div>
          )}

          {/* Partidos Grid */}
          {!loading && !error && partidos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partidos.map((partido) => (
                <div key={partido.id} onClick={() => router.push(`/partido/${partido.id}`)} className="cursor-pointer group">
                  <PartidoCard partido={partido} />
                  <div className="mt-2 text-center">
                    <span className="text-xs font-bold text-[#ff6b6b] group-hover:underline">Tocá para votar ✋</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <NavBar />
    </main>
  )
}
