// src/app/api/partido/[id]/lineups/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_KEY = process.env.API_FOOTBALL_KEY

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

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 })
        }
        const supabase = createClient(supabaseUrl, supabaseKey)

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

        // --- MOCK FALLBACK DEMO PARA ALINEACIONES ---
        if (fixtureId >= 9991 && fixtureId <= 9993) {
            return NextResponse.json({
                equipos: [
                    {
                        id: 435,
                        nombre: 'River Plate',
                        logo: 'https://media.api-sports.io/football/teams/435.png',
                        titulares: [
                            { id: 1001, nombre: 'Franco Armani', numero: 1, posicion: 'ARQ' },
                            { id: 1002, nombre: 'Paulo Díaz', numero: 17, posicion: 'DEF' },
                            { id: 1003, nombre: 'Enzo Díaz', numero: 13, posicion: 'DEF' },
                            { id: 1004, nombre: 'Ignacio Fernández', numero: 26, posicion: 'MED' },
                            { id: 1005, nombre: 'Miguel Borja', numero: 9, posicion: 'DEL' }
                        ],
                        suplentes: []
                    },
                    {
                        id: 451,
                        nombre: 'Boca Juniors',
                        logo: 'https://media.api-sports.io/football/teams/451.png',
                        titulares: [
                            { id: 2001, nombre: 'Sergio Romero', numero: 1, posicion: 'ARQ' },
                            { id: 2002, nombre: 'Marcos Rojo', numero: 6, posicion: 'DEF' },
                            { id: 2003, nombre: 'Luis Advíncula', numero: 17, posicion: 'DEF' },
                            { id: 2004, nombre: 'Kevin Zenón', numero: 22, posicion: 'MED' },
                            { id: 2005, nombre: 'Edinson Cavani', numero: 10, posicion: 'DEL' }
                        ],
                        suplentes: []
                    }
                ]
            })
        }
        // ---------------------------------------------

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
