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

// Temporadas actuales
// Free plan: solo accede a seasons 2022-2024
export const CURRENT_SEASONS = {
    ARGENTINA: 2024, // Free tier limit — upgrade to Pro for 2025
    EUROPE: 2024,    // 2024-2025 runs Aug-May
} as const

// Mapeo de nombres internos a IDs
export const LIGAS_MAP: Record<string, number> = {
    'Liga Profesional': LEAGUE_IDS.LIGA_PROFESIONAL,
    'Primera Nacional': LEAGUE_IDS.PRIMERA_NACIONAL,
    'La Liga': LEAGUE_IDS.LA_LIGA,
    'Premier League': LEAGUE_IDS.PREMIER_LEAGUE,
}

// Configuración de revalidación (en segundos)
// Free tier = 100 req/día → ser conservador con cache
export const REVALIDATE_CONFIG = {
    STANDINGS: 7200,      // 2 horas
    FIXTURES: 7200,       // 2 horas
    LIVE: 120,            // 2 minutos (solo para detalles partido)
    SCORERS: 86400,       // 24 horas
} as const

// Ligas soportadas en la aplicación
export const LIGAS = ['Todos', 'Liga Profesional', 'Primera Nacional', 'La Liga', 'Premier League'] as const
export type Liga = typeof LIGAS[number]
