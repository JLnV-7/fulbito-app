'use server'

export async function fetchTyCNewsAction() {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const res = await fetch('https://www.tycsports.com/rss/futbol.xml', {
            signal: controller.signal,
            next: { revalidate: 300 } // Cachear por 5 minutos
        })

        clearTimeout(timeoutId)

        if (!res.ok) throw new Error(`TyC RSS failed with status ${res.status}`)

        const xmlText = await res.text()

        if (!xmlText.includes('<item>')) {
             throw new Error('Invalid RSS format: No items found')
        }

        // Un parseo de XML muy básico pero eficiente para no instalar dependencias
        const items = xmlText.split('<item>').slice(1) // Ignorar el header del channel

        const parsedItems = items.map(item => {
            const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || 'Sin Título'
            const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '#'
            const descriptionCdata = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || item.match(/<description>(.*?)<\/description>/)?.[1] || ''
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toUTCString()

            // TyC usa enclosure para la imagen
            const enclosureMatch = item.match(/<enclosure[^>]+url="([^"]+)"/)
            const thumbnail = enclosureMatch ? enclosureMatch[1] : ''

            return {
                title: title.trim(),
                link: link.trim(),
                description: descriptionCdata.replace(/<[^>]*>?/gm, '').trim(),
                pubDate,
                thumbnail
            }
        })

        if (parsedItems.length === 0) {
            throw new Error('Parsed items array is empty')
        }

        return parsedItems
    } catch (e: any) {
        console.error("Error in fetchTyCNewsAction:", e.message || e)
        throw new Error(`Failed to fetch news: ${e.message || 'Unknown error'}`)
    }
}
