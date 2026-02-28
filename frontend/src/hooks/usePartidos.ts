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

      setState({
        data,
        loading: false,
        error: null
      })
    } catch (err) {
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
