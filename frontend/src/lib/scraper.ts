// src/lib/scraper.ts
// Data source using TheSportsDB free API (no auth, server-friendly)
import 'server-only'

const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3'

// TheSportsDB league IDs
const TSDB_LEAGUE_IDS: Record<string, number> = {
    'Liga Profesional': 4406,
    'Primera Nacional': 4616,
    'La Liga': 4335,
    'Premier League': 4328,
}

// Current seasons in TheSportsDB format
const TSDB_SEASONS: Record<string, string> = {
    'Liga Profesional': '2026',
    'Primera Nacional': '2026',
    'La Liga': '2025-2026',
    'Premier League': '2025-2026',
}

// Leagues where TheSportsDB standings work correctly
// (Argentine leagues return cumulative data, not single-season)
const STANDINGS_SUPPORTED = ['La Liga', 'Premier League']

async function fetchTSDB<T>(endpoint: string): Promise<T | null> {
    try {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
            next: { revalidate: 300 }, // 5 min cache
        })

        if (!res.ok) {
            console.error(`[TSDB] Error ${res.status}: ${endpoint}`)
            return null
        }

        return await res.json()
    } catch (error) {
        console.error('[TSDB] Fetch error:', error)
        return null
    }
}

// ============================================
// TYPES
// ============================================

interface TSDBEvent {
    idEvent: string
    strEvent: string
    strHomeTeam: string
    strAwayTeam: string
    intHomeScore: string | null
    intAwayScore: string | null
    strHomeTeamBadge: string
    strAwayTeamBadge: string
    dateEvent: string
    strTime: string
    strStatus: string
    strLeague: string
    intRound: string
    strTimestamp: string
}

interface TSDBStanding {
    intRank: string
    idTeam: string
    strTeam: string
    strTeamBadge: string
    intPlayed: string
    intWin: string
    intDraw: string
    intLoss: string
    intGoalsFor: string
    intGoalsAgainst: string
    intGoalDifference: string
    intPoints: string
    strForm?: string
}

// ============================================
// HELPERS
// ============================================

function mapStatus(status: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' {
    if (!status || status === 'Not Started' || status === 'NS') return 'PREVIA'
    if (status === 'Match Finished' || status === 'FT' || status === 'AET' || status === 'PEN') return 'FINALIZADO'
    return 'EN_JUEGO'
}

function adaptEvent(event: TSDBEvent) {
    const dateStr = event.strTimestamp || `${event.dateEvent}T${event.strTime || '00:00:00'}+00:00`
    return {
        id: parseInt(event.idEvent),
        liga: event.strLeague,
        equipo_local: event.strHomeTeam,
        equipo_visitante: event.strAwayTeam,
        fecha_inicio: new Date(dateStr).toISOString(),
        estado: mapStatus(event.strStatus),
        goles_local: event.intHomeScore !== null ? parseInt(event.intHomeScore) : undefined,
        goles_visitante: event.intAwayScore !== null ? parseInt(event.intAwayScore) : undefined,
        logo_local: event.strHomeTeamBadge || '',
        logo_visitante: event.strAwayTeamBadge || '',
        fixture_id: parseInt(event.idEvent),
    }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get fixtures for a league using eventsround (the only reliable endpoint)
 * Fetches current round + previous round
 */
export async function scrapeFixtures(ligaName: string) {
    const leagueId = TSDB_LEAGUE_IDS[ligaName]
    const season = TSDB_SEASONS[ligaName]
    if (!leagueId || !season) return []

    // Find the current round by trying from round 15 down
    const allEvents: TSDBEvent[] = []

    // Try a range of rounds around the current one
    const roundPromises = []
    for (let r = 1; r <= 15; r++) {
        roundPromises.push(
            fetchTSDB<{ events: TSDBEvent[] | null }>(
                `/eventsround.php?id=${leagueId}&r=${r}&s=${season}`
            ).then(data => ({ round: r, events: data?.events || [] }))
        )
    }

    const results = await Promise.all(roundPromises)

    // Find rounds that have matches near today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const { events } of results) {
        if (events.length > 0) {
            allEvents.push(...events)
        }
    }

    if (allEvents.length === 0) return []

    // Sort by date and return the most relevant matches
    // (near today: 2 weeks before to 2 weeks after)
    const twoWeeksAgo = new Date(today)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksFromNow = new Date(today)
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

    // De-duplicate
    const uniqueMap = new Map(allEvents.map(e => [e.idEvent, e]))
    const adapted = [...uniqueMap.values()].map(adaptEvent)

    // Filter to recent/upcoming matches
    const relevant = adapted.filter(p => {
        const d = new Date(p.fecha_inicio)
        return d >= twoWeeksAgo && d <= twoWeeksFromNow
    })

    // If we have relevant matches, return those; otherwise return all
    const finalList = relevant.length > 0 ? relevant : adapted

    return finalList.sort((a, b) =>
        new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
    )
}

/**
 * Get standings - only works for European leagues on TheSportsDB
 * Returns null for Argentine leagues to trigger API-Football fallback
 */
export async function scrapeStandings(ligaName: string) {
    // Only use TSDB standings for leagues where it's accurate
    if (!STANDINGS_SUPPORTED.includes(ligaName)) return null

    const leagueId = TSDB_LEAGUE_IDS[ligaName]
    const season = TSDB_SEASONS[ligaName]
    if (!leagueId || !season) return null

    const data = await fetchTSDB<{ table: TSDBStanding[] | null }>(
        `/lookuptable.php?l=${leagueId}&s=${season}`
    )

    if (!data?.table || data.table.length === 0) return null

    return data.table.map(row => ({
        rank: parseInt(row.intRank),
        team: {
            id: parseInt(row.idTeam),
            name: row.strTeam,
            logo: row.strTeamBadge || '',
        },
        points: parseInt(row.intPoints),
        goalsDiff: parseInt(row.intGoalDifference),
        group: '',
        form: row.strForm || '',
        status: '',
        description: null,
        all: {
            played: parseInt(row.intPlayed),
            win: parseInt(row.intWin),
            draw: parseInt(row.intDraw),
            lose: parseInt(row.intLoss),
            goals: {
                for: parseInt(row.intGoalsFor),
                against: parseInt(row.intGoalsAgainst),
            },
        },
        home: null,
        away: null,
        update: new Date().toISOString(),
    }))
}

/**
 * Top scorers not available on TheSportsDB free tier
 */
export async function scrapeTopScorers(_ligaName: string) {
    return null
}

/**
 * Get today's fixtures for all leagues
 */
export async function scrapeTodayAllLeagues() {
    const results = await Promise.all(
        Object.keys(TSDB_LEAGUE_IDS).map(async liga => {
            try {
                return await scrapeFixtures(liga)
            } catch {
                return []
            }
        })
    )
    return results.flat()
}
