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

export function hapticFeedback(pattern: number | number[] = 50) {
  if (typeof window !== 'undefined' && navigator && navigator.vibrate) {
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Checks if a match is older than a specified number of days.
 * Default is 30 days as per QA requirements.
 */
export function isMatchTooOld(fechaInicio: string, limitDays: number = 30): boolean {
  if (!fechaInicio) return false
  const inicio = new Date(fechaInicio)
  const ahora = new Date()
  const diffTime = ahora.getTime() - inicio.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)
  return diffDays > limitDays
}

/**
 * Returns a dominant hex color for a given team name.
 * Used for dynamic ambient glows and thematic UI elements.
 */
export function getTeamColor(teamName: string | undefined | null): string {
  if (!teamName) return '#64748b' // slate-500 default

  const normalized = teamName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  const colorMap: Record<string, string> = {
    'boca juniors': '#0b3b60', // #eab308 also valid, but let's use deep blue for glow
    'river plate': '#ef4444', // Red
    'racing club': '#60a5fa', // Light blue
    'independiente': '#dc2626', // Red
    'san lorenzo': '#1e3a8a', // Dark blue (or red #b91c1c)
    'huracan': '#ef4444', // Red
    'velez sarsfield': '#3b82f6', // Blue
    'argentinos juniors': '#ef4444',
    'estudiantes l.p.': '#dc2626',
    'gimnasia l.p.': '#1e3a8a',
    'rosario central': '#eab308', // Yellow/Blue, Yellow glow is distinct
    'newells old boys': '#dc2626', // Red/Black
    'talleres (c)': '#1e3a8a',
    'belgrano': '#60a5fa',
    'instituto': '#dc2626',
    'atletico tucuman': '#60a5fa',
    'godoy cruz': '#3b82f6',
    'lanus': '#701a75', // Garnet
    'banfield': '#16a34a', // Green
    'union': '#ef4444',
    'colon': '#dc2626',
    'tigre': '#1e3a8a',
    'platense': '#78350f', // Brown
    'sarmiento (j)': '#16a34a',
    'central cordoba (sde)': '#000000',
    'barracas central': '#dc2626',
    'defensa y justicia': '#ca8a04', // Yellow/Green
    'arsenal': '#0ea5e9',
    'real madrid': '#ffffff',
    'fc barcelona': '#b91c1c',
    'manchester city': '#38bdf8',
    'liverpool': '#dc2626',
  }

  // Find partial match
  for (const [key, color] of Object.entries(colorMap)) {
    if (normalized.includes(key)) return color
  }

  return '#64748b' // Fallback
}