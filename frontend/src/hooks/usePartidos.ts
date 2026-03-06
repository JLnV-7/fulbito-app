import { useState, useEffect, useCallback } from 'react'
import type { Partido, Liga, AsyncState } from '@/types'
import { fetchFixturesAction } from '@/app/actions/football'
import { LIGAS_MAP } from '@/lib/constants'

const POLL_INTERVAL = 180000 // 3 minutos

export function usePartidos(filtroLiga: Liga = 'Todos') {
  const [state, setState] = useState<AsyncState<Partido[]>>({
    data: null,
    loading: true,
    error: null
  })

  const fetchPartidos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: prev.data ? false : true, error: null }))

      let data: Partido[] = []

      if (filtroLiga === 'Todos') {
        // Free tier: solo traer Liga Profesional por defecto para ahorrar requests
        data = await fetchFixturesAction('Liga Profesional')
      } else {
        data = await fetchFixturesAction(filtroLiga)
      }

      // Ordenar por fecha
      data.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())

      // --- MOCK FALLBACK DEMOS PARA PROBAR ESTADOS ---
      // Si la API no devuelve nada (que últimamente pasa), inyectamos 3 partidos de mentira
      if (data.length === 0) {
        const now = new Date()

        // 1. Partido Finalizado (Ayer)
        const ayer = new Date(now)
        ayer.setDate(ayer.getDate() - 1)

        // 2. Partido En Juego (Hoy, hace una hora)
        const hoyEnJuego = new Date(now)
        hoyEnJuego.setHours(hoyEnJuego.getHours() - 1)

        // 3. Partido Previa (Mañana)
        const manana = new Date(now)
        manana.setDate(manana.getDate() + 1)

        data = [
          {
            id: 'mock-fin-1',
            fixture_id: 9991,
            equipo_local: 'River Plate',
            equipo_visitante: 'Boca Juniors',
            logo_local: 'https://media.api-sports.io/football/teams/435.png', // River
            logo_visitante: 'https://media.api-sports.io/football/teams/451.png', // Boca
            goles_local: 3,
            goles_visitante: 1,
            fecha_inicio: ayer.toISOString(),
            estado: 'FINALIZADO',
            liga: 'Liga Profesional',
            temporada: 2026,
            last_updated: now.toISOString()
          },
          {
            id: 'mock-live-1',
            fixture_id: 9992,
            equipo_local: 'Racing Club',
            equipo_visitante: 'Independiente',
            logo_local: 'https://media.api-sports.io/football/teams/436.png', // Racing
            logo_visitante: 'https://media.api-sports.io/football/teams/438.png', // Indep
            goles_local: 0,
            goles_visitante: 0,
            fecha_inicio: hoyEnJuego.toISOString(),
            estado: 'EN_JUEGO',
            liga: 'Liga Profesional',
            minuto: 45,
            temporada: 2026,
            last_updated: now.toISOString()
          },
          {
            id: 'mock-prev-1',
            fixture_id: 9993,
            equipo_local: 'San Lorenzo',
            equipo_visitante: 'Huracán',
            logo_local: 'https://media.api-sports.io/football/teams/445.png', // SL
            logo_visitante: 'https://media.api-sports.io/football/teams/448.png', // Huracan
            fecha_inicio: manana.toISOString(),
            estado: 'PREVIA',
            liga: 'Liga Profesional',
            temporada: 2026,
            last_updated: now.toISOString()
          }
        ] as unknown as Partido[]
      }

      setState({
        data,
        loading: false,
        error: null
      })
    } catch (err: any) {
      console.error('Error en usePartidos:', err)
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Error desconocido'
      })
    }
  }, [filtroLiga])

  useEffect(() => {
    fetchPartidos()

    // Polling fijo: el efecto se re-ejecuta al cambiar filtroLiga
    const intervalId = setInterval(fetchPartidos, POLL_INTERVAL)

    return () => clearInterval(intervalId)
  }, [fetchPartidos])

  return {
    partidos: state.data || [],
    loading: state.loading,
    error: state.error,
    refetch: fetchPartidos
  }
}
