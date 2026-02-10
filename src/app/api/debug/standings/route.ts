import { NextResponse } from 'next/server'
import { getStandings } from '@/lib/api'
import { LEAGUE_IDS, CURRENT_SEASONS } from '@/lib/constants'

export async function GET() {
    try {
        const leagueId = LEAGUE_IDS.LIGA_PROFESIONAL
        const season = CURRENT_SEASONS.ARGENTINA
        const apiKey = process.env.API_FOOTBALL_KEY

        console.log('Testing Standings API...')
        console.log('API Key present:', !!apiKey)

        const data = await getStandings(leagueId, season)

        return NextResponse.json({
            success: true,
            apiKeyPresent: !!apiKey,
            dataPreview: data ? 'Data received' : 'No data',
            fullData: data
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
