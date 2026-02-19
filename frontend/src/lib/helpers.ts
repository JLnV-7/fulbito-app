// src/lib/helpers.ts
import type { EstadoPartido } from '@/types'

export function calcularEstadoPartido(fechaInicio: string): EstadoPartido {
  const inicio = new Date(fechaInicio)
  const ahora = new Date()
  const fin = new Date(inicio.getTime() + 120 * 60000) // 2 horas después

  if (ahora < inicio) return 'PREVIA'
  if (ahora >= inicio && ahora < fin) return 'EN_JUEGO'
  return 'FINALIZADO'
}