import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const apiKeyFutbol = Deno.env.get('API_KEY_FUTBOL') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Obtener partidos finalizados hoy que no tengan resultado en nuestra DB
    // (Simplificado: buscamos partidos de las últimas 24hs)
    const { data: partidosPendientes } = await supabase
      .from('partidos')
      .select('id, fixture_id')
      .eq('estado', 'EN_JUEGO') // O que hayan pasado su hora de inicio

    console.log(`[Sync] Procesando ${partidosPendientes?.length ?? 0} partidos...`)

    for (const p of (partidosPendientes ?? [])) {
      // Consultar API-Football para cada fixture_id
      const res = await fetch(`https://v3.football.api-sports.io/fixtures?id=${p.fixture_id}`, {
        headers: { 'x-apisports-key': apiKeyFutbol }
      })
      const apiData = await res.json()
      const fixture = apiData.response?.[0]

      if (fixture && fixture.fixture.status.short === 'FT') {
        const golesL = fixture.goals.home
        const golesV = fixture.goals.away

        // A. Actualizar partido
        await supabase
          .from('partidos')
          .update({
            goles_local: golesL,
            goles_visitante: golesV,
            estado: 'FINALIZADO'
          })
          .eq('id', p.id)

        // B. Calcular PRODES para este partido
        const { data: prodes } = await supabase
          .from('prodes')
          .select('id, goals_home, goals_away')
          .eq('fixture_id', p.fixture_id) // O match_id si coincide
          .is('acerto', null)

        for (const prode of (prodes ?? [])) {
           const acerto = (prode.goals_home === golesL && prode.goals_away === golesV)
           await supabase
             .from('prodes')
             .update({ acerto })
             .eq('id', prode.id)
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Sync completado' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
