import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Función auxiliar para inicializar el cliente solo cuando se llama al endpoint
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  // Evitar que crashee en build time (GitHub Actions) si no hay variables
  if (!supabaseUrl || !supabaseKey) return null
  
  return createClient(supabaseUrl, supabaseKey)
}

// Endpoint ultraligero para un Widget Nativo (iOS/Android) 
// Ejemplo de uso: GET /api/widget/daily-fixture?userId=123
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 })
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 })
    }

    // 1. Obtener el equipo favorito del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('equipo_favorito, is_pro')
      .eq('id', userId)
      .single()

    const equipo = profile?.equipo_favorito || 'Boca Juniors' // Fallback para la demo

    // 2. Aquí idealmente consultaríamos a la API-Football el próximo partido de 'equipo'.
    // Para la infraestructura PWA inicial, devolveremos un payload simulado
    // de un partido que el Widget puede renderizar inmediatamente.
    const widgetPayload = {
      team: equipo,
      hasMatchToday: true,
      match: {
        league: 'Liga Profesional',
        homeTeam: equipo,
        awayTeam: 'River Plate',
        homeLogo: 'https://media.api-sports.io/football/teams/451.png',
        awayLogo: 'https://media.api-sports.io/football/teams/435.png',
        matchTime: '21:00',
        venue: 'La Bombonera'
      },
      isProMember: profile?.is_pro || false,
      deepLink: 'futlog://partido/123456' // Deeplink para la PWA o App Nativa
    }

    return NextResponse.json(widgetPayload, {
      status: 200,
      headers: {
        // Permitir caché agresivo para widgets
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      }
    })
  } catch (error) {
    console.error('Widget API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
