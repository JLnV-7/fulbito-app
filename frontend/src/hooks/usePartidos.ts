import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Partido, Liga, AsyncState } from '@/types'
import { fetchFixturesAction } from '@/app/actions/football'
import { syncPartidosToSupabase } from '@/app/actions/syncPartidos'
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

      // 1. Fetch from Scraper/API
      try {
        if (filtroLiga === 'Todos') {
          data = await fetchFixturesAction('Liga Profesional')
        } else {
          data = await fetchFixturesAction(filtroLiga)
        }

        // SYNC to Supabase to get UUIDs for navigation
        if (data.length > 0) {
          try {
            const synced = await syncPartidosToSupabase(data)
            if (synced && synced.length > 0) {
              data = synced
            }
          } catch (syncErr) {
            console.error('[usePartidos] Sync failed:', syncErr)
          }
        }
      } catch (e) {
        console.error('Error fetching API fixtures:', e)
      }

      // 2. Fetch from Supabase (for simulation and user-managed matches)
      try {
        const { data: dbPartidos, error: dbError } = await supabase
          .from('partidos')
          .select('*')
          .neq('id', 'demo-match-999') // Ignorar el mock del widget si existe en DB
          .order('fecha_inicio', { ascending: true })

        if (!dbError && dbPartidos) {
          console.log(`[usePartidos] Found ${dbPartidos.length} matches in Supabase`);
          // Borramos los milisegundos y Z para que sea consistente con el startsWith de page.tsx
          const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local format

          // Merge: Overwrite or add
          dbPartidos.forEach((dbMatch: Partido) => {
            // Force simulation matches to be "Today" (local)
            if (dbMatch.id?.toString().startsWith('00000000-0000-0000-0000')) {
              const timePart = dbMatch.fecha_inicio.split('T')[1] || '20:00:00';
              dbMatch.fecha_inicio = `${todayLocal}T${timePart}`;
              console.log(`[usePartidos] Forced simulation match ${dbMatch.equipo_local} to ${dbMatch.fecha_inicio}`);
            }

            const index = data.findIndex(p => p.id === dbMatch.id || p.fixture_id === dbMatch.fixture_id)
            if (index !== -1) {
              data[index] = { ...data[index], ...dbMatch }
            } else {
              data.push(dbMatch)
            }
          })
        }
      } catch (e) {
        console.error('Error fetching Supabase matches:', e)
      }

      // 3. Fallback Mocks (si después de todo sigue vacío)
      if (data.length === 0) {
        // ... (existing fallback logic)
        const now = new Date()
        const ayer = new Date(now); ayer.setDate(ayer.getDate() - 1)
        const hoyEnJuego = new Date(now); hoyEnJuego.setHours(hoyEnJuego.getHours() - 1)
        const manana = new Date(now); manana.setDate(manana.getDate() + 1)

        const todayStr = now.toISOString().split('T')[0]

        data = [
          {
            id: 'mock-river-boca',
            fixture_id: 1001,
            equipo_local: 'River Plate',
            equipo_visitante: 'Boca Juniors',
            logo_local: 'https://media.api-sports.io/football/teams/435.png',
            logo_visitante: 'https://media.api-sports.io/football/teams/451.png',
            goles_local: 0,
            goles_visitante: 0,
            fecha_inicio: `${todayStr}T20:00:00`,
            estado: 'PREVIA',
            liga: 'Liga Profesional'
          },
          {
            id: 'mock-real-barca',
            fixture_id: 1002,
            equipo_local: 'Real Madrid',
            equipo_visitante: 'FC Barcelona',
            logo_local: 'https://media.api-sports.io/football/teams/541.png',
            logo_visitante: 'https://media.api-sports.io/football/teams/529.png',
            goles_local: 2,
            goles_visitante: 2,
            fecha_inicio: `${todayStr}T16:00:00`,
            estado: 'EN_JUEGO',
            liga: 'La Liga'
          },
          {
            id: 'mock-city-liverpool',
            fixture_id: 1003,
            equipo_local: 'Man City',
            equipo_visitante: 'Liverpool',
            logo_local: 'https://media.api-sports.io/football/teams/50.png',
            logo_visitante: 'https://media.api-sports.io/football/teams/40.png',
            goles_local: 1,
            goles_visitante: 0,
            fecha_inicio: `${todayStr}T11:00:00`,
            estado: 'FINALIZADO',
            liga: 'Premier League'
          },
          {
            id: 'mock-racing-independiente',
            fixture_id: 1004,
            equipo_local: 'Racing Club',
            equipo_visitante: 'Independiente',
            logo_local: 'https://media.api-sports.io/football/teams/436.png',
            logo_visitante: 'https://media.api-sports.io/football/teams/438.png',
            goles_local: 0,
            goles_visitante: 0,
            fecha_inicio: `${todayStr}T18:30:00`,
            estado: 'PREVIA',
            liga: 'Liga Profesional'
          }
        ] as any[]
      }

      // Final sort
      data.sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime())

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

    return () => {
      clearInterval(intervalId)
    }
  }, [fetchPartidos])

  return {
    partidos: state.data || [],
    loading: state.loading,
    error: state.error,
    refetch: fetchPartidos
  }
}
