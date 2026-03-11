// src/lib/football-data.ts
import 'server-only'
import { cache } from 'react'
import type { Partido, Liga } from '@/types'

const API_KEY = process.env.FOOTBALL_DATA_TOKEN
const BASE_URL = 'https://api.football-data.org/v4'

// Mapping internal league names to football-data.org codes
const LIGAS_FD_MAP: Record<string, string> = {
    'Liga Profesional': 'ASL', // Liga Profesional Argentina might not be available in free tier, 
    // checking documentation or assuming common codes. 
    // BSA is Brasileirão, PD is La Liga, PL is Premier League.
    'La Liga': 'PD',
    'Premier League': 'PL',
    'Serie A': 'SA',
    'Bundesliga': 'BL1',
    'Ligue 1': 'FL1',
    'Champions League': 'CL',
    'Copa Libertadores': 'CLI',
    'Brasileirão': 'BSA',
    'MLS': 'MLS' // Might not be available
}

async function fetchFD<T>(endpoint: string): Promise<T | null> {
    if (!API_KEY) {
        console.warn('⚠️ FOOTBALL_DATA_TOKEN is not defined')
        return null
    }

    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'X-Auth-Token': API_KEY
            },
            next: { revalidate: 300 } // Cache for 5 minutes
        })

        if (!res.ok) {
            const error = await res.json()
            console.error(`[FootballData API Error] ${res.status}:`, error)
            return null
        }

        return await res.json()
    } catch (err) {
        console.error('[FootballData Fetch Error]:', err)
        return null
    }
}

export const fetchPublicFixtures = cache(async (league: string): Promise<Partido[]> => {
    const leagueCode = LIGAS_FD_MAP[league] || league
    const data = await fetchFD<any>(`/competitions/${leagueCode}/matches`)

    if (!data || !data.matches) return []

    return data.matches.map((m: any) => ({
        id: m.id,
        liga: league,
        equipo_local: m.homeTeam.shortName || m.homeTeam.name,
        equipo_visitante: m.awayTeam.shortName || m.awayTeam.name,
        logo_local: m.homeTeam.crest,
        logo_visitante: m.awayTeam.crest,
        fecha_inicio: m.utcDate,
        estado: mapStatus(m.status),
        goles_local: m.score?.fullTime?.home ?? undefined,
        goles_visitante: m.score?.fullTime?.away ?? undefined,
        fixture_id: m.id
    }))
})

export const fetchPublicStandings = cache(async (league: string) => {
    const leagueCode = LIGAS_FD_MAP[league] || league
    const data = await fetchFD<any>(`/competitions/${leagueCode}/standings`)

    if (!data || !data.standings) return []

    // football-data.org usually has multiple standings (Total, Home, Away) and varying stages.
    // We prioritize REGULAR_SEASON to avoid picking up 3-year aggregated tables (like Promedios in Argentina) 
    // which results in 81+ matches played.
    let totalStanding = data.standings.find((s: any) => s.type === 'TOTAL' && s.stage === 'REGULAR_SEASON')
    
    if (!totalStanding) {
        // Fallback to whichever TOTAL table is available, excluding aggregates / relegation
        totalStanding = data.standings.find((s: any) => 
            s.type === 'TOTAL' && !s.stage?.includes('RELEGATION') && !s.stage?.includes('PROMEDIO')
        )
    }

    if (!totalStanding) {
        // Last resort
        totalStanding = data.standings.find((s: any) => s.type === 'TOTAL')
    }

    if (!totalStanding) return []

    return totalStanding.table.map((item: any) => ({
        rank: item.position,
        team: {
            name: item.team.shortName || item.team.name,
            logo: item.team.crest
        },
        points: item.points,
        goalsDiff: item.goalDifference,
        all: {
            played: item.playedGames,
            win: item.won,
            draw: item.draw,
            lose: item.lost,
            goals: {
                for: item.goalsFor,
                against: item.goalsAgainst
            }
        }
    }))
})

export const fetchPublicScorers = cache(async (league: string) => {
    const leagueCode = LIGAS_FD_MAP[league] || league
    const data = await fetchFD<any>(`/competitions/${leagueCode}/scorers`)

    if (!data || !data.scorers) return []

    return data.scorers.map((s: any) => ({
        player: {
            name: s.player.name,
            nationality: s.player.nationality || '',
            photo: `https://crests.football-data.org/players/${s.player.id}.png`
        },
        statistics: [{
            goals: { total: s.goals || 0, assists: s.assists || 0 },
            games: { appearences: s.playedMatches || 0 },
            team: { name: s.team.name, logo: s.team.crest }
        }]
    }))
})

function mapStatus(status: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' {
    switch (status) {
        case 'FINISHED':
        case 'AWARDED':
            return 'FINALIZADO'
        case 'IN_PLAY':
        case 'LIVE':
        case 'PAUSED':
            return 'EN_JUEGO'
        default:
            return 'PREVIA'
    }
}
