import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

Deno.serve(async (req) => {
    const { record } = await req.json()
    const { user_id, puntos, partido_id } = record

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if the user has notifications enabled for prode results
    const { data: profile } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', user_id)
        .single()

    if (profile?.notification_prefs && profile.notification_prefs.resultadoProde === false) {
        return new Response(JSON.stringify({ message: 'User disabled prode notifications' }), { status: 200 })
    }

    // Get match name
    let matchName = "Un partido"
    const { data: matchData } = await supabase.from('partidos').select('equipo_local, equipo_visitante').eq('id', partido_id).single()
    if (matchData) {
        matchName = `${matchData.equipo_local} vs ${matchData.equipo_visitante}`
    }

    // Send notification
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [user_id],
            contents: { en: `Sumaste ${puntos} puntos en el prode de ${matchName} 🎯` },
            headings: { en: '¡Resultados del Prode!' },
            data: { url: `/ranking` }
        })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { status: 200 })
})
