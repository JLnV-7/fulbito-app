// src/app/actions/football.ts
'use server'

import { getStandings, getTopScorers, getFixtures, getFixtureById, getRounds, getFixturesByRound } from '@/lib/api'
import { scrapeFixtures, scrapeStandings, scrapeTopScorers } from '@/lib/scraper'
import { fetchPublicFixtures, fetchPublicStandings, fetchPublicScorers } from '@/lib/football-data'
import { LIGAS_MAP, CURRENT_SEASONS } from '@/lib/constants'
import { unstable_cache, revalidateTag } from 'next/cache'
import type { ApiLeagueResponse, ApiFixture } from '@/types/api'
import type { Partido } from '@/types'

const EUROPEAN_LEAGUES = ['La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League']

function getSeasonForLeague(ligaName: string): number {
    if (ligaName === 'MLS') return CURRENT_SEASONS.MLS
    if (ligaName === 'Brasileirão') return CURRENT_SEASONS.BRAZIL
    if (EUROPEAN_LEAGUES.includes(ligaName)) return CURRENT_SEASONS.EUROPE
    return CURRENT_SEASONS.ARGENTINA
}

// ─── Helper: fetch con timeout ────────────────────────────────────────────────
// Antes: sin timeout → podía colgar 30s esperando APIs externas
// Ahora: 5s máximo por intento, falla rápido y pasa al siguiente
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
    return Promise.race([promise, timeout])
}

// ─── Fixtures: cacheados 5 minutos ───────────────────────────────────────────
// Antes: cada visita a la home → fetch fresco a API externa (~800ms)
// Ahora: primer visitante fetcha, los siguientes sirven desde cache (~0ms)
// revalidateTag('fixtures') para invalidar manualmente desde el cron
const getCachedFixtures = unstable_cache(
    async (ligaName: string): Promise<Partido[]> => {
        // 1. football-data.org con timeout 5s
        try {
            const data = await withTimeout(fetchPublicFixtures(ligaName), 5000)
            if (data && data.length > 0) {
                return data.sort((a, b) =>
                    new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
                )
            }
        } catch (e) {
            console.error('football-data timeout/error:', e)
        }

        // 2. Scraper con timeout 5s
        try {
            const scraped = await withTimeout(scrapeFixtures(ligaName), 5000)
            if (scraped && scraped.length > 0) {
                return scraped.sort((a, b) =>
                    new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
                )
            }
        } catch {
            // Pasa al fallback
        }

        // 3. API-Football como último recurso
        const leagueId = LIGAS_MAP[ligaName]
        if (!leagueId) return []

        const season = getSeasonForLeague(ligaName)
        const today = new Date()
        const past = new Date(today); past.setDate(today.getDate() - 15)
        const future = new Date(today); future.setDate(today.getDate() + 15)
        const from = past.toISOString().split('T')[0]
        const to = future.toISOString().split('T')[0]

        let data = await withTimeout(getFixtures(leagueId, season, from, to), 8000)

        if (!data || data.length === 0) {
            const rounds = await getRounds(leagueId, season)
            if (rounds && rounds.length > 0) {
                const lastRounds = rounds.slice(-3)
                const roundResults = await Promise.all(
                    lastRounds.map(round =>
                        withTimeout(getFixturesByRound(leagueId, season, round), 5000).catch(() => null)
                    )
                )
                data = roundResults.filter((r): r is ApiFixture[] => r !== null).flat()
            }
        }

        if (!data) return []
        return data.map(adaptApiFixtureToPartido)
            .sort((a, b) => new Date(b.fecha_inicio).getTime() - new Date(a.fecha_inicio).getTime())
    },
    ['fixtures'],
    {
        revalidate: 300, // 5 minutos de cache
        tags: ['fixtures']
    }
)

export async function fetchFixturesAction(ligaName: string): Promise<Partido[]> {
    return getCachedFixtures(ligaName)
}

// ─── Standings: cacheados 30 minutos ─────────────────────────────────────────
// La tabla de posiciones cambia cada jornada, no cada minuto
const getCachedStandings = unstable_cache(
    async (ligaName: string) => {
        try {
            const data = await withTimeout(fetchPublicStandings(ligaName), 5000)
            if (data && data.length > 0) return data
        } catch (e) {
            console.error('Standings football-data error:', e)
        }

        try {
            const scraped = await withTimeout(scrapeStandings(ligaName), 5000)
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
    { revalidate: 1800, tags: ['standings'] } // 30 minutos
)

export async function fetchStandingsAction(ligaName: string) {
    return getCachedStandings(ligaName)
}

// ─── Top Scorers: cacheados 30 minutos ───────────────────────────────────────
const getCachedTopScorers = unstable_cache(
    async (ligaName: string) => {
        try {
            const data = await withTimeout(fetchPublicScorers(ligaName), 5000)
            if (data && data.length > 0) return data
        } catch (e) {
            console.error('Scorers error:', e)
        }

        try {
            const scraped = await withTimeout(scrapeTopScorers(ligaName), 5000)
            if (scraped && Array.isArray(scraped) && scraped.length > 0) return scraped
        } catch {}

        const leagueId = LIGAS_MAP[ligaName]
        if (!leagueId) return []
        const season = getSeasonForLeague(ligaName)
        return (await getTopScorers(leagueId, season)) || []
    },
    ['top-scorers'],
    { revalidate: 1800, tags: ['top-scorers'] }
)

export async function fetchTopScorersAction(ligaName: string) {
    return getCachedTopScorers(ligaName)
}

// ─── Fixture por ID ───────────────────────────────────────────────────────────
export async function fetchFixtureByIdAction(id: number): Promise<Partido | null> {
    try {
        const publicFixtures = await withTimeout(fetchPublicFixtures('Liga Profesional'), 5000)
        if (publicFixtures) {
            const match = publicFixtures.find(f => f.fixture_id === id)
            if (match) return match
        }
    } catch {}

    try {
        const scraped = await withTimeout(scrapeFixtures('Liga Profesional'), 5000)
        if (scraped) {
            const match = scraped.find(f => f.fixture_id === id)
            if (match) return match
        }
    } catch {}

    try {
        const data = await withTimeout(getFixtureById(id), 8000)
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

// ─── Invalidar cache desde el cron ───────────────────────────────────────────
export async function revalidateFixturesCache() {
    revalidateTag('fixtures', 'max')
}

// ─── Admin: actualizar marcador ───────────────────────────────────────────────
// (mantenido del original — usado por panel de admin)
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
 * (mantenido del original — usado por el prode)
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapStatusToState(status: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' {
    if (['NS', 'TBD'].includes(status)) return 'PREVIA'
    if (['FT', 'AET', 'PEN'].includes(status)) return 'FINALIZADO'
    return 'EN_JUEGO'
}

function adaptApiFixtureToPartido(item: ApiFixture): Partido {
    return {
        id: item.fixture.id,
        liga: item.league.name,
        equipo_local: item.teams.home.name,
        equipo_visitante: item.teams.away.name,
        logo_local: item.teams.home.logo,
        logo_visitante: item.teams.away.logo,
        fecha_inicio: item.fixture.date,
        estado: mapStatusToState(item.fixture.status.short),
        goles_local: item.goals.home ?? undefined,
        goles_visitante: item.goals.away ?? undefined,
        fixture_id: item.fixture.id,
    }
}
