import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY')

Deno.serve(async (req) => {
    const { record } = await req.json()
    const { user_id, badge_id } = record

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if the user has notifications enabled for badges
    const { data: profile } = await supabase
        .from('profiles')
        .select('notification_prefs')
        .eq('id', user_id)
        .single()

    if (profile?.notification_prefs && profile.notification_prefs.insignias === false) {
        return new Response(JSON.stringify({ message: 'User disabled badge notifications' }), { status: 200 })
    }

    // Get Badge details (assuming you have a 'badges' table or logic to find name by ID)
    let badgeName = "Insignia nueva"
    const { data: badgeData } = await supabase.from('badges').select('name').eq('id', badge_id).single()
    if (badgeData?.name) {
        badgeName = badgeData.name
    }

    // Send notification via OneSignal
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_external_user_ids: [user_id],
            contents: { en: `¡Desbloqueaste la insignia: ${badgeName}! 🎖️` },
            headings: { en: 'Nuevo Logro Desbloqueado' },
            data: { url: `/perfil` }
        })
    })

    const result = await response.json()
    return new Response(JSON.stringify(result), { status: 200 })
})
