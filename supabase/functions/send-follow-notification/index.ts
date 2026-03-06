/**
 * This Edge Function triggers every time a new follow is created.
 * It sends a push notification to the user who received the new follower.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

Deno.serve(async (req) => {
    const { record } = await req.json()
    const { follower_id, following_id } = record

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get follower username
    const { data: follower } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', follower_id)
        .single()

    // 2. Check if the "following" user has notifications enabled for follows
    const { data: settings } = await supabase
        .from('user_notifications')
        .select('nuevos_seguidores')
        .eq('user_id', following_id)
        .single()

    if (settings?.nuevos_seguidores === false) {
        return new Response(JSON.stringify({ message: 'User disabled follow notifications' }), { status: 200 })
    }

    // 3. Send notification via OneSignal
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [following_id],
            contents: { en: `¡${follower?.username || 'Alguien'} te empezó a seguir! 👟⚽` },
            headings: { en: 'Nuevo seguidor' },
            url: `https://fulbitoo-delta.vercel.app/perfil/${follower_id}`
        })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { status: 200 })
})
