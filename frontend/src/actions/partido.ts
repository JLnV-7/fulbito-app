'use server'

import { supabase } from '@/lib/supabase'

// Edge runtime para abaratar costos y bajar latencias
// export const runtime = 'edge'

export async function generateAiSummary(partidoId: number) {
  try {
    // 1. Fetch partido details
    const { data: partido, error: partidoError } = await supabase
      .from('partidos')
      .select('*, equipo_local, equipo_visitante, goles_local, goles_visitante, liga, estado, ia_summary, ia_generated_at')
      .eq('id', partidoId)
      .single()

    if (partidoError || !partido) {
        return { success: false, error: 'Partido no encontrado' }
    }

    if (partido.estado !== 'FINALIZADO') {
        return { success: false, error: 'El partido aún no ha finalizado' }
    }

    // Si ya existe la crónica, la devolvemos para no gastar tokens
    if (partido.ia_summary) {
        return { success: true, summary: partido.ia_summary }
    }

    // 2. Fetch match events (goles, tarjetas) para enriquecer el relato
    const { data: events, error: eventsError } = await supabase
      .from('match_events') // asumimos que existe o fallback a array vacío
      .select('*')
      .eq('partido_id', partidoId)
      .order('minuto', { ascending: true })
      
    const eventosStr = eventsError || !events || events.length === 0 
        ? 'No hay eventos detallados (solo resultado).' 
        : events.filter(e => ['gol', 'roja'].includes(e.tipo)).map(e => `${e.minuto}': ${e.tipo} de ${e.jugador} (${e.equipo})`).join(', ');

    // 3. Prompt setup
    const prompt = `Sos un relator argentino clásico, mezcla entre Mariano Closs, el Bambino Pons, y un hincha de la cancha. 
Redactá una crónica apasionada y divertida del partido en máximo 220 palabras.
Usá lenguaje rioplatense, emojis sutiles y algo de humor. 
Nunca digas "según los datos". Contalo como si lo estuvieras relatando en vivo de forma épica.

Partido: ${partido.equipo_local} ${partido.goles_local} - ${partido.goles_visitante} ${partido.equipo_visitante}
Liga: ${partido.liga}
Goles y eventos destacados: ${eventosStr}

Escribí en markdown simple, empezando con un título épico (usá ### o **). No uses viñetas aburridas, hacelo como una crónica de la revista El Gráfico u Olé.`;

    // 4. API Call a Groq (o OpenAI según la variable)
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
        // Fallback Mock si no hay key
        return { 
            success: true, 
            summary: `### ¡Qué partido, señores! 🎙️⚽\n\nEl encuentro entre **${partido.equipo_local}** y **${partido.equipo_visitante}** ya está en los libros de historia con un ${partido.goles_local}-${partido.goles_visitante}.\n\n_(Nota: Configurá tu GROQ_API_KEY o OPENAI_API_KEY en Vercel para ver la crónica generada por IA)_` 
        }
    }

    const isGroq = !!process.env.GROQ_API_KEY
    const endpoint = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions'
    const model = isGroq ? 'llama-3.1-70b-versatile' : 'gpt-4o-mini'

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.8,
        messages: [
          { role: 'system', content: 'Sos el mejor cronista de fútbol de Argentina.' },
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!response.ok) {
        throw new Error(`Error de IA: ${response.statusText}`)
    }

    const aiData = await response.json()
    const generatedText = aiData.choices[0].message.content

    // 5. Guardar en Supabase para cachear internamente
    await supabase
      .from('partidos')
      .update({
          ia_summary: generatedText,
          ia_generated_at: new Date().toISOString(),
          ia_model: model
      })
      .eq('id', partidoId)

    return { success: true, summary: generatedText }

  } catch (error: any) {
    console.error('Error generando IA summary:', error)
    return { success: false, error: error.message }
  }
}
