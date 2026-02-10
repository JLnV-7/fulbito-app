import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getFixturesByDate } from '@/lib/api'
import { LIGAS_MAP, CURRENT_SEASONS } from '@/lib/constants'
import type { ApiFixture } from '@/types/api'

// Inicializar Supabase Admin client (bypass RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

export const dynamic = 'force-dynamic' // No cachear

export async function GET(request: Request) {
    try {
        // 1. Validar autorización
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const today = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'
        let updatedCount = 0
        let errors: string[] = []

        // 2. Iterar por cada liga configurada
        for (const [nombreLiga, idLiga] of Object.entries(LIGAS_MAP)) {
            const season = nombreLiga === 'Liga Profesional' || nombreLiga === 'Primera Nacional'
                ? CURRENT_SEASONS.ARGENTINA
                : CURRENT_SEASONS.EUROPE

            console.log(`Buscando partidos para ${nombreLiga} fecha ${today}...`)

            const fixtures = await getFixturesByDate(idLiga, season, today)

            if (!fixtures || fixtures.length === 0) {
                console.log(`No hay partidos para ${nombreLiga} hoy.`)
                continue
            }

            // 3. Procesar partidos finalizados (FT, AET, PEN)
            const finishedFixtures = fixtures.filter((f: ApiFixture) =>
                ['FT', 'AET', 'PEN'].includes(f.fixture.status.short)
            )

            for (const fixture of finishedFixtures) {
                try {
                    // Intentar actualizar por fixture_id o matching inteligente
                    const { data: existingMatch } = await supabaseAdmin
                        .from('partidos')
                        .select('id, fixture_id')
                        .or(`fixture_id.eq.${fixture.fixture.id},and(equipo_local.ilike.%${fixture.teams.home.name}%,equipo_visitante.ilike.%${fixture.teams.away.name}%)`)
                        .maybeSingle()

                    if (existingMatch) {
                        // Actualizar marcador y estado
                        const { error } = await supabaseAdmin
                            .from('partidos')
                            .update({
                                goles_local: fixture.goals.home,
                                goles_visitante: fixture.goals.away,
                                estado: 'FINALIZADO',
                                fixture_id: fixture.fixture.id // Self-healing: guardar ID si no estaba
                            })
                            .eq('id', existingMatch.id)

                        if (!error) {
                            updatedCount++
                            console.log(`Partido actualizado: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`)
                        } else {
                            errors.push(`Error actualizando ${fixture.fixture.id}: ${error.message}`)
                        }
                    }
                } catch (err) {
                    if (err instanceof Error) {
                        errors.push(`Error procesando fixture ${fixture.fixture.id}: ${err.message}`)
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error) {
        console.error('Cron Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
