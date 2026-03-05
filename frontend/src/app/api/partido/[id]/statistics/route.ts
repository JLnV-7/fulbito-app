// src/app/api/partido/[id]/statistics/route.ts
import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY
const API_URL = 'https://v3.football.api-sports.io'

interface StatEntry {
    type: string
    value: string | number | null
}

interface TeamStats {
    team: { id: number; name: string; logo: string }
    statistics: StatEntry[]
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!API_KEY) {
        return NextResponse.json({ stats: null })
    }

    try {
        const res = await fetch(`${API_URL}/fixtures/statistics?fixture=${id}`, {
            headers: {
                'x-apisports-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io',
            },
            next: { revalidate: 120 },
        })

        if (!res.ok) {
            return NextResponse.json({ stats: null })
        }

        const data = await res.json()
        const teams: TeamStats[] = data.response || []

        if (teams.length < 2) {
            return NextResponse.json({ stats: null })
        }

        // Parse stats into clean format
        const getStat = (team: TeamStats, type: string): string | number => {
            const stat = team.statistics.find(s => s.type === type)
            return stat?.value ?? 0
        }

        const stats = {
            local: {
                name: teams[0].team.name,
                logo: teams[0].team.logo,
                possession: getStat(teams[0], 'Ball Possession'),
                shots: getStat(teams[0], 'Total Shots'),
                shots_on_target: getStat(teams[0], 'Shots on Goal'),
                corners: getStat(teams[0], 'Corner Kicks'),
                fouls: getStat(teams[0], 'Fouls'),
                yellow_cards: getStat(teams[0], 'Yellow Cards'),
                red_cards: getStat(teams[0], 'Red Cards'),
                offsides: getStat(teams[0], 'Offsides'),
                passes_total: getStat(teams[0], 'Total passes'),
                passes_accurate: getStat(teams[0], 'Passes accurate'),
                expected_goals: getStat(teams[0], 'expected_goals'),
            },
            visitante: {
                name: teams[1].team.name,
                logo: teams[1].team.logo,
                possession: getStat(teams[1], 'Ball Possession'),
                shots: getStat(teams[1], 'Total Shots'),
                shots_on_target: getStat(teams[1], 'Shots on Goal'),
                corners: getStat(teams[1], 'Corner Kicks'),
                fouls: getStat(teams[1], 'Fouls'),
                yellow_cards: getStat(teams[1], 'Yellow Cards'),
                red_cards: getStat(teams[1], 'Red Cards'),
                offsides: getStat(teams[1], 'Offsides'),
                passes_total: getStat(teams[1], 'Total passes'),
                passes_accurate: getStat(teams[1], 'Passes accurate'),
                expected_goals: getStat(teams[1], 'expected_goals'),
            }
        }

        return NextResponse.json({ stats })
    } catch {
        return NextResponse.json({ stats: null })
    }
}
