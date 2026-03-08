'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { calcularEstadoPartido, hapticFeedback } from '@/lib/helpers'
import { CanchaFormacion } from '@/components/CanchaFormacion'
import { CommentSection } from '@/components/CommentSection'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { ShareButton } from '@/components/ShareButton'
import { MatchStats } from '@/components/MatchStats'
import { HeadToHead } from '@/components/HeadToHead'
import { CommunityRating } from '@/components/CommunityRating'
import { MatchTimeline } from '@/components/MatchTimeline'
import { QuickPoll } from '@/components/QuickPoll'
import { AdvancedStats } from '@/components/AdvancedStats'
import { MatchLiveChat } from '@/components/MatchLiveChat'
import { AiPredictionWidget } from '@/components/AiPredictionWidget'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Heatmap } from '@/components/Heatmap'
import { TeamLogo } from '@/components/TeamLogo'
import { MessageSquare, MessagesSquare, ChevronDown, ChevronUp, BarChart2, Clock, Zap } from 'lucide-react'
import type { Partido, EstadoPartido } from '@/types'
import { fetchFixtureByIdAction } from '@/app/actions/football'
import { syncPartidosToSupabase } from '@/app/actions/syncPartidos'
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
  const [activeTab, setActiveTab] = useState<'reviews' | 'chat'>('reviews')
  const [openAccordion, setOpenAccordion] = useState<string | null>('resumen')
  const formacionesRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<HTMLDivElement>(null)

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const y = ref.current.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

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
            // Sync to Supabase to get a UUID for this partido
            try {
              const synced = await syncPartidosToSupabase([data])
              if (synced && synced.length > 0) {
                setPartido(synced[0])
                setEstado(calcularEstadoPartido(synced[0].fecha_inicio))
              } else {
                setPartido(data)
                setEstado(calcularEstadoPartido(data.fecha_inicio))
              }
            } catch {
              setPartido(data)
              setEstado(calcularEstadoPartido(data.fecha_inicio))
            }
          } else {
            throw new Error('Partido no encontrado en API')
          }
        }
      } catch (err: any) {
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
      } catch (err: any) {
        console.error('Error cargando alineaciones:', err)
      } finally {
        setLoadingLineups(false)
      }
    }

    fetchLineups()
  }, [estado, partido])

  const handleVotar = useCallback((jugadorId: number, nota: number) => {
    hapticFeedback(20)
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
        partido_id: String(partido?.id || id),
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


      setVotosGuardados(true)

      // Redirect after a short delay
      setTimeout(() => router.push('/'), 1500)
    } catch (err: any) {
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
      <PullToRefresh onRefresh={async () => { window.location.reload() }}>
        <main className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] md:pt-20
                           ${isVotingMode ? 'pb-44' : 'pb-28'}`}>
          {/* Header compacto */}
          <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)]">
            <div className="max-w-4xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => {
                    hapticFeedback(15)
                    if (window.history.length > 2) {
                      router.back()
                    } else {
                      router.push('/')
                    }
                  }}
                  className="text-[var(--text-muted)] text-sm hover:text-[var(--foreground)] transition-colors"
                >
                  ← Volver
                </button>

                <ShareButton
                  titulo={`Partido: ${partido.equipo_local} vs ${partido.equipo_visitante}`}
                  texto={`¡Mirá y votá en este partido en FutLog! ${partido.equipo_local} vs ${partido.equipo_visitante}`}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  captureRef={formacionesRef}
                />
              </div>

              {/* Status and League Tags */}
              <div className="flex items-center justify-between mt-2 mb-6">
                <span className="text-xs font-black text-[#10b981] uppercase tracking-wider bg-[#10b981]/10 px-2.5 py-1 rounded-full border border-[#10b981]/20">
                  {partido.liga}
                </span>
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shadow-sm ${estado === 'PREVIA'
                  ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20'
                  : estado === 'EN_JUEGO'
                    ? 'bg-[#ff6b6b]/10 text-[#ff6b6b] border-[#ff6b6b]/20 animate-pulse'
                    : 'bg-white/5 text-[var(--text-muted)] border-white/10'
                  }`}>
                  {estado === 'PREVIA' && 'Próximo'}
                  {estado === 'EN_JUEGO' && 'En vivo'}
                  {estado === 'FINALIZADO' && 'Finalizado'}
                </span>
              </div>

              {/* Giant Logos Matchup Layout */}
              <div className="flex items-center justify-between max-w-lg mx-auto py-4 relative">
                {/* Local */}
                <div className="flex flex-col items-center flex-1 gap-3 relative z-10 w-[120px]">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#10b981]/30 blur-2xl rounded-full scale-110" />
                    <TeamLogo src={partido.logo_local || undefined} teamName={partido.equipo_local} size={72} className="relative z-10 shadow-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                  </div>
                  <h3 className="font-black text-sm md:text-base text-center leading-tight">
                    {partido.equipo_local}
                  </h3>
                </div>

                {/* Score or VS Centered */}
                <div className="flex flex-col items-center justify-center shrink-0 w-[100px] z-20">
                  {estado === 'PREVIA' ? (
                    <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shadow-lg backdrop-blur-md">
                      <span className="font-black text-[var(--text-muted)] italic">VS</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-black text-4xl md:text-5xl tracking-tighter shadow-sm text-center">
                      <span>{partido.goles_local ?? '-'}</span>
                      <span className="text-[var(--text-muted)] text-3xl font-light opacity-50 px-1">-</span>
                      <span>{partido.goles_visitante ?? '-'}</span>
                    </div>
                  )}
                </div>

                {/* Visitante */}
                <div className="flex flex-col items-center flex-1 gap-3 relative z-10 w-[120px]">
                  <div className="relative">
                    {/* Temporary distinct color for visitante glow */}
                    <div className="absolute inset-0 bg-[#3b82f6]/30 blur-2xl rounded-full scale-110" />
                    <TeamLogo src={partido.logo_visitante || undefined} teamName={partido.equipo_visitante} size={72} className="relative z-10 shadow-2xl drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
                  </div>
                  <h3 className="font-black text-sm md:text-base text-center leading-tight">
                    {partido.equipo_visitante}
                  </h3>
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
                  <div className="space-y-4">
                    {/* Accordion: Resumen Stats */}
                    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-sm">
                      <button
                        onClick={() => setOpenAccordion(openAccordion === 'resumen' ? null : 'resumen')}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors"
                      >
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <BarChart2 size={16} className="text-[#10b981]" />
                          Resumen del Partido
                        </div>
                        {openAccordion === 'resumen' ? <ChevronUp size={16} className="text-[#10b981]" /> : <ChevronDown size={16} className="text-[#10b981]" />}
                      </button>
                      <AnimatePresence>
                        {openAccordion === 'resumen' && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-[var(--card-border)]"
                          >
                            <div className="p-4">
                              <MatchStats />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Accordion: Cronología */}
                    {typeof partido.id === 'number' && (
                      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-sm">
                        <button
                          onClick={() => setOpenAccordion(openAccordion === 'cronologia' ? null : 'cronologia')}
                          className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors"
                        >
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Clock size={16} className="text-[#f59e0b]" />
                            Cronología
                          </div>
                          {openAccordion === 'cronologia' ? <ChevronUp size={16} className="text-[#10b981]" /> : <ChevronDown size={16} className="text-[#10b981]" />}
                        </button>
                        <AnimatePresence>
                          {openAccordion === 'cronologia' && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden border-t border-[var(--card-border)]"
                            >
                              <div className="p-4">
                                <MatchTimeline
                                  fixtureId={partido.id}
                                  equipoLocal={partido.equipo_local}
                                  equipoVisitante={partido.equipo_visitante}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Accordion: Stats Avanzadas */}
                    {typeof partido.id === 'number' && (
                      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-sm">
                        <button
                          onClick={() => setOpenAccordion(openAccordion === 'avanzadas' ? null : 'avanzadas')}
                          className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors"
                        >
                          <div className="flex items-center gap-2 font-bold text-sm">
                            <Zap size={16} className="text-[#6366f1]" />
                            Estadísticas Avanzadas
                          </div>
                          {openAccordion === 'avanzadas' ? <ChevronUp size={16} className="text-[#10b981]" /> : <ChevronDown size={16} className="text-[#10b981]" />}
                        </button>
                        <AnimatePresence>
                          {openAccordion === 'avanzadas' && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden border-t border-[var(--card-border)]"
                            >
                              <div className="p-4">
                                <AdvancedStats fixtureId={partido.id} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

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
                      className="fixed bottom-0 left-0 right-0 glass z-[60] border-t border-[var(--card-border)]"
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
                              ? '✅ Votos guardados'
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
                <AiPredictionWidget
                  partidoId={partido.id}
                  equipoLocal={partido.equipo_local}
                  equipoVisitante={partido.equipo_visitante}
                />

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

                {estado === 'EN_JUEGO' && (
                  <div className="space-y-6">
                    <MatchStats />
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
                      <h3 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-tighter">
                        <Zap size={16} className="text-amber-500" /> Rendimiento en Campo
                      </h3>
                      <Heatmap />
                    </div>
                    {typeof partido.id === 'number' && (
                      <MatchTimeline
                        fixtureId={partido.id}
                        equipoLocal={partido.equipo_local}
                        equipoVisitante={partido.equipo_visitante}
                      />
                    )}
                    {typeof partido.id === 'number' && (
                      <AdvancedStats fixtureId={partido.id} />
                    )}
                  </div>
                )}

                {/* Quick Poll for PREVIA matches */}
                {estado === 'PREVIA' && typeof partido.id === 'number' && (
                  <div ref={pollRef}>
                    <QuickPoll
                      fixtureId={partido.id}
                      equipoLocal={partido.equipo_local}
                      equipoVisitante={partido.equipo_visitante}
                    />
                  </div>
                )}
              </div>
            )}

            {estado === 'FINALIZADO' && (
              <CommunityRating
                partidoId={String(partido.id)}
                equipoLocal={partido.equipo_local}
                equipoVisitante={partido.equipo_visitante}
              />
            )}

            {/* Selector de Pestañas: Reseñas vs Chat */}
            <div ref={chatRef} className="mt-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-1.5 flex gap-1">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all
                ${activeTab === 'reviews'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                  }`}
              >
                <MessageSquare size={16} />
                Reseñas largas
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all
                ${activeTab === 'chat'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                  }`}
              >
                <MessagesSquare size={16} />
                Chat en vivo
                {estado === 'EN_JUEGO' && (
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1" />
                )}
              </button>
            </div>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                {activeTab === 'reviews' ? (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CommentSection partidoId={String(partido.id)} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MatchLiveChat partidoId={String(partido.id)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Match Specific Bottom Bar (Mobile Only) */}
          {!isVotingMode && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 glass z-50 border-t border-[var(--card-border)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex justify-around items-center px-2 py-2">
                {estado === 'FINALIZADO' && (
                  <button
                    onClick={() => scrollToRef(formacionesRef)}
                    className="flex flex-col items-center gap-1 p-2 text-[var(--foreground)] flex-1 hover:bg-[var(--hover-bg)] rounded-xl transition-colors"
                  >
                    <span className="text-xl">⭐️</span>
                    <span className="text-[10px] font-bold">Votar Figura</span>
                  </button>
                )}
                {estado === 'PREVIA' && (
                  <button
                    onClick={() => scrollToRef(pollRef)}
                    className="flex flex-col items-center gap-1 p-2 text-[var(--foreground)] flex-1 hover:bg-[var(--hover-bg)] rounded-xl transition-colors"
                  >
                    <span className="text-xl">🔮</span>
                    <span className="text-[10px] font-bold">Tu Pronóstico</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveTab('chat')
                    scrollToRef(chatRef)
                  }}
                  className="flex flex-col items-center gap-1 p-2 text-[var(--foreground)] flex-1 hover:bg-[var(--hover-bg)] rounded-xl transition-colors"
                >
                  <span className="text-xl">💬</span>
                  <span className="text-[10px] font-bold">Chat en vivo</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </PullToRefresh>
    </>
  )
}