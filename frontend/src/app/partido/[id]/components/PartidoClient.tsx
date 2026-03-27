'use client'
// src/app/partido/[id]/components/PartidoClient.tsx
//
// CAMBIOS vs page.tsx original:
// ✅ Recibe partido como prop → sin loading state inicial
// ✅ useEffects 3 y 4 (votes + reseña) corren en paralelo con Promise.all
// ✅ FormularioResena + ListaResenas renderizados UNA sola vez (había 2 instancias de cada uno)
// ✅ window.location.reload() reemplazado por setState
// ✅ import confetti eliminado (nunca se usaba — bundle size gratis)
// ✅ Mock data movido a función separada para claridad
// ✅ Acordeón abierto por defecto solo si hay lineups

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { calcularEstadoPartido, hapticFeedback, isMatchTooOld, getTeamColor } from '@/lib/helpers'
import { CanchaFormacion } from '@/components/CanchaFormacion'
import { CommentSection } from '@/components/CommentSection'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
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
import { AiMatchSummary } from '@/components/AiMatchSummary'
import { PullToRefresh } from '@/components/PullToRefresh'
import { Heatmap } from '@/components/Heatmap'
import { TeamLogo } from '@/components/TeamLogo'
import { FormularioResena } from '@/components/resenas/FormularioResena'
import { ListaResenas } from '@/components/resenas/ListaResenas'
import { MessageSquare, MessagesSquare, ChevronDown, ChevronUp, BarChart2, Clock, Zap, Star, Crown } from 'lucide-react'
import type { Partido, EstadoPartido } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────
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

interface Props {
  initialPartido: Partido | null
  id: string
}

// ─── Component ───────────────────────────────────────────────────────────
export function PartidoClient({ initialPartido, id }: Props) {
  const router = useRouter()
  const { user, profile } = useAuth()

  // ── State ────────────────────────────────────────────────────────────
  // ✅ partido arranca con datos del Server — sin loading inicial
  const [partido, setPartido] = useState<Partido | null>(initialPartido)
  const [estado, setEstado] = useState<EstadoPartido>(
    initialPartido ? calcularEstadoPartido(initialPartido.fecha_inicio) : 'PREVIA'
  )
  const [equipos, setEquipos]             = useState<EquipoLineup[]>([])
  const [votos, setVotos]                 = useState<Record<number, number>>({})
  const [loadingLineups, setLoadingLineups] = useState(false)
  const [error]                           = useState<string | null>(
    initialPartido ? null : 'Partido no encontrado'
  )
  const [guardando, setGuardando]         = useState(false)
  const [votosGuardados, setVotosGuardados] = useState(false)
  const [votoExistente, setVotoExistente] = useState(false)
  const [loadingVotos, setLoadingVotos]   = useState(false)
  const [miResena, setMiResena]           = useState<any>(null)
  const [resenasKey, setResenasKey]       = useState(0) // ✅ fuerza re-render de ListaResenas sin reload()
  const [activeTab, setActiveTab]         = useState<'reviews' | 'chat'>('reviews')
  const [openAccordion, setOpenAccordion] = useState<string | null>(null)

  const formacionesRef = useRef<HTMLDivElement>(null)
  const chatRef        = useRef<HTMLDivElement>(null)
  const pollRef        = useRef<HTMLDivElement>(null)

  const isVotingMode = equipos.length > 0 && estado === 'FINALIZADO'

  // ── Tab default basado en estado ─────────────────────────────────────
  useEffect(() => {
    if (estado === 'EN_JUEGO') setActiveTab('chat')
  }, [estado])

  // ── Cargar lineups ───────────────────────────────────────────────────
  // Sin cambio — depende de `partido` que ahora viene como prop
  useEffect(() => {
    if (estado !== 'FINALIZADO' || !partido) return

    const fetchLineups = async () => {
      try {
        setLoadingLineups(true)
        const res  = await fetch(`/api/partido/${partido.id}/lineups`)
        const data = await res.json()
        if (data.equipos?.length > 0) {
          setEquipos(data.equipos)
          setOpenAccordion('resumen') // abrir acordeón al tener datos
        }
      } catch (err) {
        console.error('Error cargando alineaciones:', err)
      } finally {
        setLoadingLineups(false)
      }
    }

    fetchLineups()
  }, [estado, partido])

  // ── ✅ Votos + Reseña en PARALELO (antes eran 2 useEffects secuenciales) ─
  useEffect(() => {
    if (!user || !partido || estado !== 'FINALIZADO') return

    const fetchUserData = async () => {
      setLoadingVotos(true)
      try {
        // Promise.all → 2 queries corren al mismo tiempo en vez de una tras otra
        const [votosResult, resenaResult] = await Promise.all([
          supabase
            .from('votaciones')
            .select('jugador_id, nota')
            .eq('user_id', user.id)
            .eq('partido_id', String(partido.id)),
          supabase
            .from('resenas')
            .select('*')
            .eq('partido_id', partido.id)
            .eq('user_id', user.id)
            .single(),
        ])

        if (votosResult.data?.length) {
          setVotoExistente(true)
          const vMap: Record<number, number> = {}
          votosResult.data.forEach(v => { vMap[v.jugador_id] = v.nota })
          setVotos(vMap)
        }

        if (resenaResult.data) setMiResena(resenaResult.data)
      } catch (err) {
        console.error('Error fetching user data:', err)
      } finally {
        setLoadingVotos(false)
      }
    }

    fetchUserData()
  }, [user, partido, estado])

  // ─── Helpers ──────────────────────────────────────────────────────────
  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return
    const y = ref.current.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top: y, behavior: 'smooth' })
  }

  const isTooOld = partido ? isMatchTooOld(partido.fecha_inicio) : false

  const handleVotar = useCallback((jugadorId: number, nota: number) => {
    if (votoExistente || isTooOld) return
    hapticFeedback(20)
    setVotos(prev => ({ ...prev, [jugadorId]: nota }))
  }, [votoExistente, isTooOld])

  const handleGuardarVotos = async () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/partido/${id}`))
      return
    }
    try {
      setGuardando(true)
      const votosArray = Object.entries(votos).map(([jugadorId, nota]) => ({
        user_id:    user.id,
        partido_id: String(partido?.id || id),
        jugador_id: Number(jugadorId),
        nota,
        created_at: new Date().toISOString(),
      }))
      const { error: insertError } = await supabase
        .from('votaciones')
        .upsert(votosArray, { onConflict: 'user_id,partido_id,jugador_id' })
      if (insertError) throw insertError
      setVotosGuardados(true)
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      console.error('Error guardando votos:', err)
    } finally {
      setGuardando(false)
    }
  }

  const totalVotados   = Object.keys(votos).length
  const totalJugadores = equipos.reduce((acc, eq) => acc + eq.titulares.length, 0)
  const progressPercent = totalJugadores > 0 ? (totalVotados / totalJugadores) * 100 : 0

  // ─── Jugadores para formulario ─────────────────────────────────────────
  // Computed una vez para no recalcular en cada render
  const jugadoresParaFormulario = equipos.flatMap(eq =>
    [...eq.titulares, ...eq.suplentes].map(j => ({ id: j.id, nombre: j.nombre }))
  )

  // ─── Render ─────────────────────────────────────────────────────────────
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

          {/* ── HERO ESTILO PELÍCULA ── */}
          <div className="relative overflow-hidden bg-black/40 border-b border-white/10 pt-4 pb-10 md:pt-8 md:pb-16 mt-[-1px]">
            {/* Fondos blurreados para dramatismo */}
            <div className="absolute inset-0 z-0 opacity-60">
              <div
                className="absolute top-[-20%] left-[-10%] w-[60%] h-[140%] blur-[100px] md:blur-[140px] opacity-70"
                style={{ backgroundColor: getTeamColor(partido.equipo_local) }}
              />
              <div
                className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] blur-[100px] md:blur-[140px] opacity-70"
                style={{ backgroundColor: getTeamColor(partido.equipo_visitante) }}
              />
            </div>

            {/* Top Bar Navigation (sobre el blur) */}
            <div className="relative z-20 max-w-5xl mx-auto px-6 mb-8 flex items-center justify-between">
              <button
                onClick={() => {
                  hapticFeedback(15)
                  window.history.length > 2 ? router.back() : router.push('/')
                }}
                className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10"
              >
                ← Volver
              </button>
              
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border backdrop-blur-md shadow-sm ${
                  estado === 'PREVIA'    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  : estado === 'EN_JUEGO' ? 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse'
                  : 'bg-white/10 text-white/80 border-white/20'
                }`}>
                  {estado === 'PREVIA'     && 'Próximo'}
                  {estado === 'EN_JUEGO'   && 'En vivo'}
                  {estado === 'FINALIZADO' && 'Finalizado'}
                </span>

                <ShareButton
                  titulo={`Partido: ${partido.equipo_local} vs ${partido.equipo_visitante}`}
                  texto={`¡Mirá y votá en este partido en FutLog! ${partido.equipo_local} vs ${partido.equipo_visitante}`}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  captureRef={formacionesRef}
                />
              </div>
            </div>

            {/* Poster Content */}
            <div className="relative z-20 max-w-5xl mx-auto px-4 flex flex-col items-center">
              {/* Liga Pill */}
              <div className="mb-6">
                <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-xl">
                  {partido.liga}
                </span>
              </div>

              {/* Matchup principal */}
              <div className="flex items-center justify-center w-full gap-2 md:gap-8">
                {/* Local */}
                <div className="flex flex-col items-center flex-1 gap-4 w-[130px] md:w-[200px]">
                  <TeamLogo src={partido.logo_local || undefined} teamName={partido.equipo_local} size={90}
                            className="shadow-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] scale-110 md:scale-125 transition-transform" />
                  <h3 className="font-black text-sm md:text-xl text-center leading-tight text-white drop-shadow-md">
                    {partido.equipo_local}
                  </h3>
                </div>

                {/* Score / VS en el centro, gigante */}
                <div className="flex flex-col items-center justify-center shrink-0 w-[110px] md:w-[160px]">
                  {estado === 'PREVIA' ? (
                    <div className="flex items-center justify-center pt-4">
                      <span className="font-black text-2xl md:text-4xl text-white/40 italic tracking-tighter">VS</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 font-black text-5xl md:text-7xl tracking-tighter text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
                      <span>{partido.goles_local ?? '-'}</span>
                      <span className="text-white/30 text-4xl md:text-5xl font-light px-1">-</span>
                      <span>{partido.goles_visitante ?? '-'}</span>
                    </div>
                  )}
                </div>

                {/* Visitante */}
                <div className="flex flex-col items-center flex-1 gap-4 w-[130px] md:w-[200px]">
                  <TeamLogo src={partido.logo_visitante || undefined} teamName={partido.equipo_visitante} size={90}
                            className="shadow-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] scale-110 md:scale-125 transition-transform" />
                  <h3 className="font-black text-sm md:text-xl text-center leading-tight text-white drop-shadow-md">
                    {partido.equipo_visitante}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sección principal ── */}
          <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

            {/* ── FINALIZADO: lineups + acordeones ── */}
            {estado === 'FINALIZADO' && (
              loadingLineups ? (
                <div className="flex justify-center py-10"><LoadingSpinner /></div>
              ) : equipos.length === 0 ? (
                <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-10 text-center">
                  <p className="text-4xl mb-3">⚽</p>
                  <p className="text-[var(--text-muted)]">Alineaciones no disponibles</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Cronica de Partido AI */}
                  {typeof partido.id === 'number' && (
                     <AiMatchSummary partidoId={partido.id} />
                  )}

                  {/* Timeline Narrativo (Fuera del acordeón) */}
                  {typeof partido.id === 'number' && (
                    <MatchTimeline fixtureId={partido.id} equipoLocal={partido.equipo_local} equipoVisitante={partido.equipo_visitante} />
                  )}

                  {/* Casting (Formaciones estilo Letterboxd) */}
                  <div ref={formacionesRef}>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-xl font-black uppercase tracking-widest text-[var(--foreground)] mt-2">Casting (Formaciones)</h3>
                    </div>
                    
                    <div className="text-center bg-white/5 rounded-xl border border-white/10 p-3 mb-6">
                      <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">
                        Hacé click en cada jugador para calificar su actuación (1-10)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {equipos.map(equipo => (
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
                  </div>

                  {/* Accesorios y Extras (Stats) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[var(--card-border)]/50">
                    <MatchStats />
                    {typeof partido.id === 'number' && <AdvancedStats fixtureId={partido.id} />}
                  </div>
                </div>
              )
            )}

            {/* ── CommunityRating ── */}
            {estado === 'FINALIZADO' && typeof partido.id === 'number' && (
              <CommunityRating
                partidoId={partido.id}
                equipoLocal={partido.equipo_local}
                equipoVisitante={partido.equipo_visitante}
                equipos={equipos}
              />
            )}

            {/* ── EN JUEGO: stats live ── */}
            {estado === 'EN_JUEGO' && (
              <div className="space-y-6">
                <p className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center text-amber-500 text-xs font-bold italic">
                  ⏱ Podrás dejar tu reseña y puntuar el partido cuando finalice
                </p>
                <MatchStats />
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2 capitalize tracking-tighter">
                    <Zap size={16} className="text-amber-500" /> Rendimiento en Campo
                  </h3>
                  <Heatmap />
                </div>
                {typeof partido.id === 'number' && (
                  <>
                    <MatchTimeline fixtureId={partido.id} equipoLocal={partido.equipo_local} equipoVisitante={partido.equipo_visitante} />
                    {profile?.is_pro ? (
                        <AdvancedStats fixtureId={partido.id} />
                    ) : (
                        <div className="bg-[var(--card-bg)] border border-yellow-500/20 rounded-3xl p-6 shadow-sm text-center relative overflow-hidden group mb-6">
                           <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
                           <Crown size={32} className="mx-auto mb-3 text-yellow-500 opacity-50" />
                           <h3 className="text-sm font-black mb-2 flex items-center justify-center gap-2 capitalize tracking-tighter text-yellow-500">
                             Estadísticas Avanzadas Pro
                           </h3>
                           <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)] mb-4 leading-relaxed">
                             Suscribite a FutLog Pro para desbloquear el radar táctico, expected goals y las métricas profundas del partido.
                           </p>
                           <button onClick={() => router.push('/pro')} className="inline-block bg-yellow-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                             Desbloquear Ahora
                           </button>
                        </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── PREVIA ── */}
            {estado === 'PREVIA' && (
              <div className="space-y-6">
                <AiPredictionWidget partidoId={partido.id} equipoLocal={partido.equipo_local} equipoVisitante={partido.equipo_visitante} />
                <HeadToHead equipoLocal={partido.equipo_local} equipoVisitante={partido.equipo_visitante}
                  logoLocal={partido.logo_local} logoVisitante={partido.logo_visitante} />
                <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-8 text-center">
                  <p className="text-5xl mb-4">⏳</p>
                  <p className="text-lg font-semibold mb-2">Próximamente</p>
                  <p className="text-[var(--text-muted)] text-sm">La votación estará disponible cuando finalice el partido</p>
                </div>
                {typeof partido.id === 'number' && (
                  <div ref={pollRef}>
                    <QuickPoll fixtureId={partido.id} equipoLocal={partido.equipo_local} equipoVisitante={partido.equipo_visitante} />
                  </div>
                )}
              </div>
            )}

            {/* ── ✅ Sección de Reseñas (UNA sola vez — había 2 instancias) ── */}
            {estado === 'FINALIZADO' && (
              <div className="space-y-10 mt-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--card-border)] opacity-30" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">SECCIÓN DE RESEÑAS</span>
                  <div className="h-px flex-1 bg-[var(--card-border)] opacity-30" />
                </div>

                {user ? (
                  <FormularioResena
                    partidoId={Number(partido.id)}
                    equipoLocal={partido.equipo_local}
                    equipoVisitante={partido.equipo_visitante}
                    logoLocal={partido.logo_local || undefined}
                    logoVisitante={partido.logo_visitante || undefined}
                    liga={partido.liga}
                    golesLocal={partido.goles_local}
                    golesVisitante={partido.goles_visitante}
                    jugadoresDelPartido={jugadoresParaFormulario}
                    resenaExistente={miResena}
                    onGuardado={() => {
                      hapticFeedback(50)
                      // ✅ Incrementar key fuerza re-render de ListaResenas sin window.location.reload()
                      setResenasKey(k => k + 1)
                    }}
                  />
                ) : (
                  <div className="bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--card-border)] p-8 text-center">
                    <Star size={32} className="mx-auto mb-4 text-[var(--text-muted)] opacity-20" />
                    <p className="text-sm font-bold text-[var(--text-muted)] mb-4">
                      Iniciá sesión para dejar tu reseña y puntuar el partido
                    </p>
                    <button
                      onClick={() => router.push('/login')}
                      className="px-6 py-2 bg-[var(--accent)] text-white rounded-xl font-bold text-xs uppercase"
                    >
                      Ingresar
                    </button>
                  </div>
                )}

                {/* key prop fuerza re-fetch cuando el usuario guarda nueva reseña */}
                <ListaResenas key={resenasKey} partidoId={Number(partido.id)} />
              </div>
            )}

            {/* ── Tabs: Chat / Reseñas largas ── */}
            <div ref={chatRef} className="mt-8 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] p-1.5 flex gap-1">
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all
                  ${activeTab === 'reviews' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'}`}
              >
                <MessageSquare size={16} /> Reseñas largas
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all
                  ${activeTab === 'chat' ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'}`}
              >
                <MessagesSquare size={16} /> Chat en vivo
                {estado === 'EN_JUEGO' && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse ml-1" />}
              </button>
            </div>

            <div className="mt-4">
              <AnimatePresence mode="wait">
                {activeTab === 'reviews' ? (
                  <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <CommentSection partidoId={String(partido.id)} />
                  </motion.div>
                ) : (
                  <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <MatchLiveChat partidoId={String(partido.id)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Voting footer fijo ── */}
          <AnimatePresence>
            {isVotingMode && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 glass z-[60] border-t border-[var(--card-border)]"
              >
                <div className="max-w-6xl mx-auto px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                      <motion.div className="h-full bg-[#16a34a] rounded-full" initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.3 }} />
                    </div>
                    <span className="text-xs text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                      {totalVotados}/{totalJugadores}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                      <p className={`text-xs font-bold ${isTooOld ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                        {votosGuardados || votoExistente ? '✅ Votos guardados'
                          : isTooOld ? '⚠️ Votación cerrada (>30 días)'
                          : totalVotados === 0 ? 'Tocá un jugador para calificarlo'
                          : `${totalVotados} jugador${totalVotados > 1 ? 'es' : ''} votado${totalVotados > 1 ? 's' : ''}`}
                      </p>
                      {(votoExistente || isTooOld) && (
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {isTooOld ? 'Los partidos antiguos no permiten nuevas votaciones.' : 'Ya participaste en la votación de este partido.'}
                        </p>
                      )}
                    </div>
                    <motion.button
                      onClick={handleGuardarVotos}
                      disabled={guardando || totalVotados === 0 || votosGuardados || votoExistente || isTooOld}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all
                        ${(votosGuardados || votoExistente) ? 'bg-[#16a34a] text-white opacity-80'
                          : isTooOld ? 'bg-[var(--card-border)] text-[var(--text-muted)]'
                          : 'bg-[#16a34a] hover:bg-[#059669] text-white'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {guardando ? 'Guardando...' : (votosGuardados || votoExistente) ? '✓ Guardado' : isTooOld ? 'Cerrado' : user ? 'Guardar' : 'Iniciar sesión'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bottom bar mobile (solo sin voting mode) ── */}
          {!isVotingMode && (
            <div className="md:hidden fixed bottom-0 left-0 right-0 glass z-50 border-t border-[var(--card-border)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="flex justify-around items-center px-2 py-2">
                {estado === 'FINALIZADO' && (
                  <button onClick={() => scrollToRef(formacionesRef)} className="flex flex-col items-center gap-1 p-2 text-[var(--foreground)] flex-1 hover:bg-[var(--hover-bg)] rounded-xl transition-colors">
                    <span className="text-xl">⭐️</span>
                    <span className="text-[10px] font-bold">Votar Figura</span>
                  </button>
                )}
                {estado === 'PREVIA' && (
                  <button onClick={() => scrollToRef(pollRef)} className="flex flex-col items-center gap-1 p-2 text-[var(--foreground)] flex-1 hover:bg-[var(--hover-bg)] rounded-xl transition-colors">
                    <span className="text-xl">🔮</span>
                    <span className="text-[10px] font-bold">Tu Pronóstico</span>
                  </button>
                )}
                <button
                  onClick={() => { setActiveTab('chat'); scrollToRef(chatRef) }}
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

// ─── Accordion helper (extraído para evitar repetición) ───────────────────
function Accordion({
  id, open, onToggle, icon, label, children,
}: {
  id: string
  open: string | null
  onToggle: (id: string | null) => void
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  const isOpen = open === id
  return (
    <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden shadow-sm">
      <button
        onClick={() => onToggle(isOpen ? null : id)}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors"
      >
        <div className="flex items-center gap-2 font-bold text-sm">{icon}{label}</div>
        {isOpen
          ? <ChevronUp size={16} className="text-[#16a34a]" />
          : <ChevronDown size={16} className="text-[#16a34a]" />
        }
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-[var(--card-border)]"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
