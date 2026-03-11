// src/components/CanchaFormacion.tsx
'use client'

import { memo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

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
    if (nota >= 8) return 'bg-[#16a34a]'
    if (nota >= 6) return 'bg-[#22c55e]'
    if (nota >= 5) return 'bg-[#d97706]'
    if (nota >= 4) return 'bg-[#ea580c]'
    return 'bg-[#dc2626]'
}

function getNotaBgHover(nota: number): string {
    if (nota >= 8) return 'hover:bg-[#16a34a]'
    if (nota >= 6) return 'hover:bg-[#22c55e]'
    if (nota >= 5) return 'hover:bg-[#d97706]'
    if (nota >= 4) return 'hover:bg-[#ea580c]'
    return 'hover:bg-[#dc2626]'
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
        const nota = votos[jugador.id]

        return (
            <button
                onClick={() => handleJugadorClick(jugador)}
                disabled={!partidoFinalizado}
                className={`relative flex flex-col items-center group transition-all duration-300
                   ${partidoFinalizado ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
            >
                {/* Círculo del jugador */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center
                        border-2 transition-all duration-300 relative overflow-hidden
                        ${tieneVoto
                        ? 'bg-[var(--foreground)] border-white text-white shadow-md'
                        : 'bg-[var(--card-bg)] border-[var(--card-border)] group-hover:border-[var(--accent)]'
                    }
                    ${isAnimating ? 'scale-110' : ''}`}>

                    <span className={`font-black text-lg sm:text-xl relative z-10 transition-colors
                        ${tieneVoto ? 'text-white' : 'text-[var(--foreground)]'}`}>
                        {jugador.numero}
                    </span>
                </div>

                {/* Nombre - Simple Tag */}
                <div className="mt-1 bg-[var(--background)] px-2 py-0.5 border border-[var(--card-border)] text-[9px] sm:text-[10px] font-bold text-[var(--foreground)]
                        whitespace-nowrap max-w-[80px] truncate capitalize tracking-tighter shadow-sm">
                    {jugador.nombre.split(' ').pop()}
                </div>

                {/* Badge de voto - Square/Boxy */}
                {tieneVoto && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -top-1 -right-1 w-6 h-6 
                          flex items-center justify-center text-[10px] font-black text-white
                          border border-white shadow-sm z-20 transition-all duration-300 ${getNotaColor(nota)}
                          ${isAnimating ? 'scale-125' : ''}`}
                        style={{ borderRadius: '2px' }}>
                        {nota}
                    </motion.div>
                )}
            </button>
        )
    }

    return (
        <div className="relative">
            {/* Cancha */}
            <div className="bg-[#3a4d33] border-2 border-[#2a3a23] relative overflow-hidden"
                style={{ borderRadius: 'var(--radius)' }}>
                {/* Líneas de la cancha simples */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          w-24 h-24 border-2 border-white rounded-full"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 border-b-2 border-x-2 border-white"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-40 h-20 border-t-2 border-x-2 border-white"></div>
                </div>

                {/* Formación */}
                <div className="relative p-6 space-y-10 min-h-[550px] flex flex-col justify-between">
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
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 text-[9px] font-bold text-white capitalize tracking-widest">
                    {nombreEquipo}
                </div>

                {/* Indicador cuando no se puede votar */}
                {!partidoFinalizado && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-[var(--card-bg)] px-4 py-2 border-2 border-[var(--card-border)]">
                            <p className="text-[10px] font-black capitalize text-[var(--accent)] tracking-widest">
                                Votación bloqueada
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {jugadorSeleccionado && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                        onClick={() => setJugadorSeleccionado(null)}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-[var(--background)] border-2 border-[var(--foreground)]
                                        p-6 w-full sm:max-w-md shadow-2xl"
                            style={{ borderRadius: 'var(--radius)' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center
                                  mx-auto mb-3 text-xl font-bold border-2 transition-all
                                  ${votos[jugadorSeleccionado.id] > 0
                                        ? 'bg-[var(--foreground)] border-[var(--foreground)] text-white'
                                        : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--foreground)]'}`}>
                                    {jugadorSeleccionado.numero}
                                </div>
                                <h3 className="text-base font-black capitalize tracking-tight">{jugadorSeleccionado.nombre}</h3>
                                <p className="text-[10px] text-[var(--text-muted)] font-bold capitalize tracking-widest mt-1 mb-2">{jugadorSeleccionado.posicion}</p>
                                <Link
                                    href={`/jugador/${jugadorSeleccionado.id}`}
                                    className="text-[10px] text-[var(--accent)] font-black hover:underline tracking-widest"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    VER PERFIL →
                                </Link>
                            </div>

                            {/* Votación 1-10 */}
                            <div className="space-y-5">
                                <p className="text-center text-[10px] font-bold capitalize tracking-widest text-[var(--text-muted)]">
                                    Calificar Actuación
                                </p>

                                {/* Fila 1-5 */}
                                <div className="flex justify-center gap-1.5 sm:gap-2">
                                    {[1, 2, 3, 4, 5].map(nota => (
                                        <button
                                            key={nota}
                                            onClick={() => handleVotar(nota)}
                                            className={`w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] font-black text-lg transition-all
                                               ${votos[jugadorSeleccionado.id] === nota
                                                    ? `${getNotaColor(nota)} text-white border-2 border-white`
                                                    : `bg-[var(--card-bg)] text-[var(--text-muted)] border-2 border-[var(--card-border)] hover:border-[var(--foreground)]`
                                                }`}
                                            style={{ borderRadius: '4px' }}
                                        >
                                            {nota}
                                        </button>
                                    ))}
                                </div>

                                {/* Fila 6-10 */}
                                <div className="flex justify-center gap-1.5 sm:gap-2">
                                    {[6, 7, 8, 9, 10].map(nota => (
                                        <button
                                            key={nota}
                                            onClick={() => handleVotar(nota)}
                                            className={`w-[54px] h-[54px] sm:w-[60px] sm:h-[60px] font-black text-lg transition-all
                                               ${votos[jugadorSeleccionado.id] === nota
                                                    ? `${getNotaColor(nota)} text-white border-2 border-white`
                                                    : `bg-[var(--card-bg)] text-[var(--text-muted)] border-2 border-[var(--card-border)] hover:border-[var(--foreground)]`
                                                }`}
                                            style={{ borderRadius: '4px' }}
                                        >
                                            {nota}
                                        </button>
                                    ))}
                                </div>

                                {/* Leyenda de colores Simple */}
                                <div className="flex justify-center items-center gap-4 text-[9px] text-[var(--text-muted)] font-black capitalize tracking-tight mt-2">
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-[#dc2626]"></div> Mal
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-[#d97706]"></div> Regular
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-[#16a34a]"></div> Bien
                                    </span>
                                </div>
                            </div>

                            {/* Botón cerrar */}
                            <button
                                onClick={() => setJugadorSeleccionado(null)}
                                className="w-full mt-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--hover-bg)]
                             text-[10px] text-[var(--text-muted)] font-black capitalize tracking-widest transition-colors"
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                CERRAR
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
})

CanchaFormacion.displayName = 'CanchaFormacion'
