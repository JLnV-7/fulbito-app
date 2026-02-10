// src/lib/constants.ts

export const API_BASE_URL = 'https://v3.football.api-sports.io'

// IDs de ligas en API-Football
export const LEAGUE_IDS = {
    LIGA_PROFESIONAL: 128,
    PRIMERA_NACIONAL: 129,
    LA_LIGA: 140,
    PREMIER_LEAGUE: 39,
    COPA_LIBERTADORES: 13,
    COPA_SUDAMERICANA: 11,
} as const

// Temporadas actuales (actualizar anualmente)
export const CURRENT_SEASONS = {
    ARGENTINA: 2024, // 2025 aún no tiene datos en API
    EUROPE: 2024,    // 2024-2025
} as const

// Mapeo de nombres internos a IDs
export const LIGAS_MAP: Record<string, number> = {
    'Liga Profesional': LEAGUE_IDS.LIGA_PROFESIONAL,
    'Primera Nacional': LEAGUE_IDS.PRIMERA_NACIONAL,
    'La Liga': LEAGUE_IDS.LA_LIGA,
    'Premier League': LEAGUE_IDS.PREMIER_LEAGUE,
}

// Configuración de revalidación (en segundos)
export const REVALIDATE_CONFIG = {
    STANDINGS: 3600,      // 1 hora
    FIXTURES: 3600,       // 1 hora (por plan free)
    LIVE: 60,             // 1 minuto (solo para detalles partido)
    SCORERS: 86400,       // 24 horas
} as const

// Ligas soportadas en la aplicación
export const LIGAS = ['Todos', 'Liga Profesional', 'Primera Nacional', 'La Liga', 'Premier League'] as const
export type Liga = typeof LIGAS[number]
