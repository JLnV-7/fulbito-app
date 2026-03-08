import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

Deno.serve(async (req) => {
    const { record } = await req.json()
    const { user_id, partido_id, equipo_local, equipo_visitante, rating_partido, review_title, is_private } = record

    if (is_private) {
        return new Response(JSON.stringify({ message: 'Log is private' }), { status: 200 })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get author username
    const { data: author } = await supabase.from('profiles').select('username').eq('id', user_id).single()
    const authorName = author?.username || 'Un amigo'

    // 2. Get followers of this user who want notifications of this kind
    // There isn't a specific setting for "friends match logs", maybe default to true or add later.
    const { data: follows } = await supabase.from('user_follows').select('follower_id').eq('following_id', user_id)
    if (!follows || follows.length === 0) {
        return new Response(JSON.stringify({ message: 'No followers to notify' }), { status: 200 })
    }

    const followerIds = follows.map(f => f.follower_id)

    // Send notification
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: followerIds,
            contents: { en: `Le dio ${rating_partido} estrellas a ${equipo_local} vs ${equipo_visitante}` },
            headings: { en: `${authorName} reseñó un partido 📝` },
            data: { url: `/perfil/${user_id}` }
        })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { status: 200 })
})
