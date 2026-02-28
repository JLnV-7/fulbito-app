// src/app/api/debug/scraper/route.ts
import { NextResponse } from 'next/server'

const SOFASCORE_BASE = 'https://api.sofascore.com/api/v1'

export const dynamic = 'force-dynamic'

export async function GET() {
    const results: Record<string, unknown> = {}

    // Test 1: Can we reach Sofascore at all?
    try {
        const res = await fetch(`${SOFASCORE_BASE}/sport/football/scheduled-events/2026-02-28`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            cache: 'no-store',
        })

        results.status = res.status
        results.statusText = res.statusText

        if (res.ok) {
            const data = await res.json()
            const events = data.events || []
            const lpf = events.filter((e: any) => e.tournament?.uniqueTournament?.id === 155)
            const pl = events.filter((e: any) => e.tournament?.uniqueTournament?.id === 17)

            results.totalEvents = events.length
            results.lpfEvents = lpf.length
            results.plEvents = pl.length

            if (lpf.length > 0) {
                results.lpfSample = lpf.map((e: any) => ({
                    home: e.homeTeam.name,
                    away: e.awayTeam.name,
                    status: e.status.type,
                }))
            }
        } else {
            const text = await res.text()
            results.errorBody = text.slice(0, 500)
        }
    } catch (error) {
        results.fetchError = String(error)
    }

    // Test 2: Standings
    try {
        const res = await fetch(`${SOFASCORE_BASE}/unique-tournament/155/season/87913/standings/total`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            cache: 'no-store',
        })

        if (res.ok) {
            const data = await res.json()
            if (data.standings?.[0]?.rows) {
                results.standingsCount = data.standings[0].rows.length
                results.standingsTop3 = data.standings[0].rows.slice(0, 3).map((r: any) => ({
                    position: r.position,
                    team: r.team.name,
                    points: r.points,
                    matches: r.matches,
                }))
            }
        } else {
            results.standingsStatus = res.status
            results.standingsError = await res.text().then(t => t.slice(0, 200))
        }
    } catch (error) {
        results.standingsError = String(error)
    }

    return NextResponse.json(results)
}
