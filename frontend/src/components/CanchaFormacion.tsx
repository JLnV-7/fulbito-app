// src/components/CanchaFormacion.tsx
'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface JugadorAPI {
    id: number
    nombre: string
    numero: number
    posicion: string
}

interface CanchaFormacionProps {
    jugadores: JugadorAPI[]
    nombreEquipo: string
    votos: Record<number, number>
    onVotar: (jugadorId: number, nota: number) => void
    partidoFinalizado: boolean
}

// Color según la nota (estilo SofaScore)
function getNotaColor(nota: number): string {
    if (nota >= 8) return 'bg-[#10b981]'
    if (nota >= 6) return 'bg-[#22c55e]'
    if (nota >= 5) return 'bg-[#fbbf24]'
    if (nota >= 4) return 'bg-[#f97316]'
    return 'bg-[#ef4444]'
}

function getNotaBgHover(nota: number): string {
    if (nota >= 8) return 'hover:bg-[#10b981]'
    if (nota >= 6) return 'hover:bg-[#22c55e]'
    if (nota >= 5) return 'hover:bg-[#fbbf24]'
    if (nota >= 4) return 'hover:bg-[#f97316]'
    return 'hover:bg-[#ef4444]'
}

export const CanchaFormacion = memo(({
    jugadores,
    nombreEquipo,
    votos,
    onVotar,
    partidoFinalizado
}: CanchaFormacionProps) => {
    const [jugadorSeleccionado, setJugadorSeleccionado] = useState<JugadorAPI | null>(null)
    const [animatingVote, setAnimatingVote] = useState<number | null>(null)

    // Agrupar jugadores por posición
    const arqueros = jugadores.filter(j => j.posicion === 'ARQ')
    const defensores = jugadores.filter(j => j.posicion === 'DEF')
    const mediocampistas = jugadores.filter(j => j.posicion === 'MED')
    const delanteros = jugadores.filter(j => j.posicion === 'DEL')

    const handleJugadorClick = (jugador: JugadorAPI) => {
        if (partidoFinalizado) {
            setJugadorSeleccionado(jugador)
        }
    }

    const handleVotar = (nota: number) => {
        if (jugadorSeleccionado) {
            setAnimatingVote(jugadorSeleccionado.id)
            onVotar(jugadorSeleccionado.id, nota)
            setJugadorSeleccionado(null)
            setTimeout(() => setAnimatingVote(null), 600)
        }
    }

    const JugadorBall = ({ jugador }: { jugador: JugadorAPI }) => {
        const tieneVoto = (votos[jugador.id] || 0) > 0
        const isAnimating = animatingVote === jugador.id

        return (
            <button
                onClick={() => handleJugadorClick(jugador)}
                disabled={!partidoFinalizado}
                className={`relative flex flex-col items-center group transition-all duration-300
                   ${partidoFinalizado ? 'cursor-pointer hover:scale-110 active:scale-90' : 'cursor-default'}`}
            >
                {/* Círculo del jugador (Touch Target 64x64 or 72x72) */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center
                        border-[3px] transition-all duration-300 relative overflow-hidden
                        ${tieneVoto
                        ? 'bg-gradient-to-br from-[#10b981] to-[#059669] border-[#10b981] shadow-lg shadow-[#10b981]/40'
                        : 'bg-[var(--card-bg)]/80 backdrop-blur-sm border-[var(--card-border)] group-hover:border-[#10b981]/50 shadow-md'
                    }
                    ${isAnimating ? 'scale-125 shadow-xl shadow-[#10b981]/60' : ''}`}>

                    {/* Silueta de jugador simulada */}
                    <div className="absolute bottom-0 w-12 h-12 bg-white/10 rounded-t-full translate-y-3"></div>

                    <span className={`font-black text-xl sm:text-2xl relative z-10 transition-colors
                        ${tieneVoto ? 'text-white' : 'text-[var(--foreground)]'}`}>
                        {jugador.numero}
                    </span>
                </div>

                {/* Nombre */}
                <div className="mt-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black text-white
                        whitespace-nowrap max-w-[90px] truncate shadow-lg border border-white/10">
                    {jugador.nombre.split(' ').pop()}
                </div>

                {/* Badge de voto */}
                {tieneVoto && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -top-1 -right-1 w-7 h-7 rounded-full
                          flex items-center justify-center text-[11px] font-black text-white
                          border-2 border-white shadow-lg z-20 transition-all duration-300 ${getNotaColor(votos[jugador.id])}
                          ${isAnimating ? 'scale-150 animate-pulse' : ''}`}>
                        {votos[jugador.id]}
                    </motion.div>
                )}
            </button>
        )
    }

    return (
        <div className="relative">
            {/* Cancha */}
            <div className="bg-gradient-to-b from-[#2d5016] to-[#1e3a0f] rounded-2xl overflow-hidden
                      border-2 border-[var(--card-border)] relative">
                {/* Líneas de la cancha */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          w-20 h-20 border-2 border-white rounded-full"></div>
                </div>

                {/* Formación */}
                <div className="relative p-6 space-y-8 min-h-[500px] flex flex-col justify-between">
                    {delanteros.length > 0 && (
                        <div className="flex justify-center gap-6">
                            {delanteros.map(j => <JugadorBall key={j.id} jugador={j} />)}
                        </div>
                    )}

                    {mediocampistas.length > 0 && (
                        <div className="flex justify-center gap-6">
                            {mediocampistas.map(j => <JugadorBall key={j.id} jugador={j} />)}
                        </div>
                    )}

                    {defensores.length > 0 && (
                        <div className="flex justify-center gap-6">
                            {defensores.map(j => <JugadorBall key={j.id} jugador={j} />)}
                        </div>
                    )}

                    {arqueros.length > 0 && (
                        <div className="flex justify-center">
                            {arqueros.map(j => <JugadorBall key={j.id} jugador={j} />)}
                        </div>
                    )}
                </div>

                {/* Header del equipo */}
                <div className="absolute top-3 left-3 bg-black/80 px-3 py-1.5 rounded-lg">
                    <span className="text-white font-bold text-xs">{nombreEquipo}</span>
                </div>

                {/* Indicador cuando no se puede votar */}
                {!partidoFinalizado && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                        <div className="bg-[var(--card-bg)] px-4 py-2 rounded-lg border border-[var(--card-border)]">
                            <p className="text-sm text-[var(--text-muted)]">
                                Votación disponible al finalizar
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de votación - Escala 1-10 */}
            <AnimatePresence>
                {jugadorSeleccionado && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={() => setJugadorSeleccionado(null)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-[var(--card-bg)] rounded-t-2xl sm:rounded-2xl border border-[var(--card-border)]
                                        p-6 w-full sm:max-w-md shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drag handle for mobile */}
                            <div className="sm:hidden flex justify-center mb-4">
                                <div className="w-10 h-1 bg-[var(--card-border)] rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center
                                  mx-auto mb-3 text-2xl font-bold border-2 transition-all
                                  ${votos[jugadorSeleccionado.id] > 0
                                        ? 'bg-[#ff6b6b] border-[#ff6b6b] text-white'
                                        : 'bg-[var(--input-bg)] border-[var(--card-border)] text-[var(--foreground)]'}`}>
                                    {jugadorSeleccionado.numero}
                                </div>
                                <h3 className="text-lg font-bold">{jugadorSeleccionado.nombre}</h3>
                                <p className="text-xs text-[var(--text-muted)] uppercase mt-1">{jugadorSeleccionado.posicion}</p>
                            </div>

                            {/* Votación 1-10 */}
                            <div className="space-y-4">
                                <p className="text-center text-sm text-[var(--text-muted)]">
                                    ¿Cómo jugó?
                                </p>

                                {/* Fila 1-5 */}
                                <div className="flex justify-center gap-2 sm:gap-3">
                                    {[1, 2, 3, 4, 5].map(nota => (
                                        <motion.button
                                            key={nota}
                                            onClick={() => handleVotar(nota)}
                                            whileTap={{ scale: 0.9 }}
                                            whileHover={{ scale: 1.05 }}
                                            className={`w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-2xl font-black text-xl transition-all duration-200
                                               ${votos[jugadorSeleccionado.id] === nota
                                                    ? `${getNotaColor(nota)} text-white scale-110 shadow-xl border-white/20`
                                                    : `bg-[var(--background)] text-[var(--text-muted)] border-2 border-[var(--card-border)] hover:border-[#10b981]/30`
                                                }`}
                                        >
                                            {nota}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Fila 6-10 */}
                                <div className="flex justify-center gap-2 sm:gap-3">
                                    {[6, 7, 8, 9, 10].map(nota => (
                                        <motion.button
                                            key={nota}
                                            onClick={() => handleVotar(nota)}
                                            whileTap={{ scale: 0.9 }}
                                            whileHover={{ scale: 1.05 }}
                                            className={`w-[60px] h-[60px] sm:w-[64px] sm:h-[64px] rounded-2xl font-black text-xl transition-all duration-200
                                               ${votos[jugadorSeleccionado.id] === nota
                                                    ? `${getNotaColor(nota)} text-white scale-110 shadow-xl border-white/20`
                                                    : `bg-[var(--background)] text-[var(--text-muted)] border-2 border-[var(--card-border)] hover:border-[#10b981]/30`
                                                }`}
                                        >
                                            {nota}
                                        </motion.button>
                                    ))}
                                </div>

                                {/* Leyenda de colores */}
                                <div className="flex justify-center items-center gap-4 text-[10px] text-[var(--text-muted)] mt-2">
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Malo
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#fbbf24]"></div> Regular
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-[#10b981]"></div> Excelente
                                    </span>
                                </div>
                            </div>

                            {/* Botón cerrar */}
                            <button
                                onClick={() => setJugadorSeleccionado(null)}
                                className="w-full mt-6 py-3 bg-[var(--background)] hover:bg-[var(--hover-bg)] rounded-xl
                             text-sm text-[var(--text-muted)] transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
})

CanchaFormacion.displayName = 'CanchaFormacion'
