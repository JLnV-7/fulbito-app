// src/lib/constants.ts

export const API_BASE_URL = 'https://v3.football.api-sports.io'

// IDs de ligas en API-Football
export const LEAGUE_IDS = {
    // Argentina
    LIGA_PROFESIONAL: 128,
    PRIMERA_NACIONAL: 129,
    COPA_ARGENTINA: 130,
    // Europa
    LA_LIGA: 140,
    PREMIER_LEAGUE: 39,
    SERIE_A: 135,
    BUNDESLIGA: 78,
    LIGUE_1: 61,
    // Copas internacionales
    CHAMPIONS_LEAGUE: 2,
    COPA_LIBERTADORES: 13,
    COPA_SUDAMERICANA: 11,
    // Latinoamérica
    BRASILEIRAO: 71,
    LIGA_MX: 262,
    PRIMERA_DIVISION_CHILE: 265,
    LIGA_BETPLAY_COLOMBIA: 239,
    PRIMERA_DIVISION_URUGUAY: 268,
    LIGA_1_PERU: 281,
    // Resto
    MLS: 253,
} as const

// Temporadas actuales
export const CURRENT_SEASONS = {
    ARGENTINA: 2025,
    EUROPE: 2025,
    BRAZIL: 2025,
    LATAM: 2025,
    MLS: 2026,
} as const

// Mapeo de nombres internos a IDs
export const LIGAS_MAP: Record<string, number> = {
    'Liga Profesional': LEAGUE_IDS.LIGA_PROFESIONAL,
    'Primera Nacional': LEAGUE_IDS.PRIMERA_NACIONAL,
    'Copa Argentina': LEAGUE_IDS.COPA_ARGENTINA,
    'La Liga': LEAGUE_IDS.LA_LIGA,
    'Premier League': LEAGUE_IDS.PREMIER_LEAGUE,
    'Serie A': LEAGUE_IDS.SERIE_A,
    'Bundesliga': LEAGUE_IDS.BUNDESLIGA,
    'Ligue 1': LEAGUE_IDS.LIGUE_1,
    'Champions League': LEAGUE_IDS.CHAMPIONS_LEAGUE,
    'Copa Libertadores': LEAGUE_IDS.COPA_LIBERTADORES,
    'Copa Sudamericana': LEAGUE_IDS.COPA_SUDAMERICANA,
    'Brasileirão': LEAGUE_IDS.BRASILEIRAO,
    'Liga MX': LEAGUE_IDS.LIGA_MX,
    'Primera División Chile': LEAGUE_IDS.PRIMERA_DIVISION_CHILE,
    'Liga BetPlay': LEAGUE_IDS.LIGA_BETPLAY_COLOMBIA,
    'Primera División Uruguay': LEAGUE_IDS.PRIMERA_DIVISION_URUGUAY,
    'Liga 1 Perú': LEAGUE_IDS.LIGA_1_PERU,
    'MLS': LEAGUE_IDS.MLS,
}

// Configuración de revalidación (en segundos)
export const REVALIDATE_CONFIG = {
    STANDINGS: 3600,
    FIXTURES: 1800,
    LIVE: 60,
    SCORERS: 43200,
    STATISTICS: 120,
} as const

// Ligas soportadas en la aplicación — orden: Argentina primero, luego Latam, luego Europa
export const LIGAS = [
    'Todos',
    'Favoritos',
    // Argentina
    'Liga Profesional',
    'Primera Nacional',
    'Copa Argentina',
    // Latinoamérica
    'Copa Libertadores',
    'Copa Sudamericana',
    'Brasileirão',
    'Liga MX',
    'Primera División Chile',
    'Liga BetPlay',
    'Primera División Uruguay',
    'Liga 1 Perú',
    // Europa
    'Champions League',
    'La Liga',
    'Premier League',
    'Serie A',
    'Bundesliga',
    'Ligue 1',
    // Resto
    'MLS',
] as const
export type Liga = typeof LIGAS[number]

// Banderas por liga (para mostrar en chips y tabs)
export const LIGA_FLAGS: Record<string, string> = {
    'Liga Profesional': '🇦🇷',
    'Primera Nacional': '🇦🇷',
    'Copa Argentina': '🇦🇷',
    'Copa Libertadores': '🌎',
    'Copa Sudamericana': '🌎',
    'Brasileirão': '🇧🇷',
    'Liga MX': '🇲🇽',
    'Primera División Chile': '🇨🇱',
    'Liga BetPlay': '🇨🇴',
    'Primera División Uruguay': '🇺🇾',
    'Liga 1 Perú': '🇵🇪',
    'Champions League': '🏆',
    'La Liga': '🇪🇸',
    'Premier League': '🏴',
    'Serie A': '🇮🇹',
    'Bundesliga': '🇩🇪',
    'Ligue 1': '🇫🇷',
    'MLS': '🇺🇸',
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
