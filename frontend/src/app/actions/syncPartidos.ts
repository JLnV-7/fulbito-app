// src/app/actions/syncPartidos.ts
'use server'

import { createClient } from '@supabase/supabase-js'
import type { Partido } from '@/types'
import { scrapeSofascoreLiveEvents, normalizeTeamName } from '@/lib/scraper_sofascore'

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
            break
        }

        if (data) {
            allUpserted.push(...data as Partido[])
        }
    }

    if (allUpserted.length > 0) {
        return allUpserted
    }

    const fixtureIds = rows.map(r => r.fixture_id)
    const { data: existing } = await supabaseAdmin
        .from('partidos')
        .select('*')
        .in('fixture_id', fixtureIds)

    return (existing as Partido[]) || []
}

/**
 * Fetches live scores from SofaScore and updates matches in the database
 * that are currently 'EN_JUEGO' or 'PREVIA' happening today.
 */
export async function syncLivePartidosToSupabase() {
    const liveEvents = await scrapeSofascoreLiveEvents()
    if (!liveEvents || liveEvents.length === 0) return { updated: 0 }

    // Get active matches from Supabase
    const { data: activeMatches } = await supabaseAdmin
        .from('partidos')
        .select('id, equipo_local, equipo_visitante, estado, goles_local, goles_visitante')
        .in('estado', ['PREVIA', 'EN_JUEGO'])

    if (!activeMatches || activeMatches.length === 0) return { updated: 0 }

    const updates: any[] = []

    for (const match of activeMatches) {
        const normLocalDb = normalizeTeamName(match.equipo_local)
        const normVisitanteDb = normalizeTeamName(match.equipo_visitante)

        // Find matching live event
        const liveEvent = liveEvents.find(e => {
            const normLocalLive = normalizeTeamName(e.homeTeam.name)
            const normShortLocalLive = normalizeTeamName(e.homeTeam.shortName || '')
            const normVisitanteLive = normalizeTeamName(e.awayTeam.name)
            const normShortVisitanteLive = normalizeTeamName(e.awayTeam.shortName || '')

            // Match if either long or short names match
            const homeMatches = normLocalDb.includes(normLocalLive) || normLocalLive.includes(normLocalDb) ||
                (normShortLocalLive && (normLocalDb.includes(normShortLocalLive) || normShortLocalLive.includes(normLocalDb)))

            const awayMatches = normVisitanteDb.includes(normVisitanteLive) || normVisitanteLive.includes(normVisitanteDb) ||
                (normShortVisitanteLive && (normVisitanteDb.includes(normShortVisitanteLive) || normShortVisitanteLive.includes(normVisitanteDb)))

            return homeMatches && awayMatches
        })

        if (liveEvent) {
            let newState = match.estado
            const statusCode = liveEvent.status.code

            // Map SofaScore status codes to Fulbitoo states
            // > 0 usually means in progress, 100 is ended
            if (statusCode === 100) newState = 'FINALIZADO'
            else if (statusCode > 0 && statusCode < 100) newState = 'EN_JUEGO'

            const newGolesLocal = liveEvent.homeScore.current ?? liveEvent.homeScore.display ?? match.goles_local
            const newGolesVisitante = liveEvent.awayScore.current ?? liveEvent.awayScore.display ?? match.goles_visitante

            if (
                match.estado !== newState ||
                match.goles_local !== newGolesLocal ||
                match.goles_visitante !== newGolesVisitante
            ) {
                updates.push({
                    id: match.id,
                    estado: newState,
                    goles_local: newGolesLocal,
                    goles_visitante: newGolesVisitante,
                })
            }
        }
    }

    if (updates.length > 0) {
        for (const update of updates) {
            await supabaseAdmin
                .from('partidos')
                .update({
                    estado: update.estado,
                    goles_local: update.goles_local,
                    goles_visitante: update.goles_visitante
                })
                .eq('id', update.id)
        }
    }

    return { updated: updates.length }
}
