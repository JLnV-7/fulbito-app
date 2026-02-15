// src/components/grupos/CanchaSeleccion.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FORMACIONES, Formacion } from '@/lib/formaciones'
import type { JugadorPartidoAmigo } from '@/types'

interface CanchaSeleccionProps {
    tipoPartido: string
    equipo: 'azul' | 'rojo'
    jugadores: JugadorPartidoAmigo[]
    onSelectPosicion: (orden: number) => void // Al hacer click en un slot vacío o lleno
    onEliminarJugador: (jugador: JugadorPartidoAmigo) => void // Al hacer click en "borrar"
    formacionActual: Formacion
    setFormacionActual: (f: Formacion) => void
}

export function CanchaSeleccion({
    tipoPartido,
    equipo,
    jugadores,
    onSelectPosicion,
    onEliminarJugador,
    formacionActual,
    setFormacionActual
}: CanchaSeleccionProps) {
    const formacionesDisponibles = FORMACIONES[tipoPartido] || []

    // Si no hay formacion, usar la primera por defecto (esto debería manejarse arriba, pero por seguridad)
    const formacion = formacionActual || formacionesDisponibles[0]

    return (
        <div className="flex flex-col gap-4">
            {/* Header: Selector de Formación */}
            <div className="flex justify-between items-center bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--card-border)]">
                <span className="text-sm font-bold text-[var(--text-muted)] uppercase">Formación</span>
                <div className="flex gap-2">
                    {formacionesDisponibles.map(f => (
                        <button
                            key={f.nombre}
                            onClick={() => setFormacionActual(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                                ${formacion.nombre === f.nombre
                                    ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                                    : 'border-[var(--card-border)] hover:bg-[var(--hover-bg)]'}`}
                        >
                            {f.nombre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cancha */}
            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto bg-gradient-to-b from-[#2d5016] to-[#1e3a0f] rounded-2xl border-4 border-[#333] shadow-inner overflow-hidden">
                {/* Patrón de pasto */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #000 20px, #000 40px)' }}>
                </div>

                {/* Líneas */}
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                    <div className="absolute top-1/2 w-full h-0.5 bg-white/50"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/50 rounded-full"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-16 border-b-2 border-x-2 border-white/50 rounded-b-lg"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-16 border-t-2 border-x-2 border-white/50 rounded-t-lg"></div>
                </div>

                {/* Posiciones */}
                <div className="absolute inset-0 p-4">
                    {formacion?.posiciones.map((pos, index) => {
                        // Buscar si hay jugador en este 'orden' (index)
                        // IMPORTANTE: El backend usa indices 0-based o 1-based?
                        // Asumiremos que 'orden' en JugadorPartidoAmigo coincide con este index.
                        const jugador = jugadores.find(j => j.orden === index)

                        return (
                            <div
                                key={index}
                                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                                style={{
                                    left: `${pos.x}%`,
                                    top: `${pos.y}%`,
                                    zIndex: 10
                                }}
                            >
                                <button
                                    onClick={() => onSelectPosicion(index)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-transform hover:scale-110 active:scale-95
                                        ${jugador
                                            ? (equipo === 'azul' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-red-600 border-red-400 text-white')
                                            : 'bg-black/40 border-white/30 text-white/50 hover:bg-black/60 hover:border-white/50'
                                        }`}
                                >
                                    {jugador ? (
                                        <span className="text-xs font-black">{index === 0 ? 'ARQ' : index}</span>
                                    ) : (
                                        <span className="text-lg font-light">+</span>
                                    )}
                                </button>

                                <div className="bg-black/70 px-2 py-0.5 rounded text-[10px] font-bold text-white max-w-[80px] truncate backdrop-blur-sm">
                                    {jugador ? jugador.nombre : pos.label || 'Vacío'}
                                </div>

                                {jugador && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEliminarJugador(jugador) }}
                                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white flex items-center justify-center text-[10px] shadow-sm hover:scale-110"
                                    >✕</button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Lista resumen (opcional, para ver a todos si la cancha confunde) */}
            <div className="text-xs text-center text-[var(--text-muted)]">
                {jugadores.length} / {formacion.posiciones.length} jugadores
            </div>
        </div>
    )
}
