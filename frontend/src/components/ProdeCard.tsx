// src/components/ProdeCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import confetti from 'canvas-confetti'
import type { Partido, Pronostico } from '@/types'
import { formatearHora, formatearFecha } from '@/lib/utils'

interface ProdeCardProps {
    partido: Partido
    pronosticoExistente?: Pronostico | null
    onGuardar: (golesLocal: number, golesVisitante: number) => Promise<void>
}

function GoalStepper({
    value,
    onChange,
    disabled,
    teamName,
}: {
    value: number
    onChange: (v: number) => void
    disabled: boolean
    teamName: string
}) {
    return (
        <div className="flex items-center gap-1">
            <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                disabled={disabled || value <= 0}
                onClick={() => onChange(Math.max(0, value - 1))}
                aria-label={`Restar gol ${teamName}`}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold transition-all
                    ${disabled
                        ? 'bg-[var(--card-bg)] text-[var(--text-muted)] cursor-not-allowed opacity-40'
                        : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[#ff6b6b]/20 hover:text-[#ff6b6b] active:bg-[#ff6b6b]/30'
                    }`}
            >
                −
            </motion.button>

            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold tabular-nums transition-all
                border-2
                ${disabled
                    ? 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'
                    : 'bg-[var(--input-bg)] border-[#10b981]/30 text-[var(--foreground)]'
                }`}
            >
                {value}
            </div>

            <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                disabled={disabled || value >= 20}
                onClick={() => onChange(Math.min(20, value + 1))}
                aria-label={`Sumar gol ${teamName}`}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold transition-all
                    ${disabled
                        ? 'bg-[var(--card-bg)] text-[var(--text-muted)] cursor-not-allowed opacity-40'
                        : 'bg-[var(--background)] text-[var(--foreground)] hover:bg-[#10b981]/20 hover:text-[#10b981] active:bg-[#10b981]/30'
                    }`}
            >
                +
            </motion.button>
        </div>
    )
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {partido.logo_local && (
                            <div className="relative w-8 h-8 shrink-0">
                                <Image
                                    src={partido.logo_local}
                                    alt={partido.equipo_local}
                                    fill
                                    className="object-contain"
                                    sizes="32px"
                                />
                            </div>
                        )}
                        <span className="text-sm font-medium truncate">{partido.equipo_local}</span>
                    </div>

                    <GoalStepper
                        value={golesLocal}
                        onChange={(v) => !isPartidoBloqueado && setGolesLocal(v)}
                        disabled={!!isPartidoBloqueado}
                        teamName={partido.equipo_local}
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
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {partido.logo_visitante && (
                            <div className="relative w-8 h-8 shrink-0">
                                <Image
                                    src={partido.logo_visitante}
                                    alt={partido.equipo_visitante}
                                    fill
                                    className="object-contain"
                                    sizes="32px"
                                />
                            </div>
                        )}
                        <span className="text-sm font-medium truncate">{partido.equipo_visitante}</span>
                    </div>

                    <GoalStepper
                        value={golesVisitante}
                        onChange={(v) => !isPartidoBloqueado && setGolesVisitante(v)}
                        disabled={!!isPartidoBloqueado}
                        teamName={partido.equipo_visitante}
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
