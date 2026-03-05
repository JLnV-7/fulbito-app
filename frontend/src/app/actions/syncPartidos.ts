// src/app/actions/syncPartidos.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import type { Partido } from '@/types'

// Use service role to bypass RLS for upserts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
})

/**
 * Upserts partidos from the scraper into Supabase using fixture_id as the conflict key.
 * Returns the partidos with their Supabase UUIDs.
 */
export async function syncPartidosToSupabase(
    scrapedPartidos: Omit<Partido, 'created_at'>[]
): Promise<Partido[]> {
    if (!scrapedPartidos || scrapedPartidos.length === 0) return []

    // Prepare rows for upsert — map scraper data to DB columns
    const rows = scrapedPartidos.map(p => ({
        fixture_id: typeof p.id === 'number' ? p.id : parseInt(String(p.id)),
        liga: p.liga,
        equipo_local: p.equipo_local,
        equipo_visitante: p.equipo_visitante,
        fecha_inicio: p.fecha_inicio,
        estado: p.estado || 'PREVIA',
        goles_local: p.goles_local ?? null,
        goles_visitante: p.goles_visitante ?? null,
        logo_local: p.logo_local || '',
        logo_visitante: p.logo_visitante || '',
    }))

    // Upsert in batches of 50 to avoid payload limits
    const BATCH_SIZE = 50
    const allUpserted: Partido[] = []

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE)

        const { data, error } = await supabaseAdmin
            .from('partidos')
            .upsert(batch, { onConflict: 'fixture_id' })
            .select('*')

        if (error) {
            console.error('[SyncPartidos] Upsert error:', error.message)
            // Don't throw — return what we have from Supabase as fallback
            break
        }

        if (data) {
            allUpserted.push(...data as Partido[])
        }
    }

    // If upsert worked, return with Supabase UUIDs
    if (allUpserted.length > 0) {
        return allUpserted
    }

    // Fallback: query Supabase for existing partidos by fixture_id
    const fixtureIds = rows.map(r => r.fixture_id)
    const { data: existing } = await supabaseAdmin
        .from('partidos')
        .select('*')
        .in('fixture_id', fixtureIds)

    return (existing as Partido[]) || []
}
