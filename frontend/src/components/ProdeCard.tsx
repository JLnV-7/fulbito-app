// src/components/ProdeCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import type { Partido, Pronostico } from '@/types'

interface ProdeCardProps {
    partido: Partido
    pronosticoExistente?: Pronostico | null
    onGuardar: (golesLocal: number, golesVisitante: number) => Promise<void>
}

export function ProdeCard({ partido, pronosticoExistente, onGuardar }: ProdeCardProps) {
    const [golesLocal, setGolesLocal] = useState(pronosticoExistente?.goles_local_pronostico ?? 0)
    const [golesVisitante, setGolesVisitante] = useState(pronosticoExistente?.goles_visitante_pronostico ?? 0)
    const [guardando, setGuardando] = useState(false)
    const [guardado, setGuardado] = useState(!!pronosticoExistente)

    const isPartidoBloqueado = partido.estado !== 'PREVIA' || pronosticoExistente?.bloqueado

    const handleGuardar = async () => {
        setGuardando(true)

        try {
            await onGuardar(golesLocal, golesVisitante)

            // Confetti success
            confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#ffd700', '#ffffff']
            })

            setGuardado(true)
        } catch (error) {
            console.error('Error guardando pronóstico:', error)
        } finally {
            setGuardando(false)
        }
    }

    const formatearHora = (fecha: string) => {
        try {
            const date = new Date(fecha)
            return date.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch {
            return '--:--'
        }
    }

    const formatearFecha = (fecha: string) => {
        try {
            const date = new Date(fecha)
            const hoy = new Date()
            const esHoy = date.toDateString() === hoy.toDateString()

            if (esHoy) return 'Hoy'

            return date.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short'
            })
        } catch {
            return ''
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden
                 hover:border-[#10b981]/50 transition-all"
        >
            {/* Header */}
            <div className="px-4 py-2 bg-[var(--background)] flex items-center justify-between border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-[#10b981] uppercase">
                        {partido.liga}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    <span>{formatearFecha(partido.fecha_inicio)}</span>
                    <span className="font-semibold">{formatearHora(partido.fecha_inicio)}</span>
                </div>
            </div>

            {/* Equipos y pronóstico */}
            <div className="p-5">
                {/* Equipo Local */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                        {partido.logo_local && (
                            <div className="relative w-8 h-8">
                                <Image
                                    src={partido.logo_local}
                                    alt={partido.equipo_local}
                                    fill
                                    className="object-contain"
                                    sizes="32px"
                                />
                            </div>
                        )}
                        <span className="text-sm font-medium">{partido.equipo_local}</span>
                    </div>

                    {/* Input goles local */}
                    <motion.input
                        type="number"
                        min="0"
                        max="20"
                        value={golesLocal}
                        onChange={(e) => !isPartidoBloqueado && setGolesLocal(Number(e.target.value))}
                        disabled={isPartidoBloqueado}
                        whileFocus={{ scale: 1.05 }}
                        className={`w-16 h-12 text-center text-xl font-bold rounded-lg
                       border-2 transition-all
                       ${isPartidoBloqueado
                                ? 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] cursor-not-allowed'
                                : 'bg-[var(--input-bg)] border-[#10b981]/30 hover:border-[#10b981]/60 focus:border-[#10b981] focus:outline-none'
                            }`}
                    />
                </div>

                {/* VS Divider */}
                <div className="flex items-center justify-center my-2">
                    <div className="h-px bg-[var(--card-border)] flex-1"></div>
                    <span className="px-3 text-xs text-[var(--text-muted)] font-semibold">VS</span>
                    <div className="h-px bg-[var(--card-border)] flex-1"></div>
                </div>

                {/* Equipo Visitante */}
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 flex-1">
                        {partido.logo_visitante && (
                            <div className="relative w-8 h-8">
                                <Image
                                    src={partido.logo_visitante}
                                    alt={partido.equipo_visitante}
                                    fill
                                    className="object-contain"
                                    sizes="32px"
                                />
                            </div>
                        )}
                        <span className="text-sm font-medium">{partido.equipo_visitante}</span>
                    </div>

                    {/* Input goles visitante */}
                    <motion.input
                        type="number"
                        min="0"
                        max="20"
                        value={golesVisitante}
                        onChange={(e) => !isPartidoBloqueado && setGolesVisitante(Number(e.target.value))}
                        disabled={isPartidoBloqueado}
                        whileFocus={{ scale: 1.05 }}
                        className={`w-16 h-12 text-center text-xl font-bold rounded-lg
                       border-2 transition-all
                       ${isPartidoBloqueado
                                ? 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] cursor-not-allowed'
                                : 'bg-[var(--input-bg)] border-[#10b981]/30 hover:border-[#10b981]/60 focus:border-[#10b981] focus:outline-none'
                            }`}
                    />
                </div>
            </div>

            {/* Footer con botón */}
            <div className="px-5 py-3 bg-[var(--background)]/50 border-t border-[var(--card-border)]">
                {isPartidoBloqueado ? (
                    <div className="text-center">
                        <span className="text-xs text-[var(--text-muted)]">
                            {pronosticoExistente?.bloqueado ? '🔒 Pronóstico bloqueado' : '⚽ Partido en curso'}
                        </span>
                    </div>
                ) : (
                    <motion.button
                        onClick={handleGuardar}
                        disabled={guardando}
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.02 }}
                        className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all
                       ${guardado
                                ? 'bg-[#10b981] text-white hover:bg-[#059669]'
                                : 'bg-[#10b981]/10 text-[#10b981] border-2 border-[#10b981] hover:bg-[#10b981] hover:text-white'
                            }`}
                    >
                        {guardando ? 'Guardando...' : guardado ? '✓ Pronóstico guardado' : 'Guardar pronóstico'}
                    </motion.button>
                )}

                {/* Puntos posibles */}
                {!isPartidoBloqueado && (
                    <div className="mt-2 text-center text-[10px] text-[var(--text-muted)]">
                        <span>Exacto: 8 pts</span>
                        <span className="mx-2">•</span>
                        <span>Ganador + Dif: 5 pts</span>
                        <span className="mx-2">•</span>
                        <span>Ganador: 3 pts</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
