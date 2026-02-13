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
    const { partidos, loading, abrirVotacion, cerrarVotacion, eliminarPartido, refetch } = usePartidosAmigos(grupo.id)
    const { user } = useAuth()
    const { showToast } = useToast()

    const [creando, setCreando] = useState(false)
    const [votando, setVotando] = useState<PartidoAmigo | null>(null)
    const [viendoResultados, setViendoResultados] = useState<PartidoAmigo | null>(null)
    const [cerrandoId, setCerrandoId] = useState<string | null>(null)
    const [resultadoAzul, setResultadoAzul] = useState('')
    const [resultadoRojo, setResultadoRojo] = useState('')

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

    const handleCerrarVotacion = async (partido: PartidoAmigo) => {
        try {
            const rAzul = resultadoAzul ? parseInt(resultadoAzul) : undefined
            const rRojo = resultadoRojo ? parseInt(resultadoRojo) : undefined
            await cerrarVotacion(partido.id, rAzul, rRojo)
            showToast('Votación cerrada ✅', 'success')
            setCerrandoId(null)
            setResultadoAzul('')
            setResultadoRojo('')
        } catch {
            showToast('Error al cerrar votación', 'error')
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
                    {esAdmin && (
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
                            {esAdmin ? 'Creá el primero con el botón de arriba' : 'El admin del grupo puede crear partidos'}
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
                                    {esAdmin && (
                                        cerrandoId === p.id ? (
                                            <div className="flex gap-1 items-center">
                                                <input type="number" placeholder="🔵" value={resultadoAzul} onChange={e => setResultadoAzul(e.target.value)}
                                                    className="w-12 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg p-1 text-center text-sm" />
                                                <span className="text-xs">-</span>
                                                <input type="number" placeholder="🔴" value={resultadoRojo} onChange={e => setResultadoRojo(e.target.value)}
                                                    className="w-12 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg p-1 text-center text-sm" />
                                                <button onClick={() => handleCerrarVotacion(p)}
                                                    className="bg-[#8b5cf6] text-white px-2 py-1 rounded-lg text-xs font-bold">✓</button>
                                                <button onClick={() => setCerrandoId(null)}
                                                    className="text-xs text-[var(--text-muted)]">✕</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setCerrandoId(p.id)}
                                                className="px-3 py-3 rounded-xl text-xs font-bold border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                                            >
                                                🔒
                                            </button>
                                        )
                                    )}
                                </div>
                            </PartidoCard>
                        ))}
                    </Section>
                )}

                {/* Borradores (solo admin) */}
                {esAdmin && borradores.length > 0 && (
                    <Section title="📝 BORRADORES">
                        {borradores.map(p => (
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
                        ))}
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
        </>
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
