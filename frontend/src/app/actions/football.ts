// src/app/actions/football.ts
'use server'

import { getStandings, getTopScorers, getFixtures, getFixtureById, getRounds, getFixturesByRound } from '@/lib/api'
import { scrapeFixtures, scrapeStandings, scrapeTopScorers } from '@/lib/scraper'
import { fetchPublicFixtures, fetchPublicStandings, fetchPublicScorers } from '@/lib/football-data'
import { LIGAS_MAP, CURRENT_SEASONS } from '@/lib/constants'
import type { ApiLeagueResponse, ApiFixture } from '@/types/api'
import type { Partido } from '@/types'

// Determine correct season for API-Football based on league region
const EUROPEAN_LEAGUES = ['La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League']
const SA_LEAGUES = ['Liga Profesional', 'Primera Nacional', 'Copa Libertadores', 'Copa Sudamericana', 'Brasileirão']

function getSeasonForLeague(ligaName: string): number {
    if (ligaName === 'MLS') return CURRENT_SEASONS.MLS
    if (ligaName === 'Brasileirão') return CURRENT_SEASONS.BRAZIL
    if (EUROPEAN_LEAGUES.includes(ligaName)) return CURRENT_SEASONS.EUROPE
    return CURRENT_SEASONS.ARGENTINA
}

export async function fetchStandingsAction(ligaName: string) {
    // 1. Try football-data.org first (New preferred public source)
    try {
        const data = await fetchPublicStandings(ligaName)
        if (data && data.length > 0) return data
    } catch (e) {
        console.error('Error fetching from football-data:', e)
    }

    // 2. Try scraper second (current season, free)
    try {
        const scraped = await scrapeStandings(ligaName)
        if (scraped && scraped.length > 0) return scraped
    } catch {
        // Silent fallback to API-Football
    }

    // Fallback to API-Football
    const leagueId = LIGAS_MAP[ligaName]
    if (!leagueId) throw new Error('Liga no soportada')

    const season = getSeasonForLeague(ligaName)
    const data = await getStandings(leagueId, season) as unknown as ApiLeagueResponse[]

    if (Array.isArray(data) && data.length > 0 && data[0]?.league?.standings) {
        return data[0].league.standings[0]
    }

    return []
}

export async function fetchTopScorersAction(ligaName: string) {
    // 1. Try football-data.org first
    try {
        const data = await fetchPublicScorers(ligaName)
        if (data && data.length > 0) return data
    } catch (e) {
        console.error('Error fetching scorers from football-data:', e)
    }

    // 2. Try scraper second
    try {
        const scraped = await scrapeTopScorers(ligaName)
        if (scraped && Array.isArray(scraped) && scraped.length > 0) return scraped
    } catch {
        // Silent fallback
    }

    // Fallback to API-Football
    const leagueId = LIGAS_MAP[ligaName]
    if (!leagueId) return []

    const season = getSeasonForLeague(ligaName)
    const data = await getTopScorers(leagueId, season)
    return data || []
}

export async function fetchFixturesAction(ligaName: string) {
    // 1. Try football-data.org first
    try {
        const data = await fetchPublicFixtures(ligaName)
        if (data && data.length > 0) {
            return data.sort((a, b) =>
                new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
            )
        }
    } catch (e) {
        console.error('Error fetching fixtures from football-data:', e)
    }

    // 2. Try scraper second
    try {
        const scraped = await scrapeFixtures(ligaName)
        if (scraped && scraped.length > 0) {
            return scraped.sort((a, b) =>
                new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
            )
        }
    } catch {
        // Silent fallback
    }

    // Fallback to API-Football
    const leagueId = LIGAS_MAP[ligaName]
    if (!leagueId) return []

    const season = getSeasonForLeague(ligaName)

    const today = new Date()
    const past = new Date(today)
    past.setDate(today.getDate() - 15)
    const future = new Date(today)
    future.setDate(today.getDate() + 15)

    const from = past.toISOString().split('T')[0]
    const to = future.toISOString().split('T')[0]

    let data = await getFixtures(leagueId, season, from, to)

    // If no fixtures in current date range, fetch last rounds
    if (!data || data.length === 0) {
        const rounds = await getRounds(leagueId, season)
        if (rounds && rounds.length > 0) {
            const lastRounds = rounds.slice(-3)
            const roundPromises = lastRounds.map(round =>
                getFixturesByRound(leagueId, season, round).catch(() => null)
            )
            const roundResults = await Promise.all(roundPromises)
            data = roundResults
                .filter((r): r is ApiFixture[] => r !== null)
                .flat()
        }
    }

    if (!data) return []

    return data
        .map(item => adaptApiFixtureToPartido(item))
        .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
}

export async function fetchFixtureByIdAction(id: number): Promise<Partido | null> {
    // 1. Attempt to find it quickly in public data (Football-Data API)
    try {
        const publicFixtures = await fetchPublicFixtures('Liga Profesional')
        if (publicFixtures) {
            const match = publicFixtures.find(f => f.fixture_id === id)
            if (match) return match
        }
    } catch {}

    // 2. Attempt to find it in the robust scraped data cache
    try {
        const scraped = await scrapeFixtures('Liga Profesional')
        if (scraped) {
            const match = scraped.find(f => f.fixture_id === id)
            if (match) return match
        }
    } catch {}

    // 3. Absolute fallback to API-Football fetching
    try {
        const data = await getFixtureById(id)
        if (data) return adaptApiFixtureToPartido(data)
    } catch (e) {
        console.error('API-Football fallback failure for ID', id, e)
    }
    
    return null
}

export async function fetchPlayerByIdAction(id: number, season: number = 2024) {
    const { getPlayerById } = await import('@/lib/api')
    return getPlayerById(id, season)
}


function adaptApiFixtureToPartido(item: ApiFixture): Partido {
    return {
        id: item.fixture.id,
        liga: item.league.name,
        equipo_local: item.teams.home.name,
        equipo_visitante: item.teams.away.name,
        fecha_inicio: item.fixture.date,
        estado: mapStatusToState(item.fixture.status.short),
        goles_local: item.goals.home ?? undefined,
        goles_visitante: item.goals.away ?? undefined,
        logo_local: item.teams.home.logo,
        logo_visitante: item.teams.away.logo,
        fixture_id: item.fixture.id
    }
}

// Admin: Update match score
export async function updateMatchScoreAction(partidoId: number, golesLocal: number, golesVisitante: number) {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase
        .from('partidos')
        .update({
            goles_local: golesLocal,
            goles_visitante: golesVisitante,
            estado: 'FINALIZADO',
        })
        .eq('id', partidoId)

    if (error) throw new Error(error.message)
    return { success: true }
}

/**
 * Fetch fixtures AND sync them to Supabase (for Prode).
 */
export async function fetchFixturesWithSyncAction(ligaName: string): Promise<Partido[]> {
    const { syncPartidosToSupabase } = await import('./syncPartidos')
    const scraped = await fetchFixturesAction(ligaName)
    if (!scraped || scraped.length === 0) return []

    try {
        const synced = await syncPartidosToSupabase(scraped)
        if (synced && synced.length > 0) {
            return synced.sort((a, b) =>
                new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
            )
        }
    } catch {
        // Fallback: return scraped data without Supabase UUIDs
    }

    return scraped
}

function mapStatusToState(status: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' {
    if (['NS', 'TBD'].includes(status)) return 'PREVIA'
    if (['FT', 'AET', 'PEN'].includes(status)) return 'FINALIZADO'
    return 'EN_JUEGO'
}
