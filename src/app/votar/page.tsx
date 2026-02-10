// src/app/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PartidoCard } from '@/components/PartidoCard'

// 🎯 Tipos centralizados
interface Partido {
  id: number
  liga: string
  equipo_local: string
  equipo_visitante: string
  fecha_inicio: string
  estado?: 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO'
}

import { LIGAS, type Liga } from '@/lib/constants'

export default function Home() {
  const router = useRouter()
  const [partidos, setPartidos] = useState<Partido[]>([])
  const [filtroLiga, setFiltroLiga] = useState<Liga>('Todos')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 🔐 Verificar autenticación
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // 📊 Fetch partidos con manejo de errores
  const fetchPartidos = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('partidos')
        .select('*')
        .order('fecha_inicio', { ascending: true })

      if (filtroLiga !== 'Todos') {
        query = query.eq('liga', filtroLiga)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setPartidos(data || [])
    } catch (err) {
      console.error('Error cargando partidos:', err)
      setError('No pudimos cargar los partidos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }, [filtroLiga])

  useEffect(() => {
    fetchPartidos()
  }, [fetchPartidos])

  // 🔄 Función para retry
  const handleRetry = () => {
    fetchPartidos()
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24 font-sans">
      {/* Header */}
      <div className="p-8 bg-gradient-to-b from-blue-900/20 to-transparent text-center">
        <h1 className="text-4xl font-black italic tracking-tighter">
          FULBITO <span className="text-blue-500">1x1</span>
        </h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
          Fixture & Votación
        </p>
      </div>

      {/* Filtros de Liga */}
      <div className="flex gap-2 px-6 overflow-x-auto no-scrollbar mb-8">
        {LIGAS.map((liga) => (
          <button
            key={liga}
            onClick={() => setFiltroLiga(liga)}
            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase 
                       transition-all whitespace-nowrap border
                       ${filtroLiga === liga
                ? 'bg-blue-600 border-blue-600 text-white scale-105'
                : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'
              }`}
          >
            {liga}
          </button>
        ))}
      </div>

      {/* Lista de Partidos */}
      <div className="px-6 space-y-4 max-w-xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-700 font-black animate-pulse uppercase text-xs">
              Buscando partidos...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-center">
            <p className="text-red-400 font-bold mb-4">⚠️ {error}</p>
            <button
              onClick={handleRetry}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-black uppercase transition-all"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && partidos.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚽</div>
            <p className="text-gray-600 font-black uppercase text-sm">
              No hay partidos programados
            </p>
          </div>
        )}

        {/* Partidos List */}
        {!loading && !error && partidos.length > 0 && (
          <>
            {partidos.map((partido) => (
              <PartidoCard key={partido.id} partido={partido} />
            ))}
          </>
        )}
      </div>

      {/* Nav Bar Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl 
                      border-t border-gray-900 px-10 py-5 flex justify-around items-center z-50">
        <button
          onClick={() => router.push('/')}
          className="text-blue-500 flex flex-col items-center gap-1"
        >
          <span className="text-xl">🏟️</span>
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button
          onClick={() => router.push('/perfil')}
          className="text-gray-500 flex flex-col items-center gap-1 hover:text-white transition-colors"
        >
          <span className="text-xl">👤</span>
          <span className="text-[9px] font-black uppercase tracking-tighter">Perfil</span>
        </button>
      </nav>
    </main>
  )
}
