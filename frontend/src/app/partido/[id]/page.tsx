'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { calcularEstadoPartido } from '@/lib/helpers'
import { CanchaFormacion } from '@/components/CanchaFormacion'
import { CommentSection } from '@/components/CommentSection'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { ShareButton } from '@/components/ShareButton'
import { MatchStats } from '@/components/MatchStats'
import { HeadToHead } from '@/components/HeadToHead'
import type { Partido, EstadoPartido } from '@/types'
import { fetchFixtureByIdAction } from '@/app/actions/football'
import confetti from 'canvas-confetti'

interface JugadorAPI {
  id: number
  nombre: string
  numero: number
  posicion: string
}

interface EquipoLineup {
  id: number
  nombre: string
  logo: string
  titulares: JugadorAPI[]
  suplentes: JugadorAPI[]
}

export default function PartidoPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [partido, setPartido] = useState<Partido | null>(null)
  const [estado, setEstado] = useState<EstadoPartido>('PREVIA')
  const [equipos, setEquipos] = useState<EquipoLineup[]>([])
  const [votos, setVotos] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingLineups, setLoadingLineups] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const formacionesRef = useRef<HTMLDivElement>(null)

  // Cargar datos del partido (desde API o DB)
  useEffect(() => {
    const fetchPartido = async () => {
      try {
        setLoading(true)
        setError(null)

        const matchId = Number(id)

        if (isNaN(matchId)) {
          // ID no es numérico — puede ser un UUID de la tabla partidos en Supabase
          const { data: dbPartido } = await supabase
            .from('partidos')
            .select('*')
            .eq('id', id)
            .single()

          if (dbPartido) {
            setPartido(dbPartido as Partido)
            setEstado(calcularEstadoPartido(dbPartido.fecha_inicio))
          } else {
            // Podría ser un match_log ID — redirigir
            router.replace(`/log/${id}`)
            return
          }
        } else {
          // ID numérico — buscar en la API
          const data = await fetchFixtureByIdAction(matchId)
          if (data) {
            setPartido(data)
            setEstado(calcularEstadoPartido(data.fecha_inicio))
          } else {
            throw new Error('Partido no encontrado en API')
          }
        }
      } catch (err) {
        console.error('Error cargando partido:', err)
        setError('No pudimos cargar el partido. Asegurate de entrar desde la lista de Fixtures.')
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchPartido()
  }, [id, router])

  // Cargar alineaciones cuando el partido está finalizado
  useEffect(() => {
    const fetchLineups = async () => {
      if (estado !== 'FINALIZADO' || !partido) return

      try {
        setLoadingLineups(true)
        // Nota: Si usamos API real, idealmente también deberíamos traer lineups de la API.
        // Por ahora mantenemos la lógica existente que llamaba a un endpoint local /api/partido/.../lineups
        // Ese endpoint probablemente busca en DB. Si el partido viene de API, quizás ese endpoint falle si no existe en DB.
        // TODO: Migrar lineups a API-Football también.
        const res = await fetch(`/api/partido/${partido.id}/lineups`)
        const data = await res.json()

        if (data.equipos && data.equipos.length > 0) {
          setEquipos(data.equipos)
        }
      } catch (err) {
        // Silently fail for lineups if not found
        console.error('Error cargando alineaciones:', err)
      } finally {
        setLoadingLineups(false)
      }
    }

    fetchLineups()
  }, [estado, partido])

  const handleVotar = useCallback((jugadorId: number, nota: number) => {
    setVotos(prev => ({
      ...prev,
      [jugadorId]: nota
    }))
  }, [])

  const handleGuardarVotos = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/partido/${id}`))
      return
    }

    try {
      setGuardando(true)

      const votosArray = Object.entries(votos).map(([jugadorId, nota]) => ({
        user_id: user.id,
        partido_id: String(id),
        jugador_id: Number(jugadorId),
        nota: nota,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('votaciones')
        .upsert(votosArray, {
          onConflict: 'user_id,partido_id,jugador_id'
        })

      if (insertError) throw insertError

      alert('¡Votos guardados exitosamente! 🎉')
      router.push('/')
    } catch (err) {
      console.error('Error guardando votos:', err)
      alert('Error al guardar. Intentá de nuevo.')
    } finally {
      setGuardando(false)
    }
  }

  const totalVotados = Object.keys(votos).length
  const totalJugadores = equipos.reduce((acc, eq) => acc + eq.titulares.length, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !partido) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6">
        <ErrorMessage
          message={error || 'Partido no encontrado'}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[#1a1a1a] text-[#f5f5f5] pb-24 md:pt-20">
        {/* Header compacto */}
        <div className="bg-[#242424] border-b border-[#333333]">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push('/')}
                className="text-[#909090] text-sm hover:text-[#f5f5f5] transition-colors"
              >
                ← Volver
              </button>

              <ShareButton
                titulo={`Partido: ${partido.equipo_local} vs ${partido.equipo_visitante}`}
                texto={`¡Mirá y votá en este partido en Fulbito! ${partido.equipo_local} vs ${partido.equipo_visitante}`}
                url={typeof window !== 'undefined' ? window.location.href : ''}
                captureRef={formacionesRef}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#ff6b6b] uppercase tracking-wide">
                  {partido.liga}
                </span>
                <span className={`text-xs font-semibold uppercase px-2 py-1 rounded ${estado === 'PREVIA'
                  ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
                  : estado === 'EN_JUEGO'
                    ? 'bg-[#ff6b6b]/20 text-[#ff6b6b]'
                    : 'bg-[#10b981]/20 text-[#10b981]'
                  }`}>
                  {estado === 'PREVIA' && 'Próximo'}
                  {estado === 'EN_JUEGO' && 'En vivo'}
                  {estado === 'FINALIZADO' && 'Finalizado'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {partido.logo_local && (
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={partido.logo_local}
                          alt={partido.equipo_local}
                          fill
                          className="object-contain"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <span className="font-semibold text-lg">{partido.equipo_local}</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {estado === 'FINALIZADO' && partido.goles_local !== undefined
                      ? partido.goles_local
                      : <span className="text-[#606060]">-</span>
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {partido.logo_visitante && (
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <Image
                          src={partido.logo_visitante}
                          alt={partido.equipo_visitante}
                          fill
                          className="object-contain"
                          sizes="40px"
                        />
                      </div>
                    )}
                    <span className="font-semibold text-lg">{partido.equipo_visitante}</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {estado === 'FINALIZADO' && partido.goles_visitante !== undefined
                      ? partido.goles_visitante
                      : <span className="text-[#606060]">-</span>
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
          {estado === 'FINALIZADO' ? (
            loadingLineups ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : equipos.length === 0 ? (
              <div className="bg-[#242424] rounded-lg border border-[#333333] p-10 text-center">
                <p className="text-4xl mb-3">⚽</p>
                <p className="text-[#909090]">Alineaciones no disponibles</p>
              </div>
            ) : (
              <div className="space-y-6">
                <MatchStats />

                <div className="text-center bg-[#242424] rounded-lg border border-[#333333] p-4">
                  <p className="text-sm text-[#909090]">
                    Hacé click en cada jugador para votarlo (1-10)
                  </p>
                </div>

                <div ref={formacionesRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equipos.map((equipo) => (
                    <CanchaFormacion
                      key={equipo.id}
                      jugadores={equipo.titulares}
                      nombreEquipo={equipo.nombre}
                      votos={votos}
                      onVotar={handleVotar}
                      partidoFinalizado={estado === 'FINALIZADO'}
                    />
                  ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a]/95 backdrop-blur-xl 
                                border-t border-[#333333] p-4 md:pb-4 pb-20 z-40">
                  <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <p className="text-xs text-[#909090]">
                      {totalVotados} de {totalJugadores} votados
                    </p>
                    <button
                      onClick={handleGuardarVotos}
                      disabled={guardando || totalVotados === 0}
                      className="bg-[#10b981] hover:bg-[#059669] px-6 py-2.5 rounded-lg font-semibold text-sm
                                disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white"
                    >
                      {guardando ? 'Guardando...' : (user ? 'Guardar' : 'Iniciar sesión para guardar')}
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              <HeadToHead
                equipoLocal={partido.equipo_local}
                equipoVisitante={partido.equipo_visitante}
                logoLocal={partido.logo_local}
                logoVisitante={partido.logo_visitante}
              />

              <div className="bg-[#242424] rounded-lg border border-[#333333] p-8 text-center">
                <p className="text-5xl mb-4">
                  {estado === 'PREVIA' ? '⏳' : '⚽'}
                </p>
                <p className="text-lg font-semibold text-[#f5f5f5] mb-2">
                  {estado === 'PREVIA' ? 'Próximamente' : 'Partido en curso'}
                </p>
                <p className="text-[#909090] text-sm">
                  {estado === 'PREVIA'
                    ? 'La votación estará disponible cuando finalice el partido'
                    : 'Seguí el partido y comentá en vivo'}
                </p>
              </div>

              {estado === 'EN_JUEGO' && <MatchStats />}
            </div>
          )}

          <CommentSection partidoId={String(id)} />
        </div>

        <NavBar />
      </main>
    </>
  )
}