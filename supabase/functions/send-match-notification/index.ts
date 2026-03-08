import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

Deno.serve(async (req) => {
    const { record, old_record } = await req.json()
    const { id, equipo_local, equipo_visitante, estado, goles_local, goles_visitante } = record

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Determine type of event: match started or goal scored
    let eventType: 'start' | 'goal' | null = null
    let notificationTitle = ''
    let notificationBody = ''

    if (estado === 'EN_JUEGO' && old_record?.estado === 'PREVIA') {
        eventType = 'start'
        notificationTitle = 'Arranca el partido 🏟️'
        notificationBody = `¡Ya están jugando ${equipo_local} vs ${equipo_visitante}!`
    } else if (estado === 'EN_JUEGO' && (goles_local > (old_record?.goles_local || 0) || goles_visitante > (old_record?.goles_visitante || 0))) {
        eventType = 'goal'
        notificationTitle = '¡GOOOOL! ⚽'
        const scoringTeam = goles_local > (old_record?.goles_local || 0) ? equipo_local : equipo_visitante
        notificationBody = `Gol de ${scoringTeam}! ${equipo_local} ${goles_local} - ${goles_visitante} ${equipo_visitante}`
    } else {
        return new Response(JSON.stringify({ message: 'No actionable event' }), { status: 200 })
    }

    // A real implementation would query users whose 'favoritos' array contains one of the teams
    // Or users who made a prediction for this specific team/match.
    // For this prototype, we'll notify users who have the "partidoInicio" / "golFavorito" prefs enabled.

    // In production, we should filter by specific users using Supabase `select` with `contains favoritos` 
    // and batch send. For now we will broadcast or send to all opted_in and rely on Segments in OneSignal.
    // Better: Query users whose notification_prefs is allowed, and filter by equipo favorito.

    const { data: profiles } = await supabase.from('profiles').select('id, equipos_favoritos, notification_prefs')

    // Fallback if profiles is null
    if (!profiles) return new Response(JSON.stringify({ message: 'No profiles' }), { status: 200 })

    const targetUsers = profiles.filter(p => {
        // Here we'd check if the team is in their favorites, but since we just have "equipo" in profile:
        const teamMatch = [equipo_local, equipo_visitante].includes(p.equipos_favoritos) // note: assuming field 'equipos_favoritos' or just 'equipo'
        if (!teamMatch) return false;

        const prefs = p.notification_prefs || {}
        if (eventType === 'start' && prefs.partidoInicio === false) return false;
        if (eventType === 'goal' && prefs.golFavorito === false) return false;

        return true;
    }).map(p => p.id)

    if (targetUsers.length === 0) {
        return new Response(JSON.stringify({ message: 'No target users' }), { status: 200 })
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
            include_external_user_ids: targetUsers,
            contents: { en: notificationBody },
            headings: { en: notificationTitle },
            data: { url: `/partido/${id}` }
        })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { status: 200 })
})
