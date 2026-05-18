'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ─── Types ────────────────────────────────────────────────────────────────
export interface VotoPayload {
  partido_id: string
  equipo_local: string
  equipo_visitante: string
  logo_local?: string
  logo_visitante?: string
  liga?: string
  goles_local?: number
  goles_visitante?: number
  rating_partido: number          // 1-10 (se normaliza a 0.5-5 estrellas)
  rating_arbitro?: number         // 1-5
  rating_atmosfera?: number       // 1-5
  rating_garra?: number           // 1-5
  rating_dt?: number              // 1-5
  jugador_estrella?: string
  jugador_villano?: string
  review_text?: string
  chips?: string[]                // tags seleccionados
}

export interface VotoResult {
  success: boolean
  error?: string
  matchLogId?: string
}

// ─── Server Action ────────────────────────────────────────────────────────
export async function guardarVotoAction(payload: VotoPayload): Promise<VotoResult> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  // 1. Verificar auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'No autenticado' }
  }

  // 2. Normalizar rating de 1-10 a 0.5-5 (la tabla usa estrellas de 0.5-5)
  const ratingNormalizado = Math.max(0.5, Math.min(5, payload.rating_partido / 2))

  try {
    // 3. Upsert en match_logs
    const { data: newLog, error: upsertError } = await supabase
      .from('match_logs')
      .upsert({
        user_id: user.id,
        partido_id: String(payload.partido_id),
        match_type: 'tv' as const,
        equipo_local: payload.equipo_local,
        equipo_visitante: payload.equipo_visitante,
        logo_local: payload.logo_local,
        logo_visitante: payload.logo_visitante,
        liga: payload.liga,
        goles_local: payload.goles_local,
        goles_visitante: payload.goles_visitante,
        fecha_partido: new Date().toISOString(),
        rating_partido: ratingNormalizado,
        rating_arbitro: payload.rating_arbitro,
        rating_atmosfera: payload.rating_atmosfera,
        rating_garra: payload.rating_garra,
        rating_dt: payload.rating_dt,
        jugador_estrella: payload.jugador_estrella,
        jugador_villano: payload.jugador_villano,
        review_text: payload.review_text?.trim() || null,
        is_spoiler: false,
        is_private: false,
        watched_at: new Date().toISOString(),
        tags: payload.chips || [],
      }, { onConflict: 'user_id,partido_id' })
      .select()
      .single()

    if (upsertError) throw upsertError

    return { success: true, matchLogId: newLog?.id }
  } catch (err: any) {
    console.error('[guardarVotoAction]', err)
    return { success: false, error: err.message || 'Error al guardar' }
  }
}

// ─── Helper: obtener voto existente del usuario ──────────────────────────
export async function obtenerVotoExistente(partidoId: string) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('match_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('partido_id', String(partidoId))
    .single()

  return data
}
