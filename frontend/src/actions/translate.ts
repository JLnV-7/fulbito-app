'use server'

export async function translateText(text: string, targetLang: string = 'español rioplatense (como un hincha de fútbol argentino)') {
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
        // Mock fallback if no API key is provided
        return { 
            success: true, 
            text: `[Traducción IA]: ${text}` 
        }
    }

    const isGroq = !!process.env.GROQ_API_KEY
    const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
    const model = isGroq ? 'llama-3.1-70b-versatile' : 'gpt-4o-mini'

    const prompt = `Sos un traductor experto en jerga futbolera. Traducí el siguiente texto a ${targetLang}. 
    Mantené la emoción y la intención original. Solo devolvé el texto traducido, sin comillas adicionales ni explicaciones.
    
    Texto a traducir:
    "${text}"`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
        throw new Error(`Translation API Error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const translatedString = data.choices[0].message.content.trim()
    
    return { success: true, text: translatedString }
  } catch (err: any) {
    console.error('Translate Error:', err)
    return { success: false, error: err.message || 'Error traduciendo' }
  }
}
