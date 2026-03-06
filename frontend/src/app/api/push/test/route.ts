import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { userId, title, message, url, type, data } = await request.json()

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
        }

        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
        const restApiKey = process.env.ONESIGNAL_REST_API_KEY

        if (!appId || !restApiKey) {
            return NextResponse.json({
                error: 'OneSignal configuration missing (App ID or REST API Key)',
                details: { appId: !!appId, restApiKey: !!restApiKey }
            }, { status: 500 })
        }

        const body = {
            app_id: appId,
            include_external_user_ids: [userId],
            headings: { en: title || 'FutLog' },
            contents: { en: message || '¡Tenés una nueva notificación!' },
            data: {
                url: url || '/',
                type: type || 'test',
                ...data
            }
        }

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${restApiKey}`
            },
            body: JSON.stringify(body)
        })

        const result = await response.json()

        if (!response.ok) {
            throw new Error(result.errors?.[0] || 'Unknown OneSignal error')
        }

        return NextResponse.json({ success: true, result })
    } catch (error: any) {
        console.error('Error sending test notification:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
