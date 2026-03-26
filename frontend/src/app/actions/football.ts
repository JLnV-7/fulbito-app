// src/app/actions/football.ts
'use server'

import { unstable_cache } from 'next/cache'
import { getStandings, getTopScorers, getFixtures, getFixtureById, getRounds, getFixturesByRound } from '@/lib/api'
import { scrapeFixtures, scrapeStandings, scrapeTopScorers } from '@/lib/scraper'
import { fetchPublicFixtures, fetchPublicStandings, fetchPublicScorers } from '@/lib/football-data'
import { LIGAS_MAP, CURRENT_SEASONS } from '@/lib/constants'
import type { ApiLeagueResponse, ApiFixture } from '@/types/api'
import type { Partido } from '@/types'

const EUROPEAN_LEAGUES = ['La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League']

function getSeasonForLeague(ligaName: string): number {
    if (ligaName === 'MLS') return CURRENT_SEASONS.MLS
    if (ligaName === 'Brasileirão') return CURRENT_SEASONS.BRAZIL
    if (EUROPEAN_LEAGUES.includes(ligaName)) return CURRENT_SEASONS.EUROPE
    return CURRENT_SEASONS.ARGENTINA
}

// ─── Standings con caché 1 hora ───────────────────────────────────────────
const fetchStandingsCached = unstable_cache(
    async (ligaName: string) => {
        try {
            const data = await fetchPublicStandings(ligaName)
            if (data && data.length > 0) return data
        } catch {}
        try {
            const scraped = await scrapeStandings(ligaName)
            if (scraped && scraped.length > 0) return scraped
        } catch {}
        const leagueId = LIGAS_MAP[ligaName]
        if (!leagueId) throw new Error('Liga no soportada')
        const season = getSeasonForLeague(ligaName)
        const data = await getStandings(leagueId, season) as unknown as ApiLeagueResponse[]
        if (Array.isArray(data) && data.length > 0 && data[0]?.league?.standings) {
            return data[0].league.standings[0]
        }
        return []
    },
    ['standings'],
    { revalidate: 3600, tags: ['standings'] }
)

export async function fetchStandingsAction(ligaName: string) {
    return fetchStandingsCached(ligaName)
}

// ─── Top scorers con caché 12 horas ──────────────────────────────────────
const fetchTopScorersCached = unstable_cache(
    async (ligaName: string) => {
        try {
            const data = await fetchPublicScorers(ligaName)
            if (data && data.length > 0) return data
        } catch {}
        try {
            const scraped = await scrapeTopScorers(ligaName)
            if (scraped && Array.isArray(scraped) && scraped.length > 0) return scraped
        } catch {}
        const leagueId = LIGAS_MAP[ligaName]
        if (!leagueId) return []
        const season = getSeasonForLeague(ligaName)
        const data = await getTopScorers(leagueId, season)
        return data || []
    },
    ['top-scorers'],
    { revalidate: 43200, tags: ['scorers'] }
)

export async function fetchTopScorersAction(ligaName: string) {
    return fetchTopScorersCached(ligaName)
}

// ─── Fixtures con caché 5 min — se invalida con el cron ──────────────────
const fetchFixturesCached = unstable_cache(
    async (ligaName: string) => {
        try {
            const data = await fetchPublicFixtures(ligaName)
            if (data && data.length > 0) {
                return data.sort((a, b) =>
                    new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
                )
            }
        } catch {}
        try {
            const scraped = await scrapeFixtures(ligaName)
            if (scraped && scraped.length > 0) {
                return scraped.sort((a, b) =>
                    new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
                )
            }
        } catch {}
        const leagueId = LIGAS_MAP[ligaName]
        if (!leagueId) return []
        const season = getSeasonForLeague(ligaName)
        const today = new Date()
        const past = new Date(today); past.setDate(today.getDate() - 15)
        const future = new Date(today); future.setDate(today.getDate() + 15)
        const from = past.toISOString().split('T')[0]
        const to = future.toISOString().split('T')[0]
        let data = await getFixtures(leagueId, season, from, to)
        if (!data || data.length === 0) {
            const rounds = await getRounds(leagueId, season)
            if (rounds && rounds.length > 0) {
                const lastRounds = rounds.slice(-3)
                const results = await Promise.all(
                    lastRounds.map(round => getFixturesByRound(leagueId, season, round).catch(() => null))
                )
                data = results.filter((r): r is ApiFixture[] => r !== null).flat()
            }
        }
        if (!data) return []
        return data
            .map(item => adaptApiFixtureToPartido(item))
            .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
    },
    ['fixtures'],
    { revalidate: 300, tags: ['fixtures'] } // 5 minutos, invalidado por cron
)

export async function fetchFixturesAction(ligaName: string) {
    return fetchFixturesCached(ligaName)
}

// ─── Fixture by ID — sin caché (datos en vivo) ───────────────────────────
export async function fetchFixtureByIdAction(id: number): Promise<Partido | null> {
    try {
        const publicFixtures = await fetchPublicFixtures('Liga Profesional')
        if (publicFixtures) {
            const match = publicFixtures.find(f => f.fixture_id === id)
            if (match) return match
        }
    } catch {}
    try {
        const scraped = await scrapeFixtures('Liga Profesional')
        if (scraped) {
            const match = scraped.find(f => f.fixture_id === id)
            if (match) return match
        }
    } catch {}
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

export async function updateMatchScoreAction(partidoId: number, golesLocal: number, golesVisitante: number) {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { error } = await supabase
        .from('partidos')
        .update({ goles_local: golesLocal, goles_visitante: golesVisitante, estado: 'FINALIZADO' })
        .eq('id', partidoId)
    if (error) throw new Error(error.message)
    return { success: true }
}

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
    } catch {}
    return scraped
}

function mapStatusToState(status: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' {
    if (['NS', 'TBD'].includes(status)) return 'PREVIA'
    if (['FT', 'AET', 'PEN'].includes(status)) return 'FINALIZADO'
    return 'EN_JUEGO'
}
