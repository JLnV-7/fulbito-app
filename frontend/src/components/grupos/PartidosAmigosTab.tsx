// src/components/grupos/PartidosAmigosTab.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { CrearPartidoAmigo } from './CrearPartidoAmigo'
import { VotarJugadores } from './VotarJugadores'
import { ResultadosPartidoAmigo } from './ResultadosPartidoAmigo'
import type { PartidoAmigo, GrupoProde } from '@/types'

interface PartidosAmigosTabProps {
    grupo: GrupoProde
}

export function PartidosAmigosTab({ grupo }: PartidosAmigosTabProps) {
    const { partidos, loading, abrirVotacion, cerrarVotacion, cerrarPartidoMundial, eliminarPartido, refetch, fetchJugadoresConVotos } = usePartidosAmigos(grupo.id)
    const { user } = useAuth()
    const { showToast } = useToast()

    const [creando, setCreando] = useState(false)
    const [votando, setVotando] = useState<PartidoAmigo | null>(null)
    const [viendoResultados, setViendoResultados] = useState<PartidoAmigo | null>(null)
    const [cerrandoId, setCerrandoId] = useState<string | null>(null)
    const [jugadoresCierre, setJugadoresCierre] = useState<any[]>([]) // Jugadores para el modal de cierre
    const [golesJugadores, setGolesJugadores] = useState<Record<string, number>>({}) // Map id -> goles
    const [asistenciasJugadores, setAsistenciasJugadores] = useState<Record<string, number>>({}) // Map id -> asistencias
    const [procesandoCierre, setProcesandoCierre] = useState(false)

    const esAdmin = user?.id === grupo.admin_id

    const votacionAbierta = partidos.filter(p => p.estado === 'votacion_abierta')
    const borradores = partidos.filter(p => p.estado === 'borrador')
    const finalizados = partidos.filter(p => p.estado === 'finalizado')

    const formatFecha = (fecha: string, hora: string) => {
        const d = new Date(fecha + 'T00:00:00')
        return d.toLocaleDateString('es-AR', {
            weekday: 'short', day: 'numeric', month: 'short'
        }) + ` - ${hora.slice(0, 5)}`
    }

    const getTipoLabel = (tipo: string) => {
        const map: Record<string, string> = { '5': 'Fútbol 5', '7': 'Fútbol 7', '8': 'Fútbol 8', '9': 'Fútbol 9', '11': 'Fútbol 11' }
        return map[tipo] || tipo
    }

    const handleClickCerrar = async (partidoId: string) => {
        try {
            setCerrandoId(partidoId)
            const jugadores = await fetchJugadoresConVotos(partidoId)
            setJugadoresCierre(jugadores)
            // Init goles a 0
            const initGoles: Record<string, number> = {}
            const initAsistencias: Record<string, number> = {}
            jugadores.forEach(j => {
                initGoles[j.id] = 0
                initAsistencias[j.id] = 0
            })
            setGolesJugadores(initGoles)
            setAsistenciasJugadores(initAsistencias)
        } catch {
            showToast('Error cargando jugadores', 'error')
            setCerrandoId(null)
        }
    }

    const handleConfirmarCierre = async () => {
        if (!cerrandoId) return
        setProcesandoCierre(true)
        try {
            // Calcular resultados globales
            const azul = jugadoresCierre
                .filter(j => j.equipo === 'azul')
                .reduce((acc, j) => acc + (golesJugadores[j.id] || 0), 0)
            const rojo = jugadoresCierre
                .filter(j => j.equipo === 'rojo')
                .reduce((acc, j) => acc + (golesJugadores[j.id] || 0), 0)

            // Preparar payload de goles y asistencias
            const payload = Object.entries(golesJugadores).map(([id, goles]) => ({
                id,
                goles,
                asistencias: asistenciasJugadores[id] || 0
            }))

            await cerrarPartidoMundial(cerrandoId, azul, rojo, payload)

            showToast('Partido cerrado y rachas actualizadas 🏆', 'success')
            setCerrandoId(null)
            setJugadoresCierre([])
            setGolesJugadores({})
            setAsistenciasJugadores({})
        } catch (err: any) {
            showToast('Error: ' + err.message, 'error')
        } finally {
            setProcesandoCierre(false)
        }
    }

    const handleAbrirVotacion = async (partidoId: string) => {
        try {
            await abrirVotacion(partidoId)
            showToast('Votación abierta 🗳️', 'success')
        } catch {
            showToast('Error al abrir votación', 'error')
        }
    }

    const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(null)

    const handleEliminarPartido = async (partidoId: string) => {
        if (confirmandoEliminar !== partidoId) {
            setConfirmandoEliminar(partidoId)
            return
        }
        try {
            await eliminarPartido(partidoId)
            showToast('Partido eliminado', 'success')
        } catch {
            showToast('Error al eliminar', 'error')
        } finally {
            setConfirmandoEliminar(null)
        }
    }

    if (loading) {
        return <div className="text-center py-10 text-[var(--text-muted)]">⏳ Cargando partidos...</div>
    }

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black">⚽ Partidos entre Amigos</h2>
                    {user && (
                        <button
                            onClick={() => setCreando(true)}
                            className="bg-[#10b981] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#059669] transition-all"
                        >
                            + Crear Partido
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {partidos.length === 0 && (
                    <div className="text-center py-16 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
                        <div className="text-5xl mb-4">⚽</div>
                        <p className="font-bold mb-1">No hay partidos entre amigos</p>
                        <p className="text-sm text-[var(--text-muted)]">
                            {'Cualquier miembro del grupo puede crear partidos'}
                        </p>
                    </div>
                )}

                {/* Votación Abierta */}
                {votacionAbierta.length > 0 && (
                    <Section title="🗳️ VOTACIÓN ABIERTA">
                        {votacionAbierta.map(p => (
                            <PartidoCard key={p.id} partido={p} variant="votacion">
                                <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)] mb-3">
                                    <span>👥 {p.votos_usuarios || 0} votaron</span>
                                    <span>{p.jugadores_count} jugadores</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setVotando(p)}
                                        className="flex-1 bg-[#10b981] text-white py-3 rounded-xl font-black hover:bg-[#059669] transition-all"
                                    >
                                        🗳️ Votar
                                    </button>
                                    <button
                                        onClick={() => setViendoResultados(p)}
                                        className="flex-1 bg-[#8b5cf6] text-white py-3 rounded-xl font-black hover:bg-[#7c3aed] transition-all"
                                    >
                                        📊 Resultados
                                    </button>
                                    {(esAdmin || user?.id === p.creado_por) && (
                                        <button
                                            onClick={() => handleClickCerrar(p.id)}
                                            className="px-3 py-3 rounded-xl text-xs font-bold border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                                        >
                                            🔒 Cerrar
                                        </button>
                                    )}
                                </div>
                            </PartidoCard>
                        ))}
                    </Section>
                )}

                {/* Borradores (admin o creador) */}
                {borradores.length > 0 && (
                    <Section title="📝 BORRADORES">
                        {borradores.map(p => {
                            const puedeEditar = esAdmin || user?.id === p.creado_por
                            if (!puedeEditar) return null

                            return (
                                <PartidoCard key={p.id} partido={p} variant="borrador">
                                    <div className="text-xs text-[var(--text-muted)] mb-3">
                                        📝 En armado... — {p.jugadores_count || 0} jugadores cargados
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAbrirVotacion(p.id)}
                                            className="flex-1 bg-[#10b981] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#059669]"
                                        >
                                            🗳️ Abrir Votación
                                        </button>
                                        <button
                                            onClick={() => handleEliminarPartido(p.id)}
                                            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${confirmandoEliminar === p.id
                                                ? 'bg-[#ef4444] text-white border-[#ef4444]'
                                                : 'text-[#ef4444] border-[#ef4444]/30 hover:bg-[#ef4444]/10'
                                                }`}
                                        >
                                            {confirmandoEliminar === p.id ? '¿Seguro?' : '🗑️'}
                                        </button>
                                    </div>
                                </PartidoCard>
                            )
                        })}
                    </Section>
                )}

                {/* Finalizados */}
                {finalizados.length > 0 && (
                    <Section title="✅ FINALIZADOS">
                        {finalizados.map(p => (
                            <PartidoCard key={p.id} partido={p} variant="finalizado">
                                {p.resultado_azul !== null && p.resultado_rojo !== null && (
                                    <p className="text-sm font-black mb-2">
                                        🔵 Azul {p.resultado_azul} - {p.resultado_rojo} Rojo 🔴
                                    </p>
                                )}
                                <button
                                    onClick={() => setViendoResultados(p)}
                                    className="w-full bg-[#8b5cf6] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#7c3aed] transition-all"
                                >
                                    📊 Ver Stats Completas
                                </button>
                            </PartidoCard>
                        ))}
                    </Section>
                )}
            </div>

            {/* Modals / Full-screen views */}
            <AnimatePresence>
                {creando && (
                    <CrearPartidoAmigo
                        grupoId={grupo.id}
                        onClose={() => setCreando(false)}
                        onCreated={refetch}
                    />
                )}
            </AnimatePresence>

            {votando && (
                <VotarJugadores
                    partido={votando}
                    grupoId={grupo.id}
                    onClose={() => { setVotando(null); refetch() }}
                />
            )}

            {viendoResultados && (
                <ResultadosPartidoAmigo
                    partido={viendoResultados}
                    grupoId={grupo.id}
                    onClose={() => setViendoResultados(null)}
                />
            )}

            {/* Modal Cierre Mundial */}
            <AnimatePresence>
                {cerrandoId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md border border-[var(--card-border)] max-h-[90vh] overflow-y-auto"
                        >
                            <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                                🔒 Cerrar Partido y Cargar Goles
                            </h2>
                            <p className="text-sm text-[var(--text-muted)] mb-4">
                                Ingresá los goles de cada jugador. Esto calculará el resultado final y actualizará las rachas de victorias.
                            </p>

                            <div className="space-y-6">
                                {/* Equipo Azul */}
                                <div>
                                    <h3 className="font-black text-blue-500 mb-2 border-b border-blue-500/20 pb-1">
                                        🔵 EQUIPO AZUL
                                    </h3>
                                    <div className="space-y-2">
                                        {jugadoresCierre.filter(j => j.equipo === 'azul').map(j => (
                                            <div key={j.id} className="flex items-center justify-between">
                                                <span className="text-sm w-24 truncate">{j.nombre}</span>
                                                <div className="flex gap-4">
                                                    {/* Goles */}
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">⚽</span>
                                                        <div className="flex items-center gap-1 bg-[var(--input-bg)] rounded-lg p-0.5">
                                                            <button
                                                                onClick={() => setGolesJugadores(prev => ({ ...prev, [j.id]: Math.max(0, (prev[j.id] || 0) - 1) }))}
                                                                className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:bg-black/10 rounded"
                                                            >-</button>
                                                            <span className="w-4 text-center font-bold text-sm">{golesJugadores[j.id] || 0}</span>
                                                            <button
                                                                onClick={() => setGolesJugadores(prev => ({ ...prev, [j.id]: (prev[j.id] || 0) + 1 }))}
                                                                className="w-6 h-6 flex items-center justify-center text-green-500 hover:bg-green-500/10 rounded"
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    {/* Asistencias */}
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">👟</span>
                                                        <div className="flex items-center gap-1 bg-[var(--input-bg)] rounded-lg p-0.5">
                                                            <button
                                                                onClick={() => setAsistenciasJugadores(prev => ({ ...prev, [j.id]: Math.max(0, (prev[j.id] || 0) - 1) }))}
                                                                className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:bg-black/10 rounded"
                                                            >-</button>
                                                            <span className="w-4 text-center font-bold text-sm">{asistenciasJugadores[j.id] || 0}</span>
                                                            <button
                                                                onClick={() => setAsistenciasJugadores(prev => ({ ...prev, [j.id]: (prev[j.id] || 0) + 1 }))}
                                                                className="w-6 h-6 flex items-center justify-center text-blue-500 hover:bg-blue-500/10 rounded"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Equipo Rojo */}
                                <div>
                                    <h3 className="font-black text-red-500 mb-2 border-b border-red-500/20 pb-1">
                                        🔴 EQUIPO ROJO
                                    </h3>
                                    <div className="space-y-2">
                                        {jugadoresCierre.filter(j => j.equipo === 'rojo').map(j => (
                                            <div key={j.id} className="flex items-center justify-between">
                                                <span className="text-sm w-24 truncate">{j.nombre}</span>
                                                <div className="flex gap-4">
                                                    {/* Goles */}
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">⚽</span>
                                                        <div className="flex items-center gap-1 bg-[var(--input-bg)] rounded-lg p-0.5">
                                                            <button
                                                                onClick={() => setGolesJugadores(prev => ({ ...prev, [j.id]: Math.max(0, (prev[j.id] || 0) - 1) }))}
                                                                className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:bg-black/10 rounded"
                                                            >-</button>
                                                            <span className="w-4 text-center font-bold text-sm">{golesJugadores[j.id] || 0}</span>
                                                            <button
                                                                onClick={() => setGolesJugadores(prev => ({ ...prev, [j.id]: (prev[j.id] || 0) + 1 }))}
                                                                className="w-6 h-6 flex items-center justify-center text-green-500 hover:bg-green-500/10 rounded"
                                                            >+</button>
                                                        </div>
                                                    </div>

                                                    {/* Asistencias */}
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[10px] text-[var(--text-muted)] mb-0.5">👟</span>
                                                        <div className="flex items-center gap-1 bg-[var(--input-bg)] rounded-lg p-0.5">
                                                            <button
                                                                onClick={() => setAsistenciasJugadores(prev => ({ ...prev, [j.id]: Math.max(0, (prev[j.id] || 0) - 1) }))}
                                                                className="w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:bg-black/10 rounded"
                                                            >-</button>
                                                            <span className="w-4 text-center font-bold text-sm">{asistenciasJugadores[j.id] || 0}</span>
                                                            <button
                                                                onClick={() => setAsistenciasJugadores(prev => ({ ...prev, [j.id]: (prev[j.id] || 0) + 1 }))}
                                                                className="w-6 h-6 flex items-center justify-center text-blue-500 hover:bg-blue-500/10 rounded"
                                                            >+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Resultados Calc */}
                                    <div className="bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)] text-center">
                                        <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Resultado Final</p>
                                        <div className="flex items-center justify-center gap-4 font-black text-xl">
                                            <span className="text-blue-500">
                                                {jugadoresCierre.filter(j => j.equipo === 'azul').reduce((acc, j) => acc + (golesJugadores[j.id] || 0), 0)}
                                            </span>
                                            <span className="text-[var(--text-muted)]">-</span>
                                            <span className="text-red-500">
                                                {jugadoresCierre.filter(j => j.equipo === 'rojo').reduce((acc, j) => acc + (golesJugadores[j.id] || 0), 0)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setCerrandoId(null)}
                                        className="flex-1 py-3 rounded-xl font-bold text-[var(--text-muted)] border border-[var(--card-border)]"
                                    >Cancelar</button>
                                    <button
                                        onClick={handleConfirmarCierre}
                                        disabled={procesandoCierre}
                                        className="flex-1 py-3 rounded-xl font-black text-white bg-[#8b5cf6] disabled:opacity-50"
                                    >
                                        {procesandoCierre ? '⏳ Procesando...' : '🏆 Confirmar y Cerrar'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>        </>
    )
}

// ── Section Header ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-wider mb-3">{title}</h3>
            <div className="space-y-3">{children}</div>
        </div>
    )
}

// ── Match Card ──
function PartidoCard({ partido, variant, children }: {
    partido: PartidoAmigo
    variant: 'votacion' | 'borrador' | 'finalizado'
    children: React.ReactNode
}) {
    const borderColor = variant === 'votacion' ? '#10b981' : variant === 'finalizado' ? '#8b5cf6' : 'var(--card-border)'

    const formatFecha = (fecha: string, hora: string) => {
        const d = new Date(fecha + 'T00:00:00')
        return d.toLocaleDateString('es-AR', {
            weekday: 'short', day: 'numeric', month: 'short'
        }) + ` - ${hora.slice(0, 5)}`
    }

    const getTipoLabel = (tipo: string) => {
        const map: Record<string, string> = { '5': 'Fútbol 5', '7': 'Fútbol 7', '8': 'Fútbol 8', '9': 'Fútbol 9', '11': 'Fútbol 11' }
        return map[tipo] || tipo
    }

    return (
        <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[var(--card-bg)] rounded-2xl p-4 border border-[var(--card-border)] shadow-sm"
            style={{ borderLeftColor: borderColor, borderLeftWidth: 4 }}
        >
            <div className="mb-3">
                <p className="text-sm font-bold">{formatFecha(partido.fecha, partido.hora)}</p>
                <p className="text-xs text-[var(--text-muted)]">
                    ⚽ {getTipoLabel(partido.tipo_partido)}{partido.cancha ? ` - ${partido.cancha}` : ''}
                </p>
            </div>
            {children}
        </motion.div>
    )
}
