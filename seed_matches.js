// script to seed some matches directly to Supabase
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: 'frontend/.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)
const tomorrow = new Date(today)
tomorrow.setDate(today.getDate() + 1)

const mockMatches = [
    {
        fixture_id: 9991,
        liga: 'Liga Profesional',
        equipo_local: 'River Plate',
        equipo_visitante: 'Boca Juniors',
        fecha_inicio: yesterday.toISOString(),
        estado: 'FINALIZADO',
        goles_local: 3,
        goles_visitante: 1,
        logo_local: 'https://media.api-sports.io/football/teams/435.png',
        logo_visitante: 'https://media.api-sports.io/football/teams/451.png'
    },
    {
        fixture_id: 9992,
        liga: 'Liga Profesional',
        equipo_local: 'Racing Club',
        equipo_visitante: 'Independiente',
        fecha_inicio: today.toISOString(),
        estado: 'EN_JUEGO',
        goles_local: 2,
        goles_visitante: 1,
        logo_local: 'https://media.api-sports.io/football/teams/436.png',
        logo_visitante: 'https://media.api-sports.io/football/teams/438.png'
    },
    {
        fixture_id: 9993,
        liga: 'Champions League',
        equipo_local: 'Real Madrid',
        equipo_visitante: 'Manchester City',
        fecha_inicio: tomorrow.toISOString(),
        estado: 'PREVIA',
        logo_local: 'https://media.api-sports.io/football/teams/541.png',
        logo_visitante: 'https://media.api-sports.io/football/teams/50.png'
    }
]

async function seedMatches() {
    console.log('Seeding matches...')
    const { data, error } = await supabase
        .from('partidos')
        .upsert(mockMatches, { onConflict: 'fixture_id' })
        .select()

    if (error) {
        console.error('Error seeding matches:', error)
    } else {
        console.log('Successfully seeded:', data.length, 'matches')
        console.log('IDs to test with:')
        data.forEach(m => console.log(`- ${m.equipo_local} vs ${m.equipo_visitante} (${m.estado}): /partido/${m.id}`))
    }
}

seedMatches()
