// src/app/api/partido/[id]/lineups/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_KEY = process.env.API_FOOTBALL_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface APIPlayer {
    player: {
        id: number
        name: string
        number: number
        pos: string
    }
}

interface APITeamLineup {
    team: {
        id: number
        name: string
        logo: string
    }
    startXI: APIPlayer[]
    substitutes: APIPlayer[]
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        if (!API_KEY) {
            return NextResponse.json(
                { error: 'API key no configurada' },
                { status: 500 }
            )
        }

        // Paso 1: Obtener fixture_id desde Supabase usando el UUID
        const { data: partido, error: dbError } = await supabase
            .from('partidos')
            .select('fixture_id')
            .eq('id', id)
            .single()

        if (dbError || !partido || !partido.fixture_id) {
            return NextResponse.json(
                { error: 'Partido no encontrado o sin fixture_id', equipos: [] },
                { status: 404 }
            )
        }

        const fixtureId = partido.fixture_id

        // Paso 2: Consultar alineaciones usando fixture_id
        const response = await fetch(
            `https://v3.football.api-sports.io/fixtures/lineups?fixture=${fixtureId}`,
            {
                headers: {
                    'x-rapidapi-host': 'v3.football.api-sports.io',
                    'x-rapidapi-key': API_KEY,
                },
                next: { revalidate: 60 }
            }
        )

        if (!response.ok) {
            throw new Error(`API responded with ${response.status}`)
        }

        const data = await response.json()

        if (!data.response || data.response.length === 0) {
            return NextResponse.json(
                { error: 'Alineaciones no disponibles todavía', equipos: [] },
                { status: 200 }
            )
        }

        // Formatear jugadores para el frontend
        const equipos = data.response.map((equipo: APITeamLineup) => ({
            id: equipo.team.id,
            nombre: equipo.team.name,
            logo: equipo.team.logo,
            titulares: equipo.startXI.map((j: APIPlayer) => ({
                id: j.player.id,
                nombre: j.player.name,
                numero: j.player.number,
                posicion: mapearPosicion(j.player.pos),
            })),
            suplentes: equipo.substitutes.map((j: APIPlayer) => ({
                id: j.player.id,
                nombre: j.player.name,
                numero: j.player.number,
                posicion: mapearPosicion(j.player.pos),
            })),
        }))

        return NextResponse.json({ equipos })
    } catch (error) {
        console.error('Error fetching lineups:', error)
        return NextResponse.json(
            { error: 'Error al obtener alineaciones' },
            { status: 500 }
        )
    }
}

function mapearPosicion(pos: string): string {
    const mapa: Record<string, string> = {
        'G': 'ARQ',
        'D': 'DEF',
        'M': 'MED',
        'F': 'DEL',
    }
    return mapa[pos] || pos
}
