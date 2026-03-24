// src/components/grupos/PartidoModal.tsx
// Modal principal de detalle de partido — rediseño completo
// Usa usePartidoDetalle directamente, sin hooks anidados

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Info, Inbox, Trophy, BarChart2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { usePartidoDetalle } from '@/hooks/usePartidoDetalle'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import type { PartidoAmigo, JugadorPartidoAmigo, FacetType } from '@/types'

// ── Sub-componentes de tabs ──────────────────────────────────────────────────
import { TabInfo } from './partido-tabs/TabInfo'
import { TabVotos } from './partido-tabs/TabVotos'
import { TabResultados } from './partido-tabs/TabResultados'
import { TabStats } from './partido-tabs/TabStats'

type Tab = 'info' | 'votos' | 'resultados' | 'stats'

interface Props {
    partido: PartidoAmigo
    grupoId: string
    adminId: string
    initialTab?: Tab
    onClose: () => void
    onUpdate: () => void
}

export function PartidoModal({ partido, grupoId, adminId, initialTab = 'info', onClose, onUpdate }: Props) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [activeTab, setActiveTab] = useState<Tab>(initialTab)

    const canEdit = user?.id === partido.creado_por || user?.id === adminId

    const {
        jugadores, facetVotes, loading, error,
        fetch, votar, eliminarVoto,
        votarFaceta, eliminarFaceta,
        agregarJugador, eliminarJugador,
        guardarStats, reabrirStats,
        fetchDetalleJugador,
    } = usePartidoDetalle(partido.id, grupoId)

    // Fetch al montar — una sola vez
    useEffect(() => { 
        fetch() 
        // Bloquear body scroll al montar
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = 'unset' }
    }, [partido.id])

    const handleError = (msg: string) => showToast(msg, 'error')
    const handleSuccess = (msg: string) => showToast(msg, 'success')

    const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
        { id: 'info',       label: 'Info',       icon: Info },
        { id: 'votos',      label: 'Votos',      icon: Inbox },
        { id: 'resultados', label: 'Resultados', icon: Trophy },
        { id: 'stats',      label: 'Stats',      icon: BarChart2 },
    ]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 bg-[var(--background)] z-[60] flex flex-col"
        >
            {/* Header */}
            <div className="bg-[#16a34a] text-white pt-10 pb-4 px-6 relative shrink-0">
                <button
                    onClick={onClose}
                    className="absolute top-10 right-6 p-2 bg-black/20 rounded-full hover:bg-black/30 transition-all"
                >
                    <X size={20} />
                </button>
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-black italic tracking-tighter">⚽ Partido</h2>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">
                        {new Date(partido.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                            weekday: 'long', day: 'numeric', month: 'long'
                        })} · {partido.hora.slice(0, 5)} hs
                    </p>
                    {partido.cancha && (
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                            📍 {partido.cancha}
                        </p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-2 shrink-0">
                <div className="max-w-2xl mx-auto flex gap-1">
                    {tabs.map(tab => (
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
                            <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <LoadingSpinner />
                            <p className="text-[10px] font-black uppercase tracking-widest mt-4">Cargando...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <p className="text-red-500 font-bold text-sm mb-4">{error}</p>
                            <button
                                onClick={fetch}
                                className="bg-[#16a34a] text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                            >
                                {activeTab === 'info' && (
                                    <TabInfo
                                        partido={partido}
                                        jugadores={jugadores}
                                        grupoId={grupoId}
                                        canEdit={canEdit}
                                        onAgregarJugador={async (nombre, equipo, userId) => {
                                            try {
                                                await agregarJugador(nombre, equipo, userId)
                                                handleSuccess('Jugador agregado')
                                            } catch (e: any) { handleError(e.message) }
                                        }}
                                        onEliminarJugador={async (id) => {
                                            try {
                                                await eliminarJugador(id)
                                                handleSuccess('Jugador eliminado')
                                            } catch { handleError('Error al eliminar') }
                                        }}
                                    />
                                )}
                                {activeTab === 'votos' && (
                                    <TabVotos
                                        partido={partido}
                                        jugadores={jugadores}
                                        facetVotes={facetVotes}
                                        onVotar={async (jugadorId, nota, comentario) => {
                                            try {
                                                await votar(jugadorId, nota, comentario)
                                                handleSuccess('Voto guardado ⭐')
                                            } catch { handleError('Error al votar') }
                                        }}
                                        onEliminarVoto={async (jugadorId) => {
                                            try {
                                                await eliminarVoto(jugadorId)
                                                handleSuccess('Voto eliminado')
                                            } catch { handleError('Error al eliminar voto') }
                                        }}
                                        onVotarFaceta={async (playerId, facet) => {
                                            try {
                                                await votarFaceta(playerId, facet)
                                                handleSuccess('Premio asignado 🏆')
                                            } catch { handleError('Error al votar') }
                                        }}
                                        onEliminarFaceta={async (facet) => {
                                            try {
                                                await eliminarFaceta(facet)
                                                handleSuccess('Premio eliminado')
                                            } catch { handleError('Error al eliminar') }
                                        }}
                                        onRefresh={fetch}
                                        onVerDetalle={fetchDetalleJugador}
                                    />
                                )}
                                {activeTab === 'resultados' && (
                                    <TabResultados
                                        partido={partido}
                                        jugadores={jugadores}
                                        facetVotes={facetVotes}
                                        onVerDetalle={fetchDetalleJugador}
                                        onRefresh={fetch}
                                    />
                                )}
                                {activeTab === 'stats' && (
                                    <TabStats
                                        partido={partido}
                                        jugadores={jugadores}
                                        canEdit={canEdit}
                                        onGuardar={async (stats, azul, rojo) => {
                                            try {
                                                await guardarStats(stats, azul, rojo)
                                                handleSuccess('Estadísticas guardadas 🏆')
                                                onUpdate()
                                            } catch (e: any) { handleError(e.message) }
                                        }}
                                        onReabrir={async () => {
                                            try {
                                                await reabrirStats()
                                                handleSuccess('Estadísticas reabiertas')
                                            } catch { handleError('Error al reabrir') }
                                        }}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
