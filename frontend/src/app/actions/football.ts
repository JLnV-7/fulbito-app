// src/app/actions/football.ts
'use server'

import { getStandings, getTopScorers, getFixtures, getFixtureById, getRounds, getFixturesByRound } from '@/lib/api'
import { scrapeFixtures, scrapeStandings, scrapeTopScorers, scrapeTodayAllLeagues } from '@/lib/scraper'
import { LIGAS_MAP, CURRENT_SEASONS } from '@/lib/constants'
import type { ApiLeagueResponse, ApiFixture } from '@/types/api'
import type { Partido } from '@/types'

export async function fetchStandingsAction(ligaName: string) {
    // Try scraper first (current season, free)
    try {
        const scraped = await scrapeStandings(ligaName)
        if (scraped && scraped.length > 0) {
            console.log(`[Standings] Scraper OK for ${ligaName}: ${scraped.length} teams`)
            return scraped
        }
    } catch (e) {
        console.warn(`[Standings] Scraper failed for ${ligaName}:`, e)
    }

    // Fallback to API-Football
    const leagueId = LIGAS_MAP[ligaName]
    if (!leagueId) throw new Error('Liga no soportada')

    const isEuropean = ['La Liga', 'Premier League'].includes(ligaName)
    const season = isEuropean ? CURRENT_SEASONS.EUROPE : CURRENT_SEASONS.ARGENTINA

    const data = await getStandings(leagueId, season) as unknown as ApiLeagueResponse[]

    if (Array.isArray(data) && data.length > 0 && data[0]?.league?.standings) {
        return data[0].league.standings[0]
    }

    return []
}

export async function fetchTopScorersAction(ligaName: string) {
    // Try scraper first
    try {
        const scraped = await scrapeTopScorers(ligaName)
        if (scraped && scraped.length > 0) {
            console.log(`[Scorers] Scraper OK for ${ligaName}: ${scraped.length} players`)
            return scraped
        }
    } catch (e) {
        console.warn(`[Scorers] Scraper failed for ${ligaName}:`, e)
    }

    // Fallback to API-Football
    const leagueId = LIGAS_MAP[ligaName]
    if (!leagueId) return []

    const isEuropean = ['La Liga', 'Premier League'].includes(ligaName)
    const season = isEuropean ? CURRENT_SEASONS.EUROPE : CURRENT_SEASONS.ARGENTINA

    const data = await getTopScorers(leagueId, season)
    return data || []
}

export async function fetchFixturesAction(ligaName: string) {
    // Try scraper first (gets today ± 1 day for current season)
    try {
        const scraped = await scrapeFixtures(ligaName)
        if (scraped && scraped.length > 0) {
            console.log(`[Fixtures] Scraper OK for ${ligaName}: ${scraped.length} matches`)
            return scraped.sort((a, b) =>
                new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
            )
        }
    } catch (e) {
        console.warn(`[Fixtures] Scraper failed for ${ligaName}:`, e)
    }

    // Fallback to API-Football (historical data)
    const leagueId = LIGAS_MAP[ligaName]
    if (!leagueId) return []

    const isEuropean = ['La Liga', 'Premier League'].includes(ligaName)
    const season = isEuropean ? CURRENT_SEASONS.EUROPE : CURRENT_SEASONS.ARGENTINA

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
    const data = await getFixtureById(id)
    if (!data) return null
    return adaptApiFixtureToPartido(data)
}

// Helper para adaptar respuesta API a nuestro tipo Partido
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

// Admin: Actualizar resultado manualmente
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

function mapStatusToState(status: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' {
    if (['NS', 'TBD'].includes(status)) return 'PREVIA'
    if (['FT', 'AET', 'PEN'].includes(status)) return 'FINALIZADO'
    return 'EN_JUEGO'
}
