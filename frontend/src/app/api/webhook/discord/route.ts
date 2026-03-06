import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { rating, comment, user_id } = body

        const webhookUrl = process.env.DISCORD_WEBHOOK_URL

        if (!webhookUrl) {
            // Webhook is not configured, which is fine, just return success
            return NextResponse.json({ success: true, message: 'No webhook configured' })
        }

        // Build Discord message payload
        const stars = '⭐'.repeat(rating)
        const embed = {
            title: '¡Nuevo Feedback de Usuario! 📢',
            color: rating <= 2 ? 0xff4444 : rating === 3 ? 0xffbb33 : 0x00c851, // Red for bad, orange neutral, green good
            fields: [
                {
                    name: 'Calificación',
                    value: `${stars} (${rating}/5)`,
                    inline: true
                },
                {
                    name: 'Usuario ID',
                    value: user_id ? `\`${user_id}\`` : 'Anónimo',
                    inline: true
                },
                {
                    name: 'Comentario',
                    value: comment ? `"${comment}"` : '*Sin comentario*',
                    inline: false
                }
            ],
            timestamp: new Date().toISOString()
        }

        const discordPayload = {
            username: 'FutLog Feedback Bot',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/864/864685.png', // Robot icon
            embeds: [embed]
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordPayload)
        })

        if (!response.ok) {
            throw new Error(`Discord API responded with ${response.status}`)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error sending Discord webhook:', error)
        return NextResponse.json({ success: false, error: 'Hubo un error enviando el webhook' }, { status: 500 })
    }
}
