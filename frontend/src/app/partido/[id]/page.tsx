// src/app/partido/[id]/page.tsx
// ✅ SERVER COMPONENT — fetcha datos ANTES de enviar HTML al cliente
// Antes: 'use client' → usuario ve spinner hasta que JS carga + fetcha
// Después: datos llegan con el HTML → cero loading state inicial

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calcularEstadoPartido } from '@/lib/helpers'
import { fetchFixtureByIdAction } from '@/app/actions/football'
import { syncPartidosToSupabase } from '@/app/actions/syncPartidos'
import { PartidoClient } from './components/PartidoClient'
import type { Partido } from '@/types'

// ─── Server-side data fetching ─────────────────────────────────────────────
async function getPartido(id: string): Promise<Partido | null> {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        // Server Component — solo lectura, no necesitamos setAll
        setAll: () => {},
      },
    }
  )

  const idStr    = String(id)
  const idNum    = Number(id)
  const isUuid   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr)
  const isNumeric = !isNaN(idNum) && idNum > 1000

  // ── 1. Consultar Supabase (camino más rápido — datos ya en DB) ──────────
  const { data: dbPartido } = await (
    isUuid
      ? supabase.from('partidos').select('*').eq('id', idStr)
      : supabase.from('partidos').select('*').eq('fixture_id', isNumeric ? idNum : -1)
  ).single()

  if (dbPartido) {
    const estado = calcularEstadoPartido(dbPartido.fecha_inicio)
    const isLiveOrRecent =
      estado === 'EN_JUEGO' ||
      (estado === 'FINALIZADO' &&
        Date.now() - new Date(dbPartido.fecha_inicio).getTime() < 86_400_000)

    // Si está en juego o terminó hace menos de 24h → refrescar desde API
    if (isLiveOrRecent && isNumeric) {
      try {
        // fetchFixtureByIdAction ya tiene unstable_cache de la sesión 2
        const fresh = await fetchFixtureByIdAction(idNum)
        if (fresh) {
          // Lazy sync sin bloquear — no await
          syncPartidosToSupabase([fresh]).catch(() => {})
          return { ...fresh, id: dbPartido.id } as Partido
        }
      } catch {
        // Si falla la API, usamos lo que tenemos en DB
      }
    }
    return dbPartido as Partido
  }

  // ── 2. No está en DB → buscar en API y sincronizar ─────────────────────
  if (isNumeric) {
    try {
      const data = await fetchFixtureByIdAction(idNum)
      if (data) {
        const synced = await syncPartidosToSupabase([data]).catch(() => null)
        return (synced?.[0] ?? data) as Partido
      }
    } catch {
      return null
    }
  }

  return null
}

// ─── Page ──────────────────────────────────────────────────────────────────
// params debe ser awaitable en Next.js 15
export default async function PartidoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const partido = await getPartido(id)

  // Pasamos los datos como prop → PartidoClient arranca con datos, sin spinner
  return <PartidoClient initialPartido={partido} id={id} />
}
