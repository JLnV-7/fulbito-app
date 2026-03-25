// src/lib/constants.ts

export const API_BASE_URL = 'https://v3.football.api-sports.io'

// IDs de ligas en API-Football
export const LEAGUE_IDS = {
    LIGA_PROFESIONAL: 128,
    PRIMERA_NACIONAL: 129,
    LA_LIGA: 140,
    PREMIER_LEAGUE: 39,
    SERIE_A: 135,
    BUNDESLIGA: 78,
    LIGUE_1: 61,
    BRASILEIRAO: 71,
    CHAMPIONS_LEAGUE: 2,
    COPA_LIBERTADORES: 13,
    COPA_SUDAMERICANA: 11,
    MLS: 253,
    CHILE: 265,
    COLOMBIA: 239,
    MEXICO: 262,
    URUGUAY: 268,
    PERU: 281,
    ECUADOR: 242,
} as const

// Temporadas actuales
export const CURRENT_SEASONS = {
    ARGENTINA: 2025,
    EUROPE: 2025,    // 2025-2026 runs Aug-May
    BRAZIL: 2025,
    MLS: 2026,
} as const

// Mapeo de nombres internos a IDs
export const LIGAS_MAP: Record<string, number> = {
    'Liga Profesional': LEAGUE_IDS.LIGA_PROFESIONAL,
    'Primera Nacional': LEAGUE_IDS.PRIMERA_NACIONAL,
    'La Liga': LEAGUE_IDS.LA_LIGA,
    'Premier League': LEAGUE_IDS.PREMIER_LEAGUE,
    'Serie A': LEAGUE_IDS.SERIE_A,
    'Bundesliga': LEAGUE_IDS.BUNDESLIGA,
    'Ligue 1': LEAGUE_IDS.LIGUE_1,
    'Brasileirão': LEAGUE_IDS.BRASILEIRAO,
    'Champions League': LEAGUE_IDS.CHAMPIONS_LEAGUE,
    'Copa Libertadores': LEAGUE_IDS.COPA_LIBERTADORES,
    'Copa Sudamericana': LEAGUE_IDS.COPA_SUDAMERICANA,
    'MLS': LEAGUE_IDS.MLS,
    'Chile': LEAGUE_IDS.CHILE,
    'Colombia': LEAGUE_IDS.COLOMBIA,
    'México': LEAGUE_IDS.MEXICO,
    'Uruguay': LEAGUE_IDS.URUGUAY,
    'Perú': LEAGUE_IDS.PERU,
    'Ecuador': LEAGUE_IDS.ECUADOR,
}

// Configuración de revalidación (en segundos)
export const REVALIDATE_CONFIG = {
    STANDINGS: 3600,      // 1 hora
    FIXTURES: 1800,       // 30 min
    LIVE: 60,             // 1 minuto
    SCORERS: 43200,       // 12 horas
    STATISTICS: 120,      // 2 min (detalle partido)
} as const

// Ligas soportadas en la aplicación
export const LIGAS = [
    'Todos',
    'Liga Profesional',
    'Primera Nacional',
    'Copa Libertadores',
    'Copa Sudamericana',
    'Champions League',
    'La Liga',
    'Premier League',
    'Serie A',
    'Bundesliga',
    'Ligue 1',
    'Brasileirão',
    'MLS',
    'Chile',
    'Colombia',
    'México',
    'Uruguay',
    'Perú',
    'Ecuador',
] as const

export const LIGA_FLAGS: Record<string, string> = {
    'Liga Profesional': '🇦🇷',
    'Primera Nacional': '🇦🇷',
    'La Liga': '🇪🇸',
    'Premier League': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷',
    'Brasileirão': '🇧🇷',
    'Champions League': '🇪🇺',
    'Copa Libertadores': '🏆',
    'Copa Sudamericana': '🏆',
    'MLS': '🇺🇸',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'México': '🇲🇽',
    'Uruguay': '🇺🇾',
    'Perú': '🇵🇪',
    'Ecuador': '🇪🇨',
}

export const TEAM_THEMES: Record<string, { primary: string; secondary: string; dark?: string }> = {
    'Boca Juniors': { primary: '#003366', secondary: '#FFCC00', dark: '#002244' },
    'River Plate': { primary: '#FF0000', secondary: '#FFFFFF', dark: '#cc0000' },
    'San Lorenzo': { primary: '#003399', secondary: '#FF0000', dark: '#002266' },
    'Racing Club': { primary: '#A8E0FF', secondary: '#FFFFFF', dark: '#82c0df' },
    'Independiente': { primary: '#E30613', secondary: '#FFFFFF', dark: '#b0050f' },
    'Estudiantes': { primary: '#E2001A', secondary: '#FFFFFF', dark: '#b00014' },
    'Gimnasia': { primary: '#003399', secondary: '#FFFFFF', dark: '#002266' },
    'Vélez Sarsfield': { primary: '#003399', secondary: '#FFFFFF', dark: '#002266' },
    'Huracán': { primary: '#FF0000', secondary: '#FFFFFF', dark: '#cc0000' },
    'Rosario Central': { primary: '#002D62', secondary: '#FFCD00', dark: '#001a3a' },
    'Newell\'s Old Boys': { primary: '#000000', secondary: '#E30613', dark: '#000000' },
    'Belgrano': { primary: '#00AEEF', secondary: '#FFFFFF', dark: '#008ec3' },
    'Talleres': { primary: '#001A57', secondary: '#FFFFFF', dark: '#000d2b' },
    'Selección Argentina': { primary: '#75AADB', secondary: '#FFFFFF', dark: '#5d8ab3' },
    'Inter Miami': { primary: '#F2A9B8', secondary: '#000000', dark: '#d98b9a' },
    'Real Madrid': { primary: '#FFFFFF', secondary: '#FEBE10', dark: '#e6e6e6' },
    'FC Barcelona': { primary: '#A50044', secondary: '#004D98', dark: '#7a0032' },
}

export type Liga = typeof LIGAS[number]
