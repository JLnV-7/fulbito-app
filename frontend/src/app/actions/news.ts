'use server'

export async function fetchTyCNewsAction() {
    try {
        const res = await fetch('https://www.tycsports.com/rss/futbol.xml', {
            next: { revalidate: 300 } // Cachear por 5 minutos
        })
        
        if (!res.ok) throw new Error('Failed to fetch RSS')
        
        const xmlText = await res.text()
        
        // Un parseo de XML muy básico pero eficiente para no instalar dependencias
        const items = xmlText.split('<item>').slice(1) // Ignorar el header del channel
        
        const parsedItems = items.map(item => {
            const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
            const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
            const descriptionCdata = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || item.match(/<description>(.*?)<\/description>/)?.[1] || ''
            const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
            
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
        
        return parsedItems
    } catch (e) {
        console.error("Error in fetchTyCNewsAction:", e)
        return null
    }
}
