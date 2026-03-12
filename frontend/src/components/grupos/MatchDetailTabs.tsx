'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePartidosAmigos } from '@/hooks/usePartidosAmigos'
import { useToast } from '@/contexts/ToastContext'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Info, BarChart2, Inbox, Trophy, X } from 'lucide-react'
import type { PartidoAmigo, JugadorPartidoAmigo, FacetType, FacetVote } from '@/types'
import { FacetVotingCards } from './FacetVotingCards'
import { MatchStatisticsPanel } from './MatchStatisticsPanel'
import { useAuth } from '@/contexts/AuthContext'

interface MatchDetailTabsProps {
    partido: PartidoAmigo
    grupoId: string
    onClose: () => void
    onUpdate: () => void
}

export function MatchDetailTabs({ partido, grupoId, onClose, onUpdate }: MatchDetailTabsProps) {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<'info' | 'stats' | 'votos' | 'resultados'>('info')
    const { fetchJugadoresConVotos, votarJugador, votarFaceta, fetchFacetVotes } = usePartidosAmigos(grupoId)
    const { showToast } = useToast()
    
    const [jugadores, setJugadores] = useState<JugadorPartidoAmigo[]>([])
    const [facetVotes, setFacetVotes] = useState<FacetVote[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [partido.id])

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
                                    </div>
                                )}

                                {activeTab === 'stats' && (
                                    <MatchStatisticsPanel 
                                        partido={partido}
                                        jugadores={jugadores}
                                        grupoId={grupoId}
                                        onUpdate={() => { onUpdate(); loadData(); }}
                                    />
                                )}

                                {activeTab === 'votos' && (
                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="font-black italic uppercase tracking-tighter text-sm mb-4">⭐ Puntuación General (1-10)</h3>
                                            <p className="text-center py-4 opacity-50 text-xs">Votar tocando a los jugadores...</p>
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
                                                onVote={async (pid, facet) => {
                                                    try {
                                                        await votarFaceta(partido.id, pid, facet)
                                                        showToast('Voto guardado 🏆', 'success')
                                                        loadData()
                                                    } catch {
                                                        showToast('Error al votar', 'error')
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'resultados' && (
                                    <div className="space-y-6">
                                         <div className="bg-gradient-to-br from-[#16a34a] to-emerald-600 p-8 rounded-3xl text-white text-center shadow-xl">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Marcador Final</p>
                                            <div className="flex items-center justify-center gap-8">
                                                <div className="text-center">
                                                    <p className="text-4xl font-black tabular-nums">{partido.resultado_azul ?? 0}</p>
                                                    <p className="text-[9px] font-bold uppercase opacity-70 mt-1">AZUL</p>
                                                </div>
                                                <div className="text-2xl font-light opacity-50">-</div>
                                                <div className="text-center">
                                                    <p className="text-4xl font-black tabular-nums">{partido.resultado_rojo ?? 0}</p>
                                                    <p className="text-[9px] font-bold uppercase opacity-70 mt-1">ROJO</p>
                                                </div>
                                            </div>
                                         </div>

                                         <h3 className="font-black italic uppercase tracking-tighter text-sm pt-4">🏅 Los Mejores del Partido</h3>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {[
                                                { id: 'goleador', label: 'Goleador', emoji: '⚽' },
                                                { id: 'comilon', label: 'El Comilón', emoji: '🍔' },
                                                { id: 'patadas', label: 'Pegapatadas', emoji: '🦵' },
                                                { id: 'arquero', label: 'Buen Arquero', emoji: '🧤' },
                                            ].map(facet => {
                                                // Count votes for this facet
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
                                                    <div key={facet.id} className="bg-[var(--card-bg)] p-5 rounded-3xl border border-[var(--card-border)] flex items-center gap-4">
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
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
