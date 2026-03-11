// src/app/votar/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { PartidoCard } from '@/components/PartidoCard'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
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
        .limit(20) // Evitar historial infinito

      if (filtroLiga !== 'Todos') {
        query = query.eq('liga', filtroLiga)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setPartidos(data || [])
    } catch (err: any) {
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
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            ✋ Votación de Figuras
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-medium">
            Elegí el partido y votá a la figura. Solo partidos en vivo o terminados.
          </p>
          <div className="mt-6 flex items-start gap-4 px-5 py-4 bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-2xl">
            <span className="text-[var(--accent)] text-lg">ℹ️</span>
            <p className="text-[11px] text-[var(--text-muted)] font-medium leading-relaxed">
              Mostrando los últimos 20 partidos finalizados.
              <br />
              Usá la <strong>búsqueda</strong> para encontrar encuentros anteriores.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6">
        {/* Filtros de Liga */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-10">
          {LIGAS.map((liga) => (
            <button
              key={liga}
              onClick={() => setFiltroLiga(liga)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold capitalize tracking-tight
                           transition-all whitespace-nowrap border
                           ${filtroLiga === liga
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-purple-500/20'
                  : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]'
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
            <div className="text-center py-20 bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)] shadow-xl">
              <div className="text-6xl mb-4">⌛</div>
              <p className="text-[var(--foreground)] font-black italic capitalize tracking-tighter text-xl mb-2">No hay partidos para votar</p>
              <p className="text-[var(--text-muted)] text-sm font-medium max-w-xs mx-auto">
                La votación se habilita cuando los partidos comienzan o terminan.
              </p>
              <button
                onClick={() => router.push('/')}
                className="mt-6 text-[var(--accent)] font-black capitalize italic text-sm tracking-widest hover:underline"
              >
                Ver próximos partidos
              </button>
            </div>
          )}

          {/* Partidos Grid */}
          {!loading && !error && partidos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {partidos.map((partido) => (
                <div key={partido.id} onClick={() => router.push(`/partido/${partido.id}`)} className="cursor-pointer group flex flex-col">
                  <PartidoCard partido={partido} />
                  <div className="mt-3 text-center">
                    <span className="text-[10px] font-black capitalize tracking-[0.2em] text-[var(--accent)] group-hover:underline">Tocá para votar ✋</span>
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
