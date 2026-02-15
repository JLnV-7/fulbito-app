// src/lib/api.ts
import 'server-only'
import { API_BASE_URL, REVALIDATE_CONFIG } from './constants'
import type { ApiStanding, ApiFixture, ApiScorer } from '@/types/api'

const API_KEY = process.env.API_FOOTBALL_KEY

if (!API_KEY) {
    console.warn('⚠️ API_FOOTBALL_KEY is missing in environment variables')
}

const fetchApi = async <T>(endpoint: string, revalidateTime: number = 3600): Promise<T | null> => {
    if (!API_KEY) return null

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'x-apisports-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io',
            },
            next: { revalidate: revalidateTime },
        })

        if (!res.ok) {
            console.error(`API Error ${res.status}: ${res.statusText}`)
            return null
        }

        const data = await res.json()

        if (data.errors && Object.keys(data.errors).length > 0) {
            console.error('API-Football Error:', data.errors)
            return null
        }

        return data.response
    } catch (error) {
        console.error('Fetch Error:', error)
        return null
    }
}

export const getStandings = async (leagueId: number, season: number) => {
    return fetchApi<ApiStanding[]>(
        `/standings?league=${leagueId}&season=${season}`,
        REVALIDATE_CONFIG.STANDINGS
    )
}

export const getFixtures = async (leagueId: number, season: number, from: string, to: string) => {
    return fetchApi<ApiFixture[]>(
        `/fixtures?league=${leagueId}&season=${season}&from=${from}&to=${to}`,
        REVALIDATE_CONFIG.FIXTURES
    )
}

export const getTopScorers = async (leagueId: number, season: number) => {
    return fetchApi<ApiScorer[]>(
        `/players/topscorers?league=${leagueId}&season=${season}`,
        REVALIDATE_CONFIG.SCORERS
    )
}

export const getFixtureById = async (id: number) => {
    // Cache corto porque puede estar en vivo
    const data = await fetchApi<ApiFixture[]>(`/fixtures?id=${id}`, 60)
    return data && data.length > 0 ? data[0] : null
}

export const getFixturesByDate = async (leagueId: number, season: number, date: string) => {
    return fetchApi<ApiFixture[]>(
        `/fixtures?league=${leagueId}&season=${season}&date=${date}`,
        REVALIDATE_CONFIG.LIVE
    )
}
