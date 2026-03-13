import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const matchId = resolvedParams.id;

  try {
    // Intentar buscar metadata del partido
    const { data: partido } = await supabase
      .from('partidos')
      .select('equipo_local, equipo_visitante, goles_local, goles_visitante, estado, liga')
      .eq('id', matchId)
      .maybeSingle()

    if (partido) {
      const isFinished = partido.estado === 'FINALIZADO' && partido.goles_local !== null;
      const score = isFinished ? `(${partido.goles_local} - ${partido.goles_visitante})` : '';
      const title = `${partido.equipo_local} vs ${partido.equipo_visitante} ${score} | ${partido.liga || 'FutLog'}`
      
      return {
        title,
        description: `Entrá a ver los detalles, puntuar jugadores, debatir en vivo y dejar tu reseña del partido entre ${partido.equipo_local} y ${partido.equipo_visitante}.`,
        openGraph: {
          title,
          description: `Formaciones, chat en vivo y reseñas de la comunidad para ${partido.equipo_local} vs ${partido.equipo_visitante}.`,
          type: 'website',
          siteName: 'FutLog'
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description: `Mirá todos los detalles y reseñas de ${partido.equipo_local} vs ${partido.equipo_visitante} en FutLog.`
        }
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
  }

  // Fallback genérico
  return {
    title: 'Detalle del Partido | FutLog',
    description: 'Ver detalles, interactuar en vivo y opinar sobre el partido.',
  }
}

export default function PartidoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
