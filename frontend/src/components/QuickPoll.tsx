// src/components/QuickPoll.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

type Prediccion = 'local' | 'empate' | 'visitante'

interface QuickPollProps {
    fixtureId: number | string
    equipoLocal: string
    equipoVisitante: string
    compact?: boolean
}

interface PollResults {
    local: number
    empate: number
    visitante: number
    total: number
}

export function QuickPoll({ fixtureId, equipoLocal, equipoVisitante, compact = false }: QuickPollProps) {
    const { user } = useAuth()
    const [miVoto, setMiVoto] = useState<Prediccion | null>(null)
    const [results, setResults] = useState<PollResults>({ local: 0, empate: 0, visitante: 0, total: 0 })
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)

    const fId = typeof fixtureId === 'string' ? parseInt(fixtureId) : fixtureId

    // Load existing vote & results
    useEffect(() => {
        const loadPoll = async () => {
            // Fetch results (aggregated)
            const { data: allVotes } = await supabase
                .from('quick_polls')
                .select('prediccion')
                .eq('fixture_id', fId)

            if (allVotes) {
                const counts = { local: 0, empate: 0, visitante: 0 }
                allVotes.forEach(v => {
                    counts[v.prediccion as Prediccion]++
                })
                setResults({
                    ...counts,
                    total: allVotes.length
                })
            }

            // Fetch my vote
            if (user) {
                const { data: myVote } = await supabase
                    .from('quick_polls')
                    .select('prediccion')
                    .eq('fixture_id', fId)
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (myVote) {
                    setMiVoto(myVote.prediccion as Prediccion)
                    setShowResults(true)
                }
            }
        }

        loadPoll()
    }, [fId, user])

    const handleVote = async (prediccion: Prediccion) => {
        if (!user || loading) return

        setLoading(true)
        setMiVoto(prediccion)
        setShowResults(true)

        try {
            const { error } = await supabase
                .from('quick_polls')
                .upsert({
                    user_id: user.id,
                    fixture_id: fId,
                    prediccion,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,fixture_id' })

            if (error) throw error

            // Update local results optimistically
            setResults(prev => {
                const updated = { ...prev }
                // If changed vote, subtract from old
                if (miVoto && miVoto !== prediccion) {
                    updated[miVoto] = Math.max(0, updated[miVoto] - 1)
                }
                // Add to new
                if (!miVoto) {
                    updated.total++
                }
                updated[prediccion]++
                return updated
            })
        } catch (err) {
            console.error('Error voting:', err)
            setMiVoto(null)
            setShowResults(false)
        } finally {
            setLoading(false)
        }
    }

    const getPercent = (type: Prediccion) => {
        if (results.total === 0) return 0
        return Math.round((results[type] / results.total) * 100)
    }

    const localShort = equipoLocal.split(' ').slice(0, 1).join(' ')
    const visitanteShort = equipoVisitante.split(' ').slice(0, 1).join(' ')

    // Compact mode for inside PartidoCard
    if (compact) {
        return (
            <div className="px-4 py-2.5 border-t border-[var(--card-border)]" onClick={e => e.stopPropagation()}>
                <AnimatePresence mode="wait">
                    {!showResults ? (
                        <motion.div
                            key="buttons"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-1.5"
                        >
                            <span className="text-[10px] text-[var(--text-muted)] mr-1 whitespace-nowrap">¿Quién gana?</span>
                            <button
                                onClick={() => handleVote('local')}
                                disabled={loading || !user}
                                className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-[var(--background)] border border-[var(--card-border)]
                                           hover:border-[#10b981]/50 hover:bg-[#10b981]/5 transition-all truncate"
                            >
                                {localShort}
                            </button>
                            <button
                                onClick={() => handleVote('empate')}
                                disabled={loading || !user}
                                className="py-1.5 px-3 text-[10px] font-bold rounded-lg bg-[var(--background)] border border-[var(--card-border)]
                                           hover:border-[#fbbf24]/50 hover:bg-[#fbbf24]/5 transition-all"
                            >
                                X
                            </button>
                            <button
                                onClick={() => handleVote('visitante')}
                                disabled={loading || !user}
                                className="flex-1 py-1.5 text-[10px] font-bold rounded-lg bg-[var(--background)] border border-[var(--card-border)]
                                           hover:border-[#6366f1]/50 hover:bg-[#6366f1]/5 transition-all truncate"
                            >
                                {visitanteShort}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-1"
                        >
                            <div className="flex items-center gap-1.5">
                                <PollBar
                                    label={localShort}
                                    percent={getPercent('local')}
                                    color="#10b981"
                                    isSelected={miVoto === 'local'}
                                />
                                <PollBar
                                    label="X"
                                    percent={getPercent('empate')}
                                    color="#fbbf24"
                                    isSelected={miVoto === 'empate'}
                                />
                                <PollBar
                                    label={visitanteShort}
                                    percent={getPercent('visitante')}
                                    color="#6366f1"
                                    isSelected={miVoto === 'visitante'}
                                />
                            </div>
                            <div className="text-[9px] text-[var(--text-muted)] text-center">
                                {results.total} {results.total === 1 ? 'voto' : 'votos'}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // Full mode (standalone)
    return (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] p-4">
            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3">
                🗳️ ¿Quién gana?
            </h4>
            <AnimatePresence mode="wait">
                {!showResults ? (
                    <motion.div
                        key="buttons"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2"
                    >
                        <button
                            onClick={() => handleVote('local')}
                            disabled={loading || !user}
                            className="flex-1 py-3 rounded-xl text-sm font-bold bg-[var(--background)] border-2 border-[var(--card-border)]
                                       hover:border-[#10b981] hover:bg-[#10b981]/5 transition-all"
                        >
                            {equipoLocal}
                        </button>
                        <button
                            onClick={() => handleVote('empate')}
                            disabled={loading || !user}
                            className="py-3 px-5 rounded-xl text-sm font-bold bg-[var(--background)] border-2 border-[var(--card-border)]
                                       hover:border-[#fbbf24] hover:bg-[#fbbf24]/5 transition-all"
                        >
                            Empate
                        </button>
                        <button
                            onClick={() => handleVote('visitante')}
                            disabled={loading || !user}
                            className="flex-1 py-3 rounded-xl text-sm font-bold bg-[var(--background)] border-2 border-[var(--card-border)]
                                       hover:border-[#6366f1] hover:bg-[#6366f1]/5 transition-all"
                        >
                            {equipoVisitante}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                    >
                        <PollBar label={equipoLocal} percent={getPercent('local')} color="#10b981" isSelected={miVoto === 'local'} />
                        <PollBar label="Empate" percent={getPercent('empate')} color="#fbbf24" isSelected={miVoto === 'empate'} />
                        <PollBar label={equipoVisitante} percent={getPercent('visitante')} color="#6366f1" isSelected={miVoto === 'visitante'} />
                        <p className="text-[10px] text-[var(--text-muted)] text-center pt-1">
                            {results.total} {results.total === 1 ? 'voto' : 'votos'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function PollBar({ label, percent, color, isSelected }: { label: string; percent: number; color: string; isSelected: boolean }) {
    return (
        <div className={`relative flex-1 overflow-hidden rounded-lg transition-all`}
            style={isSelected ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : undefined}
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0 rounded-lg opacity-20"
                style={{ backgroundColor: color }}
            />
            <div className="relative flex items-center justify-between px-2.5 py-1.5">
                <span className={`text-[10px] font-bold truncate ${isSelected ? '' : 'text-[var(--text-muted)]'}`}
                    style={isSelected ? { color } : undefined}
                >
                    {label} {isSelected && '✓'}
                </span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color }}>
                    {percent}%
                </span>
            </div>
        </div>
    )
}
