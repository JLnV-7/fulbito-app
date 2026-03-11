// src/components/ProdeCard.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
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
                className={`w-9 h-9 flex items-center justify-center text-lg font-black transition-all border
                    ${disabled
                        ? 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] cursor-not-allowed opacity-40'
                        : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:bg-red-600/10 hover:text-red-600 hover:border-red-600 active:bg-red-600/20'
                    }`}
                style={{ borderRadius: 'var(--radius)' }}
            >
                −
            </motion.button>

            <div className={`w-12 h-12 flex items-center justify-center text-xl font-black tabular-nums transition-all border
                ${disabled
                    ? 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'
                    : 'bg-[var(--background)] border-[var(--foreground)] text-[var(--foreground)]'
                }`}
                style={{ borderRadius: 'var(--radius)' }}
            >
                {value}
            </div>

            <motion.button
                type="button"
                whileTap={{ scale: 0.85 }}
                disabled={disabled || value >= 20}
                onClick={() => onChange(Math.min(20, value + 1))}
                aria-label={`Sumar gol ${teamName}`}
                className={`w-9 h-9 flex items-center justify-center text-lg font-black transition-all border
                    ${disabled
                        ? 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] cursor-not-allowed opacity-40'
                        : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:bg-[#16a34a]/10 hover:text-[#16a34a] hover:border-[#16a34a] active:bg-[#16a34a]/20'
                    }`}
                style={{ borderRadius: 'var(--radius)' }}
            >
                +
            </motion.button>
        </div>
    )
}

export function ProdeCard({ partido, pronosticoExistente, onGuardar }: ProdeCardProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [golesLocal, setGolesLocal] = useState(pronosticoExistente?.goles_local_pronostico ?? 0)
    const [golesVisitante, setGolesVisitante] = useState(pronosticoExistente?.goles_visitante_pronostico ?? 0)
    const [guardando, setGuardando] = useState(false)
    const [guardado, setGuardado] = useState(!!pronosticoExistente)
    const [hasLineup, setHasLineup] = useState(false)

    useEffect(() => {
        const checkLineup = async () => {
            if (!user) return
            const { data } = await supabase
                .from('user_lineups')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()
            if (data) setHasLineup(true)
        }
        checkLineup()
    }, [user])

    const isPartidoBloqueado = partido.estado !== 'PREVIA' || pronosticoExistente?.bloqueado

    const handleGuardar = async () => {
        setGuardando(true)

        try {
            await onGuardar(golesLocal, golesVisitante)
            setGuardado(true)
            showToast('¡Pronóstico guardado!', 'success')

            // Subtle feedback
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                navigator.vibrate(50)
            }
        } catch (error) {
            console.error('Error guardando pronóstico:', error)
            showToast('Error al guardar pronóstico', 'error')
        } finally {
            setGuardando(false)
        }
    }

    const handleUsarXI = () => {
        // Some rudimentary fun logic to simulate a score
        const posiblesResultados = [
            [2, 1], [1, 2], [1, 1], [0, 0], [3, 1], [1, 0], [0, 1]
        ]
        const idx = Math.floor(Math.random() * posiblesResultados.length)
        setGolesLocal(posiblesResultados[idx][0])
        setGolesVisitante(posiblesResultados[idx][1])
        setGuardado(false)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden
                 hover:border-[var(--foreground)] transition-all"
            style={{ borderRadius: 'var(--radius)' }}
        >
            {/* Header */}
            <div className="px-5 py-3 bg-[var(--background)] flex items-center justify-between border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--accent-green)] capitalize tracking-tight">
                        {partido.liga}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-medium capitalize tracking-tight">
                    <span>{formatearFecha(partido.fecha_inicio)}</span>
                    <span className="font-bold">{formatearHora(partido.fecha_inicio)}</span>
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

            {/* Use My XI Button */}
            {!isPartidoBloqueado && hasLineup && !guardado && (
                <div className="px-5 pb-2">
                    <button
                        onClick={handleUsarXI}
                        className="w-full py-2 text-[10px] font-black capitalize tracking-widest bg-[var(--background)] border border-blue-600/30 text-blue-600 hover:bg-blue-600/10 transition-all flex items-center justify-center gap-2"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <span>⚡</span> Usar mi XI Ideal
                    </button>
                </div>
            )}

            {/* Footer con botón */}
            <div className="px-5 py-4 bg-[var(--background)]/50 border-t border-[var(--card-border)]">
                {isPartidoBloqueado ? (
                    <div className="text-center">
                        <span className="text-xs text-[var(--text-muted)] font-medium">
                            {pronosticoExistente?.bloqueado ? '🔒 Pronóstico bloqueado' : '⚽ Partido en curso'}
                        </span>
                    </div>
                ) : (
                    <motion.button
                        onClick={handleGuardar}
                        disabled={guardando}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-3 font-bold capitalize tracking-tight text-xs transition-all border-2
                       ${guardado
                                ? 'bg-[var(--accent-green)] text-white border-[var(--accent-green)] hover:opacity-90'
                                : 'bg-transparent text-[var(--accent-green)] border-[var(--accent-green)] hover:bg-[var(--accent-green)] hover:text-white'
                            }`}
                        style={{ borderRadius: 'var(--radius-md)' }}
                    >
                        {guardando ? 'Guardando...' : guardado ? '✓ Guardado' : 'Guardar Pronóstico'}
                    </motion.button>
                )}

                {/* Puntos posibles */}
                {!isPartidoBloqueado && (
                    <div className="mt-3 text-center text-[10px] text-[var(--text-muted)] font-medium">
                        <span>Exacto: 8 pts</span>
                        <span className="mx-2 opacity-30">•</span>
                        <span>Ganador + Dif: 5 pts</span>
                        <span className="mx-2 opacity-30">•</span>
                        <span>Ganador: 3 pts</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
