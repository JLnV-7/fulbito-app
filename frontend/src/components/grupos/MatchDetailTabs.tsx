'use client'
// Force cache update
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useToast } from '@/contexts/ToastContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Info, BarChart2, Inbox, Trophy, X, UserPlus, Flashlight as Flash } from 'lucide-react'
import type { PartidoAmigo, JugadorPartidoAmigo, FacetType, FacetVote } from '@/types'
import { FacetVotingCards } from './FacetVotingCards'
import { MatchStatisticsPanel } from './MatchStatisticsPanel'
import { CanchaSeleccion } from './CanchaSeleccion'
import { VotarModal } from './VotarModal'
import { VotacionRapida } from './VotacionRapida'
import { RankingEnVivo } from './RankingEnVivo'
import { DetalleJugadorAmigo } from './DetalleJugadorAmigo'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { FORMACIONES, Formacion } from '@/lib/formaciones'

interface MatchDetailTabsProps {
    partido: PartidoAmigo
    grupoId: string
    onClose: () => void
    onUpdate: () => void
    initialTab?: 'info' | 'stats' | 'votos' | 'resultados'
    adminId?: string
}

export function MatchDetailTabs({ partido, grupoId, onClose, onUpdate, initialTab = 'info', adminId }: MatchDetailTabsProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'votos' | 'resultados'>(initialTab)
    const [jugadores, setJugadores] = useState<JugadorPartidoAmigo[]>([])
    const [facetVotes, setFacetVotes] = useState<FacetVote[]>([])
    const [loading, setLoading] = useState(true)

    // States for Lineup/Creation
    const [miembros, setMiembros] = useState<any[]>([])
    const [equipoAgregando, setEquipoAgregando] = useState<'azul' | 'rojo' | null>(null)
    const [ordenAgregando, setOrdenAgregando] = useState<number | null>(null)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [formacionAzul, setFormacionAzul] = useState<Formacion | null>(null)
    const [formacionRojo, setFormacionRojo] = useState<Formacion | null>(null)
    const [guardando, setGuardando] = useState(false)

    // States for Voting
    const [votandoA, setVotandoA] = useState<JugadorPartidoAmigo | null>(null)
    const [showRapida, setShowRapida] = useState(false)
    const [jugadorDetalle, setJugadorDetalle] = useState<JugadorPartidoAmigo | null>(null)

    const { 
        fetchJugadoresConVotos, 
        votarJugador, 
        eliminarVotoJugador,
        votarFaceta, 
        eliminarVotoFaceta,
        fetchFacetVotes, 
        agregarJugador,
        eliminarJugador
    } = usePartidosAmigos(grupoId)

    useEffect(() => {
        loadData()
        fetchMiembros()
    }, [partido.id])

    const fetchMiembros = async () => {
        const { data } = await supabase
            .from('miembros_grupo')
            .select('user_id, profile:profiles(username)')
            .eq('grupo_id', grupoId)
        setMiembros(data || [])
    }

    const loadData = async () => {
        try {
            setLoading(true)
            const [jugs, fVotes] = await Promise.all([
                fetchJugadoresConVotos(partido.id),
                fetchFacetVotes(partido.id)
            ])
            setJugadores(jugs)
            setFacetVotes(fVotes)
        } catch {
            showToast('Error cargando datos del partido', 'error')
        } finally {
            setLoading(false)
        }
    }

    // --- Optimistic local state helpers ---
    const updateJugadorVotoLocal = (jugadorId: string, nota: number, comentario?: string) => {
        setJugadores(prev => prev.map(j => {
            if (j.id !== jugadorId) return j
            const yaVotado = !!j.mi_voto
            const oldNota = j.mi_voto?.nota || 0
            const nuevoMiVoto = { id: 'local', partido_amigo_id: partido.id, jugador_id: jugadorId, user_id: user!.id, nota, comentario: comentario || null, created_at: new Date().toISOString() }
            const currentTotal = j.total_votos || 0
            const newTotalVotos = yaVotado ? currentTotal : currentTotal + 1
            const sumaAnterior = (j.promedio || 0) * currentTotal
            const nuevaSuma = yaVotado ? sumaAnterior - oldNota + nota : sumaAnterior + nota
            const nuevoPromedio = newTotalVotos > 0 ? Math.round((nuevaSuma / newTotalVotos) * 10) / 10 : 0
            return { ...j, mi_voto: nuevoMiVoto as any, total_votos: newTotalVotos, promedio: nuevoPromedio }
        }))
    }

    const handleVotar = async (nota: number, comentario?: string) => {
        if (!votandoA) return
        try {
            await votarJugador(partido.id, votandoA.id, nota, comentario)
            updateJugadorVotoLocal(votandoA.id, nota, comentario)
            showToast(`Voto guardado para ${votandoA.nombre} ⭐`, 'success')
        } catch {
            showToast('Error al guardar voto', 'error')
        }
    }

    const handleEliminarVoto = async (jugadorId: string) => {
        try {
            await eliminarVotoJugador(partido.id, jugadorId)
            setJugadores(prev => prev.map(j => {
                if (j.id !== jugadorId) return j
                const oldNota = j.mi_voto?.nota || 0
                const newTotalVotos = Math.max((j.total_votos || 0) - 1, 0)
                const sumaAnterior = (j.promedio || 0) * (j.total_votos || 0)
                const nuevaSuma = sumaAnterior - oldNota
                const nuevoPromedio = newTotalVotos > 0 ? Math.round((nuevaSuma / newTotalVotos) * 10) / 10 : 0
                return { ...j, mi_voto: null as any, total_votos: newTotalVotos, promedio: nuevoPromedio }
            }))
            showToast('Voto eliminado 🗑️', 'success')
        } catch {
            showToast('Error al eliminar voto', 'error')
        }
    }

    const handleVotarTodos = async (votos: { jugadorId: string; nota: number }[]) => {
        try {
            for (const v of votos) {
                await votarJugador(partido.id, v.jugadorId, v.nota)
            }
            votos.forEach(v => updateJugadorVotoLocal(v.jugadorId, v.nota))
            showToast(`${votos.length} votos guardados ⚡`, 'success')
        } catch {
            showToast('Error al guardar votos', 'error')
        }
    }

    const handleAgregarJugador = async () => {
        if (!nuevoNombre.trim() || !equipoAgregando) return
        setGuardando(true)
        try {
            const jugador = await agregarJugador(partido.id, nuevoNombre.trim(), equipoAgregando, selectedUserId || undefined)
            
            // Si tenemos orden, lo asignamos visualmente (esto asume que el backend no lo guarda pero el frontend lo usa para la cancha)
            if (ordenAgregando !== null) {
                // Actualizamos el orden en la DB si es necesario, pero CrearPartidoAmigo.tsx lo hacía localmente
                // Por ahora replicamos el comportamiento:
                jugador.orden = ordenAgregando
            }

            showToast('Jugador agregado', 'success')
            setNuevoNombre('')
            setSelectedUserId(null)
            setEquipoAgregando(null)
            setOrdenAgregando(null)
            await loadData()
        } catch (err: any) {
            showToast(err.message, 'error')
        } finally {
            setGuardando(false)
        }
    }

    const handleEliminarJugador = async (j: JugadorPartidoAmigo) => {
        try {
            await eliminarJugador(j.id)
            showToast('Jugador eliminado', 'success')
            await loadData()
        } catch (err: any) {
            showToast(err.message, 'error')
        }
    }

    const canEdit = user?.id === partido.creado_por || user?.id === adminId
    const votados = jugadores.filter(j => j.mi_voto).length
    const totalJugadores = jugadores.length
    const progreso = totalJugadores > 0 ? Math.round((votados / totalJugadores) * 100) : 0

    const tabs = [
        { id: 'info', label: 'Info', icon: Info },
        { id: 'stats', label: 'Estadísticas', icon: BarChart2 },
        { id: 'votos', label: 'Votos', icon: Inbox },
        { id: 'resultados', label: 'Resultados', icon: Trophy },
    ] as const

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-[var(--background)] z-[60] flex flex-col"
        >
            {/* Header Sticky */}
            <div className="bg-[#16a34a] text-white pt-10 pb-4 px-6 relative shrink-0">
                <button 
                    onClick={onClose}
                    className="absolute top-10 right-6 p-2 bg-black/20 rounded-full hover:bg-black/30 transition-all"
                >
                    <X size={20} />
                </button>
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-black italic tracking-tighter">
                        ⚽ Detalle del Partido
                    </h2>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">
                        {new Date(partido.fecha + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* Selector de Tabs */}
            <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-2 shrink-0">
                <div className="max-w-4xl mx-auto flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                                activeTab === tab.id 
                                ? 'bg-[#16a34a]/10 text-[#16a34a]' 
                                : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                            }`}
                        >
                            <tab.icon size={18} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                {tab.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-24">
                <div className="max-w-4xl mx-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <LoadingSpinner />
                            <p className="text-[10px] font-black uppercase tracking-widest mt-4">Cargando...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {activeTab === 'info' && (
                                    <div className="space-y-6">
                                        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] text-center">
                                            <p className="text-4xl mb-2">🏟️</p>
                                            <h3 className="font-black text-xl italic">{partido.cancha || 'Cancha por definir'}</h3>
                                            <p className="text-[var(--text-muted)] font-bold text-sm mt-1">
                                                {partido.hora.slice(0, 5)} HS • Fútbol {partido.tipo_partido}
                                            </p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 text-center">
                                                <p className="text-2xl mb-1">🔵</p>
                                                <p className="text-blue-500 font-black text-xs uppercase">Equipo Azul</p>
                                                <p className="text-2xl font-black mt-1">
                                                    {jugadores.filter(j => j.equipo === 'azul').length}
                                                </p>
                                            </div>
                                            <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-center">
                                                <p className="text-2xl mb-1">🔴</p>
                                                <p className="text-red-500 font-black text-xs uppercase">Equipo Rojo</p>
                                                <p className="text-2xl font-black mt-1">
                                                    {jugadores.filter(j => j.equipo === 'rojo').length}
                                                </p>
                                            </div>
                                        </div>

                                        {(partido.estado === 'borrador' && canEdit) ? (
                                            <div className="space-y-8 pt-4">
                                                <div className="flex flex-col gap-8">
                                                    <div className="flex-1">
                                                        <h4 className="font-black text-blue-500 mb-2 text-center text-xs uppercase tracking-widest">🔵 Lineup Azul</h4>
                                                        <CanchaSeleccion
                                                            tipoPartido={partido.tipo_partido}
                                                            equipo="azul"
                                                            jugadores={jugadores.filter(j => j.equipo === 'azul')}
                                                            onSelectPosicion={(orden) => {
                                                                setEquipoAgregando('azul')
                                                                setOrdenAgregando(orden)
                                                            }}
                                                            onEliminarJugador={handleEliminarJugador}
                                                            formacionActual={formacionAzul || FORMACIONES[partido.tipo_partido][0]}
                                                            setFormacionActual={setFormacionAzul}
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-black text-red-500 mb-2 text-center text-xs uppercase tracking-widest">🔴 Lineup Rojo</h4>
                                                        <CanchaSeleccion
                                                            tipoPartido={partido.tipo_partido}
                                                            equipo="rojo"
                                                            jugadores={jugadores.filter(j => j.equipo === 'rojo')}
                                                            onSelectPosicion={(orden) => {
                                                                setEquipoAgregando('rojo')
                                                                setOrdenAgregando(orden)
                                                            }}
                                                            onEliminarJugador={handleEliminarJugador}
                                                            formacionActual={formacionRojo || FORMACIONES[partido.tipo_partido][0]}
                                                            setFormacionActual={setFormacionRojo}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)]">
                                                <h4 className="font-black text-xs uppercase tracking-widest mb-4 opacity-50">Equipos Confirmados</h4>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        {jugadores.filter(j => j.equipo === 'azul').map(j => (
                                                            <p key={j.id} className="text-sm font-bold">👤 {j.nombre}</p>
                                                        ))}
                                                    </div>
                                                    <div className="space-y-2">
                                                        {jugadores.filter(j => j.equipo === 'rojo').map(j => (
                                                            <p key={j.id} className="text-sm font-bold">👤 {j.nombre}</p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'stats' && (
                                    <MatchStatisticsPanel 
                                        partido={partido}
                                        jugadores={jugadores}
                                        grupoId={grupoId}
                                        canEdit={canEdit}
                                        onUpdate={() => { onUpdate(); loadData(); }}
                                    />
                                )}

                                {activeTab === 'votos' && (
                                    <div className="space-y-8">
                                        {/* Progreso de Votación */}
                                        <div className="bg-[var(--card-bg)] p-5 rounded-3xl border border-[var(--card-border)] shadow-sm">
                                            <div className="flex justify-between items-end mb-3">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Tu Progreso</p>
                                                    <p className="text-lg font-black italic">{votados} / {totalJugadores}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-[#16a34a] leading-none">{progreso}%</p>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--card-border)]">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progreso}%` }}
                                                    className="h-full bg-[#16a34a]"
                                                />
                                            </div>
                                        </div>

                                        {/* Ranking en vivo */}
                                        <div>
                                            <h3 className="font-black italic uppercase tracking-tighter text-sm mb-4">
                                                📊 Ranking acumulado
                                            </h3>
                                            <RankingEnVivo 
                                                jugadores={jugadores} 
                                                totalMiembros={partido.total_miembros || 0}
                                            />
                                        </div>
                                        <div className="border-t border-[var(--card-border)]" />

                                        {/* Lista de Jugadores para Votar */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-black italic uppercase tracking-tighter text-sm">⭐ Puntuar Rendimiento (1-10)</h3>
                                                {votados < totalJugadores && (
                                                    <button 
                                                        onClick={() => setShowRapida(true)}
                                                        className="flex items-center gap-1.5 bg-[#d97706] text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
                                                    >
                                                        <Flash size={12} /> Votar Todos
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                {/* Votos Equipo Azul */}
                                                <div className="space-y-3">
                                                    <h4 className="font-black text-blue-500 text-[10px] uppercase tracking-[0.2em] mb-3 border-b border-blue-500/10 pb-2 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> EQUIPO AZUL
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {jugadores.filter(j => j.equipo === 'azul').map((j) => (
                                                            <div 
                                                                key={j.id} 
                                                                className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 flex items-center justify-between gap-4 group hover:bg-blue-500/10 transition-all"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold text-sm truncate">{j.nombre}</p>
                                                                        {j.mi_voto ? (
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <div className="flex gap-0.5">
                                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                                        <span key={i} className={`text-[8px] ${i < Math.round(j.mi_voto!.nota / 2) ? 'grayscale-0' : 'grayscale opacity-20'}`}>⭐</span>
                                                                                    ))}
                                                                                </div>
                                                                                <span className="text-[10px] font-bold text-blue-500">{j.mi_voto.nota}/10</span>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[10px] text-[var(--text-muted)] font-medium mt-1">Sin votar aún</p>
                                                                        )}
                                                                        {(j.promedio || 0) > 0 && (
                                                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                                                                Promedio: <strong className="text-blue-500">{j.promedio}</strong> <span className="opacity-50 font-medium">({j.total_votos} Votos)</span>
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {j.mi_voto && (
                                                                        <button
                                                                            onClick={() => handleEliminarVoto(j.id)}
                                                                            className="shrink-0 p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => setVotandoA(j)}
                                                                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                            j.mi_voto 
                                                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' 
                                                                            : 'bg-blue-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                                                        }`}
                                                                    >
                                                                        {j.mi_voto ? 'Editar' : 'Votar'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Votos Equipo Rojo */}
                                                <div className="space-y-3">
                                                    <h4 className="font-black text-red-500 text-[10px] uppercase tracking-[0.2em] mb-3 border-b border-red-500/10 pb-2 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> EQUIPO ROJO
                                                    </h4>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {jugadores.filter(j => j.equipo === 'rojo').map((j) => (
                                                            <div 
                                                                key={j.id} 
                                                                className="bg-red-500/5 p-4 rounded-2xl border border-red-500/10 flex items-center justify-between gap-4 group hover:bg-red-500/10 transition-all"
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold text-sm truncate">{j.nombre}</p>
                                                                        {j.mi_voto ? (
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <div className="flex gap-0.5">
                                                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                                                        <span key={i} className={`text-[8px] ${i < Math.round(j.mi_voto!.nota / 2) ? 'grayscale-0' : 'grayscale opacity-20'}`}>⭐</span>
                                                                                    ))}
                                                                                </div>
                                                                                <span className="text-[10px] font-bold text-red-500">{j.mi_voto.nota}/10</span>
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[10px] text-[var(--text-muted)] font-medium mt-1">Sin votar aún</p>
                                                                        )}
                                                                        {(j.promedio || 0) > 0 && (
                                                                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                                                                                Promedio: <strong className="text-red-500">{j.promedio}</strong> <span className="opacity-50 font-medium">({j.total_votos} Votos)</span>
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {j.mi_voto && (
                                                                        <button
                                                                            onClick={() => handleEliminarVoto(j.id)}
                                                                            className="shrink-0 p-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => setVotandoA(j)}
                                                                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                                            j.mi_voto 
                                                                            ? 'bg-red-500/20 text-red-400 border border-red-500/20' 
                                                                            : 'bg-red-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                                                                        }`}
                                                                    >
                                                                        {j.mi_voto ? 'Editar' : 'Votar'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-[var(--card-border)] pt-8">
                                            <h3 className="font-black italic uppercase tracking-tighter text-sm mb-2">🏆 Premios Especiales</h3>
                                            <p className="text-[10px] text-[var(--text-muted)] font-medium mb-6">
                                                Elegí a los destacados del partido en cada categoría.
                                            </p>
                                            <FacetVotingCards 
                                                partidoId={partido.id} 
                                                jugadores={jugadores}
                                                votosExistentes={facetVotes}
                                                onVote={async (pid: string, facet: FacetType) => {
                                                    try {
                                                        await votarFaceta(partido.id, pid, facet)
                                                        showToast('Voto guardado 🏆', 'success')
                                                        loadData()
                                                    } catch {
                                                        showToast('Error al votar', 'error')
                                                    }
                                                }}
                                                onDeleteVote={async (facet: FacetType) => {
                                                    try {
                                                        await eliminarVotoFaceta(partido.id, facet)
                                                        showToast('Voto de faceta eliminado 🗑️', 'success')
                                                        loadData()
                                                    } catch {
                                                        showToast('Error al eliminar voto de faceta', 'error')
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'resultados' && (() => {
                                    const sorted = [...jugadores].sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
                                    const mvp = sorted[0]
                                    const azulesRes = jugadores.filter(j => j.equipo === 'azul').sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
                                    const rojosRes = jugadores.filter(j => j.equipo === 'rojo').sort((a, b) => (b.promedio || 0) - (a.promedio || 0))
                                    const promedioEquipo = (equipo: JugadorPartidoAmigo[]) => {
                                        const conVotos = equipo.filter(j => (j.promedio || 0) > 0)
                                        if (conVotos.length === 0) return 0
                                        return Math.round(conVotos.reduce((sum, j) => sum + (j.promedio || 0), 0) / conVotos.length * 10) / 10
                                    }
                                    return (
                                    <div className="space-y-6">
                                         {/* Marcador Final */}
                                         <div className="bg-gradient-to-br from-[#16a34a] to-emerald-600 p-8 rounded-3xl text-white text-center shadow-xl">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Marcador Final</p>
                                             <div className="flex items-center justify-center gap-8">
                                                 <div className="text-center">
                                                     <p className="text-4xl font-black tabular-nums">
                                                         {partido.resultado_azul ?? partido.resultado_azul ?? jugadores.filter(j => j.equipo === 'azul').reduce((acc, j) => acc + Number(j.goles || 0), 0)}
                                                     </p>
                                                     <p className="text-[9px] font-bold uppercase opacity-70 mt-1">AZUL</p>
                                                 </div>
                                                 <div className="text-2xl font-light opacity-50">-</div>
                                                 <div className="text-center">
                                                     <p className="text-4xl font-black tabular-nums">
                                                         {partido.resultado_rojo ?? partido.resultado_rojo ?? jugadores.filter(j => j.equipo === 'rojo').reduce((acc, j) => acc + Number(j.goles || 0), 0)}
                                                     </p>
                                                     <p className="text-[9px] font-bold uppercase opacity-70 mt-1">ROJO</p>
                                                 </div>
                                             </div>
                                         </div>

                                         {/* MVP */}
                                         {mvp && (mvp.promedio || 0) > 0 && (
                                             <motion.div
                                                 initial={{ scale: 0.9, opacity: 0 }}
                                                 animate={{ scale: 1, opacity: 1 }}
                                                 transition={{ delay: 0.2, type: 'spring' }}
                                                 className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden shadow-amber-500/30 cursor-pointer"
                                                 onClick={() => setJugadorDetalle(mvp)}
                                             >
                                                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
                                                 <p className="text-[10px] text-white/80 capitalize font-black tracking-[0.4em] mb-4">MEMBER OF THE MATCH</p>
                                                 <div className="relative inline-block mb-4">
                                                     <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
                                                     <div className="text-5xl relative">👑</div>
                                                 </div>
                                                 <h2 className="text-3xl font-black text-white italic tracking-tighter capitalize">{mvp.nombre}</h2>
                                                 <p className="text-4xl font-black text-white mt-2 drop-shadow-lg">⭐ {mvp.promedio}</p>
                                                 <p className="text-[10px] text-white/80 font-bold capitalize mt-4">{mvp.total_votos} VOTOS EN TOTAL</p>
                                                 <p className="text-[10px] text-white/60 mt-1">Tocá para ver detalle</p>
                                             </motion.div>
                                         )}

                                         {/* Rankings por Equipo */}
                                         {[{ equipo: 'azul', color: '#3b82f6', emoji: '🔵', lista: azulesRes, prom: promedioEquipo(azulesRes) },
                                           { equipo: 'rojo', color: '#ef4444', emoji: '🔴', lista: rojosRes, prom: promedioEquipo(rojosRes) }].map(team => (
                                             <div key={team.equipo} className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] overflow-hidden shadow-xl">
                                                 <div className="p-5 border-b border-[var(--card-border)] bg-[var(--background)]/50" style={{ borderLeftColor: team.color, borderLeftWidth: 6 }}>
                                                     <div className="flex justify-between items-end">
                                                         <div>
                                                             <h3 className="text-xs font-black capitalize tracking-[0.2em] mb-1" style={{ color: team.color }}>
                                                                 {team.emoji} EQUIPO {team.equipo.toUpperCase()}
                                                             </h3>
                                                             <p className="text-2xl font-black italic tracking-tighter">RANKING</p>
                                                         </div>
                                                         <div className="text-right">
                                                             <span className="text-[10px] text-[var(--text-muted)] font-black capitalize tracking-widest">PROM EQUIPO</span>
                                                             <p className="text-xl font-black" style={{ color: team.color }}>{team.prom}</p>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 <div>
                                                     {team.lista.map((j, i) => (
                                                         <button
                                                             key={j.id}
                                                             onClick={() => setJugadorDetalle(j)}
                                                             className={`w-full flex items-center gap-4 p-5 border-b border-[var(--card-border)] last:border-0 hover:bg-[var(--hover-bg)] transition-all text-left ${i === 0 ? 'bg-amber-400/5' : ''}`}
                                                         >
                                                             <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-400 text-amber-900 shadow-md' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}>
                                                                 {i + 1}
                                                             </span>
                                                             <div className="flex-1 min-w-0">
                                                                 <span className="font-bold text-sm block">
                                                                     {i === 0 && '👑 '}{j.nombre}
                                                                 </span>
                                                                 <div className="w-full h-1.5 bg-[var(--background)] rounded-full mt-2 overflow-hidden shadow-inner">
                                                                     <motion.div
                                                                         initial={{ width: 0 }}
                                                                         animate={{ width: `${((j.promedio || 0) / 10) * 100}%` }}
                                                                         transition={{ duration: 0.8 }}
                                                                         className="h-full rounded-full"
                                                                         style={{ backgroundColor: team.color }}
                                                                     />
                                                                 </div>
                                                             </div>
                                                             <div className="text-right">
                                                                 <span className="text-sm font-black italic" style={{ color: team.color }}>{j.promedio || '-'}</span>
                                                                 <p className="text-[8px] text-[var(--text-muted)] font-bold capitalize">{j.total_votos} V</p>
                                                             </div>
                                                         </button>
                                                     ))}
                                                     {team.lista.length === 0 && (
                                                         <p className="p-5 text-center text-xs text-[var(--text-muted)] italic">Sin jugadores</p>
                                                     )}
                                                 </div>
                                             </div>
                                         ))}

                                          {/* Estadísticas Reales */}
                                          <h3 className="font-black italic uppercase tracking-tighter text-sm pt-4">📈 Estadísticas del Partido</h3>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                              {[
                                                  { 
                                                      label: 'Máximo Goleador', 
                                                      emoji: '🔥', 
                                                      players: jugadores.filter(j => (j.goles || 0) > 0).sort((a, b) => (b.goles || 0) - (a.goles || 0)).slice(0, 1),
                                                      statName: 'goles',
                                                      statEmoji: '⚽'
                                                  },
                                                  { 
                                                      label: 'Máximo Asistidor', 
                                                      emoji: '🎯', 
                                                      players: jugadores.filter(j => (j.asistencias || 0) > 0).sort((a, b) => (b.asistencias || 0) - (a.asistencias || 0)).slice(0, 1),
                                                      statName: 'asistencias',
                                                      statEmoji: '👟'
                                                  }
                                              ].map((stat, i) => (
                                                  stat.players.length > 0 ? (
                                                      <div key={i} className="bg-gradient-to-br from-[var(--card-bg)] to-[var(--hover-bg)] p-5 rounded-3xl border border-[var(--card-border)] flex items-center gap-4 relative overflow-hidden group">
                                                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                              <span className="text-6xl">{stat.emoji}</span>
                                                          </div>
                                                          <span className="text-3xl relative z-10">{stat.emoji}</span>
                                                          <div className="min-w-0 relative z-10">
                                                              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{stat.label}</p>
                                                              <p className="font-bold text-sm truncate">{stat.players[0].nombre}</p>
                                                              <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-tighter">
                                                                  {stat.statName === 'goles' ? stat.players[0].goles : stat.players[0].asistencias} {stat.statEmoji}
                                                              </p>
                                                          </div>
                                                      </div>
                                                  ) : null
                                              ))}
                                              {jugadores.every(j => !j.goles && !j.asistencias) && (
                                                  <div className="col-span-full py-8 text-center text-[10px] text-[var(--text-muted)] font-bold italic opacity-50 bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--card-border)]">
                                                      No se cargaron goles ni asistencias aún
                                                  </div>
                                              )}
                                          </div>

                                          <h3 className="font-black italic uppercase tracking-tighter text-sm pt-4">🏅 Premios (Votación)</h3>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             {[
                                                 { id: 'goleador', label: 'El Goleador', emoji: '⚽' },
                                                 { id: 'comilon', label: 'El Comilón', emoji: '🍔' },
                                                 { id: 'patadas', label: 'Pegapatadas', emoji: '🦵' },
                                                 { id: 'arquero', label: 'Buen Arquero', emoji: '🧤' },
                                             ].map(facet => {
                                                 const counts = facetVotes
                                                     .filter(v => v.facet === facet.id)
                                                     .reduce((acc, v) => {
                                                         acc[v.player_id] = (acc[v.player_id] || 0) + 1
                                                         return acc
                                                     }, {} as Record<string, number>)
                                                 
                                                 const entries = Object.entries(counts)
                                                 if (entries.length === 0) return null
 
                                                 const [winnerId, votes] = entries.sort((a,b) => b[1] - a[1])[0]
                                                 const winner = jugadores.find(j => j.id === winnerId)
                                                 const totalVotes = facetVotes.filter(v => v.facet === facet.id).length
 
                                                 return (
                                                     <div key={facet.id} className="bg-[var(--card-bg)] p-5 rounded-3xl border border-[var(--card-border)] flex items-center gap-4 hover:border-[#16a34a]/30 transition-all">
                                                         <span className="text-3xl">{facet.emoji}</span>
                                                         <div className="min-w-0">
                                                             <p className="text-[9px] font-black text-[#16a34a] uppercase tracking-widest">{facet.label}</p>
                                                             <p className="font-bold text-sm truncate">{winner?.nombre || 'Desconocido'}</p>
                                                             <p className="text-[10px] text-[var(--text-muted)] font-medium">
                                                                 {votes} votos ({Math.round((votes/totalVotes)*100)}%)
                                                             </p>
                                                         </div>
                                                     </div>
                                                 )
                                             })}
                                             {facetVotes.length === 0 && (
                                                 <div className="col-span-full py-10 text-center bg-[var(--card-bg)] rounded-3xl border border-dashed border-[var(--card-border)] opacity-50">
                                                     <p className="text-xs font-bold italic">Aún no hay votos para los premios</p>
                                                 </div>
                                             )}
                                          </div>
                                    </div>
                                    )
                                })()}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Individual 1-10 Vote Modal */}
            <AnimatePresence>
                {votandoA && (
                    <VotarModal
                        jugador={votandoA}
                        onVotar={handleVotar}
                        onClose={() => setVotandoA(null)}
                    />
                )}
            </AnimatePresence>

            {/* Quick 1-10 Vote Modal */}
            <AnimatePresence>
                {showRapida && (
                    <VotacionRapida
                        jugadores={jugadores}
                        partidoId={partido.id}
                        onVotarTodos={handleVotarTodos}
                        onClose={() => setShowRapida(false)}
                    />
                )}
            </AnimatePresence>

            {/* Modal agregar jugador (Lineup) */}
            <AnimatePresence>
                {equipoAgregando && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
                        onClick={() => setEquipoAgregando(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--card-bg)] rounded-3xl p-6 w-full max-w-sm border border-[var(--card-border)] shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <h4 className="text-xl font-black mb-1 italic">➕ Agregar Jugador</h4>
                            <p className="text-xs text-[var(--text-muted)] mb-6 uppercase tracking-widest font-bold">
                                Equipo {equipoAgregando === 'azul' ? '🔵 Azul' : '🔴 Rojo'}
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block">Seleccionar Miembro</label>
                                    <div className="max-h-40 overflow-y-auto border border-[var(--card-border)] rounded-2xl bg-[var(--background)] p-2 space-y-1">
                                        {miembros.map(m => (
                                            <button
                                                key={m.user_id}
                                                onClick={() => {
                                                    setNuevoNombre(m.profile?.username || 'Usuario');
                                                    setSelectedUserId(m.user_id);
                                                }}
                                                className={`w-full text-left p-3 rounded-xl text-xs flex items-center gap-3 transition-all ${
                                                    selectedUserId === m.user_id 
                                                    ? 'bg-[#16a34a] text-white font-bold' 
                                                    : 'hover:bg-[var(--hover-bg)]'
                                                }`}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                                                    {m.profile?.username?.[0].toUpperCase()}
                                                </div>
                                                {m.profile?.username}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserPlus size={16} className="text-[var(--text-muted)]" />
                                    </div>
                                    <input
                                        type="text"
                                        value={nuevoNombre}
                                        onChange={e => {
                                            setNuevoNombre(e.target.value);
                                            setSelectedUserId(null);
                                        }}
                                        onKeyDown={e => e.key === 'Enter' && handleAgregarJugador()}
                                        placeholder="O nombre de invitado..."
                                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-2xl p-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a34a]/50 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => { setEquipoAgregando(null); setNuevoNombre(''); setSelectedUserId(null); setOrdenAgregando(null) }}
                                    className="flex-1 py-4 rounded-2xl text-[var(--text-muted)] font-black uppercase tracking-widest text-xs hover:bg-[var(--hover-bg)] transition-all"
                                >Cancelar</button>
                                <button
                                    onClick={handleAgregarJugador}
                                    disabled={!nuevoNombre.trim() || guardando}
                                    className="flex-1 py-4 rounded-2xl font-black text-white bg-[#16a34a] disabled:opacity-40 uppercase tracking-widest text-xs shadow-lg shadow-[#16a34a]/20 transition-all"
                                >{guardando ? '⏳' : 'Agregar'}</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Player Detail Modal */}
            <AnimatePresence>
                {jugadorDetalle && (
                    <DetalleJugadorAmigo
                        jugador={jugadorDetalle}
                        grupoId={grupoId}
                        onClose={() => setJugadorDetalle(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// Fix applied
