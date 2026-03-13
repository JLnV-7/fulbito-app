// src/lib/partido-utils.ts

export type EstadoPartidoSimplificado = 'proximo' | 'en_vivo' | 'finalizado'

/**
 * Determina el estado del partido basado en el código de estado de API-Football
 */
export function getEstadoPartido(fixture: any): EstadoPartidoSimplificado {
  // Manejar objeto simplificado o respuesta completa de API
  const status = fixture?.fixture?.status?.short || fixture?.estado_short || fixture?.estado
  
  const finalizados = ['FT', 'AET', 'PEN', 'AWD', 'WO', 'FINALIZADO']
  const enVivo      = ['1H', '2H', 'ET', 'P', 'HT', 'BT', 'LIVE', 'EN_JUEGO']

  if (finalizados.includes(status)) return 'finalizado'
  if (enVivo.includes(status))      return 'en_vivo'
  return 'proximo'
}
