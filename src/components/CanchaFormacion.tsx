// src/components/CanchaFormacion.tsx
'use client'

import { memo, useState } from 'react'

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

// Función para obtener el color según la nota (estilo SofaScore)
function getNotaColor(nota: number): string {
    if (nota >= 8) return 'bg-[#10b981]' // Verde - excelente
    if (nota >= 6) return 'bg-[#22c55e]' // Verde claro - bueno
    if (nota >= 5) return 'bg-[#fbbf24]' // Amarillo - regular
    if (nota >= 4) return 'bg-[#f97316]' // Naranja - malo
    return 'bg-[#ef4444]' // Rojo - muy malo
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
            // Activar animación
            setAnimatingVote(jugadorSeleccionado.id)

            onVotar(jugadorSeleccionado.id, nota)
            setJugadorSeleccionado(null)

            // Desactivar animación después de 600ms
            setTimeout(() => setAnimatingVote(null), 600)
        }
    }

    const JugadorBall = ({ jugador }: { jugador: JugadorAPI }) => {
        const tieneVoto = votos[jugador.id] > 0
        const isAnimating = animatingVote === jugador.id

        return (
            <button
                onClick={() => handleJugadorClick(jugador)}
                disabled={!partidoFinalizado}
                className={`relative flex flex-col items-center group transition-all duration-200
                   ${partidoFinalizado ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            >
                {/* Círculo del jugador */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center
                        border-2 transition-all duration-300
                        ${tieneVoto
                        ? 'bg-[#ff6b6b] border-[#ff6b6b] shadow-lg shadow-[#ff6b6b]/50'
                        : 'bg-[#1e1e1e] border-[#4a4a4a] group-hover:border-[#ff6b6b]/50'
                    }
                    ${isAnimating ? 'scale-125 shadow-xl shadow-[#ff6b6b]/70' : ''}`}>
                    <span className="text-white font-bold text-sm">{jugador.numero}</span>
                </div>

                {/* Nombre */}
                <div className="mt-1 bg-black/80 px-2 py-0.5 rounded text-[10px] font-semibold
                        whitespace-nowrap max-w-[80px] truncate">
                    {jugador.nombre.split(' ').pop()}
                </div>

                {/* Badge de voto con animación */}
                {tieneVoto && (
                    <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full
                          flex items-center justify-center text-[10px] font-bold text-white
                          transition-all duration-300 ${getNotaColor(votos[jugador.id])}
                          ${isAnimating ? 'scale-150 animate-pulse' : ''}`}>
                        {votos[jugador.id]}
                    </div>
                )}
            </button>
        )
    }

    return (
        <div className="relative">
            {/* Cancha */}
            <div className="bg-gradient-to-b from-[#2d5016] to-[#1e3a0f] rounded-2xl overflow-hidden
                      border-2 border-[#4a4a4a] relative">
                {/* Líneas de la cancha */}
                <div className="absolute inset-0 opacity-20">
                    {/* Línea del mediocampo */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white"></div>
                    {/* Círculo central */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          w-20 h-20 border-2 border-white rounded-full"></div>
                </div>

                {/* Formación */}
                <div className="relative p-6 space-y-8 min-h-[500px] flex flex-col justify-between">
                    {/* Delanteros */}
                    {delanteros.length > 0 && (
                        <div className="flex justify-center gap-6">
                            {delanteros.map(j => <JugadorBall key={j.id} jugador={j} />)}
                        </div>
                    )}

                    {/* Mediocampistas */}
                    {mediocampistas.length > 0 && (
                        <div className="flex justify-center gap-6">
                            {mediocampistas.map(j => <JugadorBall key={j.id} jugador={j} />)}
                        </div>
                    )}

                    {/* Defensores */}
                    {defensores.length > 0 && (
                        <div className="flex justify-center gap-6">
                            {defensores.map(j => <JugadorBall key={j.id} jugador={j} />)}
                        </div>
                    )}

                    {/* Arquero */}
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

                {/* Indicador de estado */}
                {!partidoFinalizado && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="bg-[#1e1e1e] px-4 py-2 rounded-lg border border-[#4a4a4a]">
                            <p className="text-sm text-[#909090]">
                                Votación disponible al finalizar
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de votación - Escala 1-10 */}
            {jugadorSeleccionado && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setJugadorSeleccionado(null)}>
                    <div className="bg-[#1a1a1a] rounded-2xl border border-[#333333] p-6 max-w-md w-full
                                    animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center
                              mx-auto mb-3 text-2xl font-bold border-2 transition-all
                              ${votos[jugadorSeleccionado.id] > 0
                                    ? 'bg-[#ff6b6b] border-[#ff6b6b] text-white'
                                    : 'bg-[#2a2a2a] border-[#4a4a4a] text-[#f5f5f5]'}`}>
                                {jugadorSeleccionado.numero}
                            </div>
                            <h3 className="text-lg font-bold text-[#f5f5f5]">{jugadorSeleccionado.nombre}</h3>
                            <p className="text-xs text-[#909090] uppercase mt-1">{jugadorSeleccionado.posicion}</p>
                        </div>

                        {/* Votación 1-10 */}
                        <div className="space-y-4">
                            <p className="text-center text-sm text-[#909090]">
                                ¿Cómo jugó?
                            </p>

                            {/* Fila 1-5 */}
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(nota => (
                                    <button
                                        key={nota}
                                        onClick={() => handleVotar(nota)}
                                        className={`w-11 h-11 rounded-xl font-bold text-base transition-all duration-200
                                           hover:scale-110 active:scale-95
                                           ${votos[jugadorSeleccionado.id] === nota
                                                ? `${getNotaColor(nota)} text-white scale-110 shadow-lg`
                                                : `bg-[#2a2a2a] text-[#909090] ${getNotaBgHover(nota)} hover:text-white`
                                            }`}
                                    >
                                        {nota}
                                    </button>
                                ))}
                            </div>

                            {/* Fila 6-10 */}
                            <div className="flex justify-center gap-2">
                                {[6, 7, 8, 9, 10].map(nota => (
                                    <button
                                        key={nota}
                                        onClick={() => handleVotar(nota)}
                                        className={`w-11 h-11 rounded-xl font-bold text-base transition-all duration-200
                                           hover:scale-110 active:scale-95
                                           ${votos[jugadorSeleccionado.id] === nota
                                                ? `${getNotaColor(nota)} text-white scale-110 shadow-lg`
                                                : `bg-[#2a2a2a] text-[#909090] ${getNotaBgHover(nota)} hover:text-white`
                                            }`}
                                    >
                                        {nota}
                                    </button>
                                ))}
                            </div>

                            {/* Leyenda de colores */}
                            <div className="flex justify-center items-center gap-4 text-[10px] text-[#606060] mt-2">
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
                            className="w-full mt-6 py-2.5 bg-[#2a2a2a] hover:bg-[#333333] rounded-xl
                         text-sm text-[#909090] transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
})

CanchaFormacion.displayName = 'CanchaFormacion'
