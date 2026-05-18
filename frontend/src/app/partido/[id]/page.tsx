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

// Revalidate all matches every 60 seconds (Incremental Static Regeneration)
export const revalidate = 60
export const dynamicParams = true // Fallback to on-demand generation for non-prerendered matches

// Pre-render superclasicos or highly anticipated matches
export async function generateStaticParams() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    )

    // Pre-render top 20 most recent matches with most logs
    const { data } = await supabase
      .from('partidos')
      .select('id')
      .order('fecha_inicio', { ascending: false })
      .limit(20)

    if (data) {
      return data.map((partido) => ({
        id: String(partido.id),
      }))
    }
  } catch (error) {
    console.error('Error in generateStaticParams:', error)
  }
  return [] // Fallback gracefully
}

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
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const partido = await getPartido(id)

  if (!partido) {
    return { title: 'Partido no encontrado | FutLog' }
  }

  const isPlayed = calcularEstadoPartido(partido.fecha_inicio) === 'FINALIZADO'
  const title = `${partido.equipo_local} ${isPlayed ? `${partido.goles_local} - ${partido.goles_visitante}` : 'vs'} ${partido.equipo_visitante} | FutLog`
  
  // Build OG image URL
  const ogUrl = new URL(`/api/og/partido/${id}`, process.env.NEXT_PUBLIC_BASE_URL || 'https://futlog.app')
  ogUrl.searchParams.set('local', partido.equipo_local)
  ogUrl.searchParams.set('visitante', partido.equipo_visitante)
  if (partido.logo_local) ogUrl.searchParams.set('logoL', partido.logo_local)
  if (partido.logo_visitante) ogUrl.searchParams.set('logoV', partido.logo_visitante)
  ogUrl.searchParams.set('status', calcularEstadoPartido(partido.fecha_inicio))
  if (isPlayed && partido.goles_local !== null && partido.goles_visitante !== null) {
    ogUrl.searchParams.set('gl', String(partido.goles_local))
    ogUrl.searchParams.set('gv', String(partido.goles_visitante))
  }

  return {
    title,
    description: `Puntuá, comentá y mirá las estadísticas de la comunidad para ${partido.equipo_local} vs ${partido.equipo_visitante} en FutLog.`,
    openGraph: {
      title,
      description: `Comunidad FutLog: ${partido.equipo_local} vs ${partido.equipo_visitante}`,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      images: [ogUrl.toString()],
    }
  }
}

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
