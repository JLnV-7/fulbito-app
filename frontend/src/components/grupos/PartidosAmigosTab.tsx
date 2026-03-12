// src/components/grupos/PartidosAmigosTab.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { CrearPartidoAmigo } from './CrearPartidoAmigo'
import { VotarJugadores } from './VotarJugadores'
import { MatchDetailTabs } from './MatchDetailTabs'
import type { PartidoAmigo, GrupoProde } from '@/types'

interface PartidosAmigosTabProps {
    grupo: GrupoProde
}

export function PartidosAmigosTab({ grupo }: PartidosAmigosTabProps) {
    const { partidos, loading, abrirVotacion, cerrarVotacion, cerrarPartidoMundial, eliminarPartido, refetch, fetchJugadoresConVotos } = usePartidosAmigos(grupo.id)
    const { user } = useAuth()
    const { showToast } = useToast()

    const [creando, setCreando] = useState(false)
    const [detalleVisible, setDetalleVisible] = useState<PartidoAmigo | null>(null)
    const [tabInicial, setTabInicial] = useState<'info' | 'stats' | 'votos' | 'resultados'>('info')
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
                    <h2 className="text-xl font-black capitalize italic tracking-tighter">⚽ Partidos Amigos</h2>
                    {user && (
                        <button
                            onClick={() => setCreando(true)}
                            className="bg-[#16a34a] text-white px-4 py-2 font-black capitalize tracking-widest text-[10px] hover:brightness-110 transition-all italic"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            + Crear Partido
                        </button>
                    )}
                </div>

                {/* Empty State */}
                {partidos.length === 0 && (
                    <div className="text-center py-16 bg-[var(--card-bg)] border border-[var(--card-border)]" style={{ borderRadius: 'var(--radius)' }}>
                        <div className="text-5xl mb-4">⚽</div>
                        <p className="font-black capitalize tracking-widest mb-1">No hay partidos</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-black capitalize">
                            {'Cualquier miembro del grupo puede crear partidos'}
                        </p>
                    </div>
                )}

                {/* Votación Abierta */}
                {votacionAbierta.length > 0 && (
                    <Section title="🗳️ VOTACIÓN ABIERTA">
                        {votacionAbierta.map(p => (
                            <PartidoCard key={p.id} partido={p} variant="votacion">
                                <div className="flex items-center justify-between gap-2 text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mb-3">
                                    <span>👥 {p.votos_usuarios || 0} votaron</span>
                                    <span>{p.jugadores_count} jugadores</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setDetalleVisible(p); setTabInicial('votos'); }}
                                        className="flex-1 bg-[#16a34a] text-white py-3 font-black capitalize tracking-widest italic text-sm hover:brightness-110 transition-all"
                                        style={{ borderRadius: 'var(--radius)' }}
                                    >
                                        🗳️ Votar y Stats
                                    </button>
                                    {(esAdmin || user?.id === p.creado_por) && (
                                        <button
                                            onClick={() => { setDetalleVisible(p); setTabInicial('stats'); }}
                                            className="px-3 py-3 text-[10px] font-black capitalize tracking-widest border border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                                            style={{ borderRadius: 'var(--radius)' }}
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
                                    <div className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mb-3 italic">
                                        📝 En armado... — {p.jugadores_count || 0} jugadores
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAbrirVotacion(p.id)}
                                            className="flex-1 bg-[#16a34a] text-white py-2.5 font-black capitalize tracking-widest text-xs"
                                            style={{ borderRadius: 'var(--radius)' }}
                                        >
                                            🗳️ Abrir Votación
                                        </button>
                                        <button
                                            onClick={() => handleEliminarPartido(p.id)}
                                            className={`px-3 py-2.5 font-black text-xs capitalize tracking-widest border transition-all ${confirmandoEliminar === p.id
                                                ? 'bg-[#991b1b] text-white border-[#991b1b]'
                                                : 'text-[#991b1b] border-[#991b1b]/30 hover:bg-[#991b1b]/10'
                                                }`}
                                            style={{ borderRadius: 'var(--radius)' }}
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
                                    <p className="text-sm font-black capitalize tracking-tighter mb-2 italic">
                                        🔵 Azul {p.resultado_azul} - {p.resultado_rojo} Rojo 🔴
                                    </p>
                                )}
                                <button
                                    onClick={() => { setDetalleVisible(p); setTabInicial('resultados'); }}
                                    className="w-full bg-[#2563eb] text-white py-2.5 font-black capitalize tracking-widest text-xs"
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    📊 Ver Resultados y Stats
                                </button>
                            </PartidoCard>
                        ))}
                    </Section>
                )}
            </div>

            {/* Modal de Detalle con Tabs */}
            <AnimatePresence>
                {detalleVisible && (
                    <MatchDetailTabs
                        partido={detalleVisible}
                        grupoId={grupo.id}
                        initialTab={tabInicial}
                        onClose={() => { setDetalleVisible(null); refetch() }}
                        onUpdate={refetch}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {creando && (
                    <CrearPartidoAmigo
                        grupoId={grupo.id}
                        onClose={() => setCreando(false)}
                        onCreated={refetch}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

// ── Section Header ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-black text-[var(--text-muted)] capitalize tracking-wider mb-3">{title}</h3>
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
    const borderColor = variant === 'votacion' ? '#16a34a' : variant === 'finalizado' ? '#2563eb' : 'var(--card-border)'

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
            className="bg-[var(--card-bg)] p-4 border border-[var(--card-border)]"
            style={{ borderLeftColor: borderColor, borderLeftWidth: 4, borderRadius: 'var(--radius)' }}
        >
            <div className="mb-3">
                <p className="text-[10px] font-black capitalize tracking-widest text-[var(--foreground)]">{formatFecha(partido.fecha, partido.hora)}</p>
                <p className="text-[9px] font-black capitalize tracking-widest text-[var(--text-muted)]">
                    ⚽ {getTipoLabel(partido.tipo_partido)}{partido.cancha ? ` - ${partido.cancha}` : ''}
                </p>
            </div>
            {children}
        </motion.div>
    )
}
