// src/app/api/partido/[id]/events/route.ts
import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.API_FOOTBALL_KEY
const API_URL = 'https://v3.football.api-sports.io'

interface FixtureEvent {
    time: { elapsed: number; extra: number | null }
    team: { id: number; name: string; logo: string }
    player: { id: number; name: string }
    assist: { id: number | null; name: string | null }
    type: string      // "Goal", "Card", "subst", "Var"
    detail: string    // "Normal Goal", "Yellow Card", "Red Card", "Substitution 1", etc.
    comments: string | null
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    if (!API_KEY) {
        return NextResponse.json({ events: [] })
    }

    try {
        const res = await fetch(`${API_URL}/fixtures/events?fixture=${id}`, {
            headers: {
                'x-apisports-key': API_KEY,
                'x-rapidapi-host': 'v3.football.api-sports.io',
            },
            next: { revalidate: 120 },
        })

        if (!res.ok) {
            return NextResponse.json({ events: [] })
        }

        const data = await res.json()
        const events: FixtureEvent[] = data.response || []

        // Transform to clean format
        const timeline = events.map(e => ({
            minuto: e.time.elapsed + (e.time.extra ? `+${e.time.extra}` : ''),
            tipo: mapEventType(e.type, e.detail),
            jugador: e.player?.name || '',
            asistencia: e.assist?.name || null,
            equipo: e.team?.name || '',
            equipoLogo: e.team?.logo || '',
            detalle: e.detail,
            comentario: e.comments,
        }))

        return NextResponse.json({ events: timeline })
    } catch (error) {
        console.error('Error fetching events:', error)
        return NextResponse.json({ events: [] })
    }
}

function mapEventType(type: string, detail: string): string {
    if (type === 'Goal') {
        if (detail.includes('Penalty')) return 'penalty'
        if (detail.includes('Own')) return 'gol_en_contra'
        return 'gol'
    }
    if (type === 'Card') {
        if (detail.includes('Red')) return 'roja'
        if (detail.includes('Second')) return 'amarilla_roja'
        return 'amarilla'
    }
    if (type === 'subst') return 'cambio'
    if (type === 'Var') return 'var'
    return 'otro'
}
