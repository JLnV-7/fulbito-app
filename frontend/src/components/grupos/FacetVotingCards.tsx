'use client'

import { motion } from 'framer-motion'
import type { JugadorPartidoAmigo, FacetType, FacetVote } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

interface FacetVotingCardsProps {
    partidoId: string
    jugadores: JugadorPartidoAmigo[]
    votosExistentes: FacetVote[]
    onVote: (playerId: string, facet: FacetType) => void
    onDeleteVote: (facet: FacetType) => void
}

export function FacetVotingCards({ jugadores, votosExistentes, onVote, onDeleteVote }: FacetVotingCardsProps) {
    const { user } = useAuth()
    
    const facets: { id: FacetType, label: string, emoji: string, color: string, desc: string }[] = [
        { id: 'goleador', label: 'Goleador', emoji: '⚽', color: '#16a34a', desc: 'El más determinante' },
        { id: 'comilon', label: 'El Comilón', emoji: '🍔', color: '#f59e0b', desc: 'Morfó más que lo que jugó' },
        { id: 'patadas', label: 'Pegapatadas', emoji: '🦵', color: '#ef4444', desc: 'Hachó todo lo que pasó' },
        { id: 'arquero', label: 'Buen Arquero', emoji: '🧤', color: '#3b82f6', desc: 'Las sacó todas' },
    ]

    const getMyVoteForFacet = (facet: FacetType) => {
        return votosExistentes.find(v => v.voter_id === user?.id && v.facet === facet)
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {facets.map((facet) => {
                const myVote = getMyVoteForFacet(facet.id)
                const selectedPlayer = jugadores.find(j => j.id === myVote?.player_id)

                return (
                    <motion.div
                        key={facet.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className={`bg-[var(--card-bg)] rounded-3xl border-2 p-5 transition-all shadow-sm ${
                            myVote ? 'border-[#16a34a]/30 bg-[#16a34a]/5' : 'border-[var(--card-border)]'
                        }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{facet.emoji}</span>
                                    <h4 className="font-black italic uppercase tracking-tighter text-sm">
                                        {facet.label}
                                    </h4>
                                </div>
                                <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-1">
                                    {facet.desc}
                                </p>
                            </div>
                            {myVote && (
                                <button 
                                    onClick={() => onDeleteVote(facet.id)}
                                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/10"
                                    title="Quitar voto"
                                >
                                    🗑️
                                </button>
                            )}
                        </div>

                        <select
                            value={myVote?.player_id || ''}
                            onChange={(e) => onVote(e.target.value, facet.id)}
                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl py-3 px-4 text-xs font-bold focus:outline-none focus:border-[#16a34a] transition-colors appearance-none"
                        >
                            <option value="" disabled>Elegir jugador...</option>
                            <optgroup label="Equipo Azul">
                                {jugadores.filter(j => j.equipo === 'azul').map(j => (
                                    <option key={j.id} value={j.id}>{j.nombre}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Equipo Rojo">
                                {jugadores.filter(j => j.equipo === 'rojo').map(j => (
                                    <option key={j.id} value={j.id}>{j.nombre}</option>
                                ))}
                            </optgroup>
                        </select>

                        {selectedPlayer && (
                            <div className="mt-3 flex items-center gap-2 px-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${selectedPlayer.equipo === 'azul' ? 'bg-blue-500' : 'bg-red-500'}`} />
                                <p className="text-[10px] font-bold text-[var(--text-muted)]">
                                    Tu voto: <span className="text-[var(--foreground)]">{selectedPlayer.nombre}</span>
                                </p>
                            </div>
                        )}
                    </motion.div>
                )
            })}
        </div>
    )
}
