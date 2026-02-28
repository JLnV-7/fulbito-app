// src/lib/scraper.ts
// Scraper using Sofascore public API for current season data
import 'server-only'

const SOFASCORE_BASE = 'https://api.sofascore.com/api/v1'
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
}

// Sofascore tournament IDs
const TOURNAMENT_IDS: Record<string, number> = {
    'Liga Profesional': 155,
    'Primera Nacional': 703,
    'La Liga': 8,
    'Premier League': 17,
}

// Current Sofascore season IDs (update when new season starts)
const SEASON_IDS: Record<string, number> = {
    'Liga Profesional': 87913,  // LPF 2026 Apertura
    'Primera Nacional': 87940,  // Primera Nacional 2026
    'La Liga': 77559,           // LaLiga 25/26
    'Premier League': 76986,    // Premier League 25/26
}

// Cache for auto-detected season IDs
const seasonIdCache: Record<number, number> = {}

// Auto-detect current season ID if hardcoded one fails
async function getSeasonId(ligaName: string): Promise<number | null> {
    const tournamentId = TOURNAMENT_IDS[ligaName]
    if (!tournamentId) return null

    // Try hardcoded first
    if (SEASON_IDS[ligaName]) return SEASON_IDS[ligaName]

    // Check cache
    if (seasonIdCache[tournamentId]) return seasonIdCache[tournamentId]

    // Auto-detect from API
    try {
        const data = await fetchSofascore<{
            seasons: { id: number; name: string; year: string }[]
        }>(`/unique-tournament/${tournamentId}/seasons`)

        if (data?.seasons?.[0]) {
            seasonIdCache[tournamentId] = data.seasons[0].id
            console.log(`[Scraper] Auto-detected season for ${ligaName}: ${data.seasons[0].name} (${data.seasons[0].id})`)
            return data.seasons[0].id
        }
    } catch (e) {
        console.warn(`[Scraper] Failed to auto-detect season for ${ligaName}`)
    }

    return null
}


interface SofascoreEvent {
    id: number
    slug: string
    startTimestamp: number
    status: {
        code: number
        description: string
        type: string // 'notstarted' | 'inprogress' | 'finished'
    }
    homeTeam: {
        id: number
        name: string
        shortName: string
    }
    awayTeam: {
        id: number
        name: string
        shortName: string
    }
    homeScore?: {
        current?: number
        display?: number
    }
    awayScore?: {
        current?: number
        display?: number
    }
    tournament: {
        name: string
        uniqueTournament: {
            id: number
            name: string
        }
    }
    roundInfo?: {
        round: number
    }
    time?: {
        currentPeriodStartTimestamp?: number
    }
}

interface SofascoreStandingRow {
    position: number
    team: {
        id: number
        name: string
        shortName: string
    }
    matches: number
    wins: number
    draws: number
    losses: number
    scoresFor: number
    scoresAgainst: number
    points: number
    id: number
}

async function fetchSofascore<T>(endpoint: string): Promise<T | null> {
    try {
        const res = await fetch(`${SOFASCORE_BASE}${endpoint}`, {
            headers: HEADERS,
            next: { revalidate: 300 }, // 5 min cache
        })

        if (!res.ok) {
            console.error(`[Scraper] Error ${res.status}: ${endpoint}`)
            return null
        }

        return await res.json()
    } catch (error) {
        console.error('[Scraper] Fetch error:', error)
        return null
    }
}

// Get team logo URL from Sofascore
function getTeamLogo(teamId: number): string {
    return `https://api.sofascore.com/api/v1/team/${teamId}/image`
}

// Map Sofascore status to our app status
function mapStatus(type: string): 'PREVIA' | 'EN_JUEGO' | 'FINALIZADO' {
    if (type === 'notstarted') return 'PREVIA'
    if (type === 'finished') return 'FINALIZADO'
    return 'EN_JUEGO' // inprogress, etc.
}

// Adapt Sofascore event to our Partido type
function adaptEvent(event: SofascoreEvent) {
    return {
        id: event.id,
        liga: event.tournament.uniqueTournament.name,
        equipo_local: event.homeTeam.name,
        equipo_visitante: event.awayTeam.name,
        fecha_inicio: new Date(event.startTimestamp * 1000).toISOString(),
        estado: mapStatus(event.status.type),
        goles_local: event.homeScore?.current ?? event.homeScore?.display ?? undefined,
        goles_visitante: event.awayScore?.current ?? event.awayScore?.display ?? undefined,
        logo_local: getTeamLogo(event.homeTeam.id),
        logo_visitante: getTeamLogo(event.awayTeam.id),
        fixture_id: event.id,
    }
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get fixtures for a league on a specific date range (scraping Sofascore)
 */
export async function scrapeFixtures(ligaName: string) {
    const tournamentId = TOURNAMENT_IDS[ligaName]
    if (!tournamentId) return []

    // Fetch today's matches + yesterday + tomorrow (3 days)
    const dates: string[] = []
    for (let i = -1; i <= 1; i++) {
        const d = new Date()
        d.setDate(d.getDate() + i)
        dates.push(d.toISOString().split('T')[0])
    }

    const allEvents: SofascoreEvent[] = []

    for (const date of dates) {
        const data = await fetchSofascore<{ events: SofascoreEvent[] }>(
            `/sport/football/scheduled-events/${date}`
        )
        if (data?.events) {
            const filtered = data.events.filter(
                e => e.tournament?.uniqueTournament?.id === tournamentId
            )
            allEvents.push(...filtered)
        }
    }

    // De-duplicate by event ID
    const uniqueEvents = [...new Map(allEvents.map(e => [e.id, e])).values()]

    return uniqueEvents.map(adaptEvent)
}

/**
 * Get fixtures for ALL configured leagues on today's date
 */
export async function scrapeTodayAllLeagues() {
    const today = new Date().toISOString().split('T')[0]
    const data = await fetchSofascore<{ events: SofascoreEvent[] }>(
        `/sport/football/scheduled-events/${today}`
    )

    if (!data?.events) return []

    const tournamentIds = new Set(Object.values(TOURNAMENT_IDS))
    const filtered = data.events.filter(
        e => tournamentIds.has(e.tournament?.uniqueTournament?.id)
    )

    return filtered.map(adaptEvent)
}

/**
 * Get current standings for a league (scraping Sofascore)
 */
export async function scrapeStandings(ligaName: string) {
    const tournamentId = TOURNAMENT_IDS[ligaName]
    if (!tournamentId) return []
    const seasonId = await getSeasonId(ligaName)
    if (!seasonId) return []

    const data = await fetchSofascore<{
        standings: { rows: SofascoreStandingRow[] }[]
    }>(`/unique-tournament/${tournamentId}/season/${seasonId}/standings/total`)

    if (!data?.standings?.[0]?.rows) return []

    return data.standings[0].rows.map(row => ({
        rank: row.position,
        team: {
            id: row.team.id,
            name: row.team.name,
            logo: getTeamLogo(row.team.id),
        },
        points: row.points,
        goalsDiff: row.scoresFor - row.scoresAgainst,
        group: '',
        form: '',
        status: '',
        description: null,
        all: {
            played: row.matches,
            win: row.wins,
            draw: row.draws,
            lose: row.losses,
            goals: {
                for: row.scoresFor,
                against: row.scoresAgainst,
            },
        },
        home: null,
        away: null,
        update: new Date().toISOString(),
    }))
}

/**
 * Get top scorers for a league (scraping Sofascore)
 */
export async function scrapeTopScorers(ligaName: string) {
    const tournamentId = TOURNAMENT_IDS[ligaName]
    if (!tournamentId) return []
    const seasonId = await getSeasonId(ligaName)
    if (!seasonId) return []

    const data = await fetchSofascore<{
        topPlayers: {
            goals: {
                playerId: number
                player: {
                    id: number
                    name: string
                    slug: string
                    shortName: string
                    team: {
                        id: number
                        name: string
                    }
                    userCount: number
                    position: string
                    country: {
                        name: string
                    }
                }
                statistics: {
                    goals: number
                    assists?: number
                    appearances: number
                }
                team: {
                    id: number
                    name: string
                }
            }[]
        }
    }>(`/unique-tournament/${tournamentId}/season/${seasonId}/top-players/overall`)

    if (!data?.topPlayers?.goals) return null

    return data.topPlayers.goals.slice(0, 20).map(item => ({
        player: {
            id: item.player.id,
            name: item.player.name,
            firstname: item.player.shortName,
            lastname: '',
            age: 0,
            nationality: item.player.country?.name || '',
            photo: `https://api.sofascore.com/api/v1/player/${item.player.id}/image`,
        },
        statistics: [{
            team: {
                id: item.team.id,
                name: item.team.name,
                logo: getTeamLogo(item.team.id),
            },
            league: { id: tournamentId, name: ligaName, country: '', logo: '', season: 2025 },
            games: {
                appearences: item.statistics.appearances || 0,
                lineups: 0,
                minutes: 0,
                number: null,
                position: item.player.position || '',
                rating: '',
                captain: false,
            },
            goals: {
                total: item.statistics.goals || 0,
                conceded: 0,
                assists: item.statistics.assists ?? null,
                saves: null,
            },
        }],
    }))
}
