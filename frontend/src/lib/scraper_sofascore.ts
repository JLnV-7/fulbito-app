import 'server-only'

const SOFASCORE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'es-AR,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.sofascore.com/',
    'Origin': 'https://www.sofascore.com'
}

export interface SofaEvent {
    id: number
    homeTeam: { name: string, shortName: string }
    awayTeam: { name: string, shortName: string }
    homeScore: { current?: number, display?: number }
    awayScore: { current?: number, display?: number }
    status: { code: number, description: string, type: string }
    startTimestamp: number
    tournament: { name: string }
}

/**
 * Fetches all live football events from SofaScore
 */
export async function scrapeSofascoreLiveEvents(): Promise<SofaEvent[]> {
    try {
        const response = await fetch('https://api.sofascore.com/api/v1/sport/football/events/live', {
            headers: SOFASCORE_HEADERS,
            next: { revalidate: 30 }
        })

        if (!response.ok) {
            console.error('Sofascore API error:', response.status, response.statusText)
            return []
        }

        const data = await response.json()
        return data.events || []
    } catch (error) {
        console.error('Failed to fetch from Sofascore:', error)
        return []
    }
}

/**
 * Normalizes team names to improve matching
 */
export function normalizeTeamName(name: string) {
    return name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ fc$| cf$| club$| de | atletico | deportivo /g, '')
        .trim()
}
