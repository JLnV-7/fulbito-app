'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [votosGuardados, setVotosGuardados] = useState(false)
  const formacionesRef = useRef<HTMLDivElement>(null)

  // Determinar si estamos en modo votación (formaciones cargadas)
  const isVotingMode = equipos.length > 0 && estado === 'FINALIZADO'

  // Cargar datos del partido (desde API o DB)
  useEffect(() => {
    const fetchPartido = async () => {
      try {
        setLoading(true)
        setError(null)

        const matchId = Number(id)

        if (isNaN(matchId)) {
          const { data: dbPartido } = await supabase
            .from('partidos')
            .select('*')
            .eq('id', id)
            .single()

          if (dbPartido) {
            setPartido(dbPartido as Partido)
            setEstado(calcularEstadoPartido(dbPartido.fecha_inicio))
          } else {
            router.replace(`/log/${id}`)
            return
          }
        } else {
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
        const res = await fetch(`/api/partido/${partido.id}/lineups`)
        const data = await res.json()

        if (data.equipos && data.equipos.length > 0) {
          setEquipos(data.equipos)
        }
      } catch (err) {
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

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.7 },
        colors: ['#10b981', '#ffd700', '#ff6b6b']
      })

      setVotosGuardados(true)

      // Redirect after a short delay
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      console.error('Error guardando votos:', err)
    } finally {
      setGuardando(false)
    }
  }

  const totalVotados = Object.keys(votos).length
  const totalJugadores = equipos.reduce((acc, eq) => acc + eq.titulares.length, 0)
  const progressPercent = totalJugadores > 0 ? (totalVotados / totalJugadores) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !partido) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
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
      <main className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] md:pt-20
                         ${isVotingMode ? 'pb-36' : 'pb-24'}`}>
        {/* Header compacto */}
        <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push('/')}
                className="text-[var(--text-muted)] text-sm hover:text-[var(--foreground)] transition-colors"
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
                      : <span className="text-[var(--text-muted)] opacity-50">-</span>
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
                      : <span className="text-[var(--text-muted)] opacity-50">-</span>
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
              <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-10 text-center">
                <p className="text-4xl mb-3">⚽</p>
                <p className="text-[var(--text-muted)]">Alineaciones no disponibles</p>
              </div>
            ) : (
              <div className="space-y-6">
                <MatchStats />

                <div className="text-center bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
                  <p className="text-sm text-[var(--text-muted)]">
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

                {/* Footer fijo de votación — ocupa el espacio de la NavBar */}
                <AnimatePresence>
                  <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 glass z-50 border-t border-[var(--card-border)]"
                  >
                    <div className="max-w-6xl mx-auto px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                      {/* Progress bar */}
                      <div className="mb-2 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-[#10b981] rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                          {totalVotados}/{totalJugadores}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <p className="text-xs text-[var(--text-muted)]">
                          {votosGuardados
                            ? '✅ ¡Votos guardados!'
                            : totalVotados === 0
                              ? 'Tocá un jugador para calificarlo'
                              : `${totalVotados} jugador${totalVotados > 1 ? 'es' : ''} votado${totalVotados > 1 ? 's' : ''}`
                          }
                        </p>
                        <motion.button
                          onClick={handleGuardarVotos}
                          disabled={guardando || totalVotados === 0 || votosGuardados}
                          whileTap={{ scale: 0.95 }}
                          className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
                                    ${votosGuardados
                              ? 'bg-[#10b981] text-white'
                              : 'bg-[#10b981] hover:bg-[#059669] text-white'
                            }
                                    disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {guardando ? 'Guardando...' : votosGuardados ? '✓ Guardado' : (user ? 'Guardar' : 'Iniciar sesión')}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
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

              <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-8 text-center">
                <p className="text-5xl mb-4">
                  {estado === 'PREVIA' ? '⏳' : '⚽'}
                </p>
                <p className="text-lg font-semibold mb-2">
                  {estado === 'PREVIA' ? 'Próximamente' : 'Partido en curso'}
                </p>
                <p className="text-[var(--text-muted)] text-sm">
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

        {/* Solo mostrar NavBar cuando NO estamos votando */}
        {!isVotingMode && <NavBar />}
      </main>
    </>
  )
}