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
    const [hasLineup, setHasLineup] = useState(false)

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

                // Check if user has a custom XI
                const { data: myLineup } = await supabase
                    .from('user_lineups')
                    .select('id')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (myLineup) {
                    setHasLineup(true)
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

    const handleVoteWithXI = async () => {
        // A fun random/simulated choice, favoring the user's likely team logic, but kept simple here:
        const options: Prediccion[] = ['local', 'empate', 'visitante', 'local', 'visitante'] // slightly less chance for draw
        const randomChoice = options[Math.floor(Math.random() * options.length)]
        await handleVote(randomChoice)
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
                            <span className="text-[9px] font-black capitalize tracking-tighter text-[var(--text-muted)] mr-1 whitespace-nowrap">¿Quién gana?</span>
                            <button
                                onClick={() => handleVote('local')}
                                disabled={loading || !user}
                                className="flex-1 py-1.5 text-[10px] font-black capitalize tracking-widest bg-[var(--background)] border border-[var(--card-border)]
                                           hover:border-[#16a34a] hover:bg-[#16a34a]/5 transition-all truncate"
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                {localShort}
                            </button>
                            <button
                                onClick={() => handleVote('empate')}
                                disabled={loading || !user}
                                className="py-1.5 px-3 text-[10px] font-black capitalize bg-[var(--background)] border border-[var(--card-border)]
                                           hover:border-[#d97706] hover:bg-[#d97706]/5 transition-all"
                                style={{ borderRadius: 'var(--radius)' }}
                            >
                                X
                            </button>
                            <button
                                onClick={() => handleVote('visitante')}
                                disabled={loading || !user}
                                className="flex-1 py-1.5 text-[10px] font-black capitalize tracking-widest bg-[var(--background)] border border-[var(--card-border)]
                                           hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all truncate"
                                style={{ borderRadius: 'var(--radius)' }}
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
                                    color="#16a34a"
                                    isSelected={miVoto === 'local'}
                                />
                                <PollBar
                                    label="X"
                                    percent={getPercent('empate')}
                                    color="#d97706"
                                    isSelected={miVoto === 'empate'}
                                />
                                <PollBar
                                    label={visitanteShort}
                                    percent={getPercent('visitante')}
                                    color="#2563eb"
                                    isSelected={miVoto === 'visitante'}
                                />
                            </div>
                            <div className="text-[9px] font-black text-[var(--foreground)] text-center bg-[var(--background)] py-1 border border-[var(--card-border)] capitalize tracking-widest">
                                {results.total} {results.total === 1 ? 'VOTO' : 'VOTOS TOTALES'} 🗳️
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    // Full mode (standalone)
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4" style={{ borderRadius: 'var(--radius)' }}>
            <h4 className="text-[10px] font-black text-[var(--text-muted)] capitalize tracking-widest mb-3 italic">
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
                            className="flex-1 py-3 text-sm font-black capitalize bg-[var(--background)] border-2 border-[var(--card-border)]
                                       hover:border-[#16a34a] hover:bg-[#16a34a]/5 transition-all italic tracking-tighter"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {equipoLocal}
                        </button>
                        <button
                            onClick={() => handleVote('empate')}
                            disabled={loading || !user}
                            className="py-3 px-5 text-sm font-black capitalize bg-[var(--background)] border-2 border-[var(--card-border)]
                                       hover:border-[#d97706] hover:bg-[#d97706]/5 transition-all"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            Empate
                        </button>
                        <button
                            onClick={() => handleVote('visitante')}
                            disabled={loading || !user}
                            className="flex-1 py-3 text-sm font-black capitalize bg-[var(--background)] border-2 border-[var(--card-border)]
                                       hover:border-[#2563eb] hover:bg-[#2563eb]/5 transition-all italic tracking-tighter"
                            style={{ borderRadius: 'var(--radius)' }}
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
                        <PollBar label={equipoLocal} percent={getPercent('local')} color="#16a34a" isSelected={miVoto === 'local'} />
                        <PollBar label="Empate" percent={getPercent('empate')} color="#d97706" isSelected={miVoto === 'empate'} />
                        <PollBar label={equipoVisitante} percent={getPercent('visitante')} color="#2563eb" isSelected={miVoto === 'visitante'} />
                        <div className="text-[10px] font-black text-[var(--foreground)] text-center bg-[var(--background)] py-2 border border-[var(--card-border)] mt-2 capitalize tracking-widest">
                            {results.total} {results.total === 1 ? 'VOTO REGISTRADO' : 'VOTOS TOTALES'} 🗳️
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Use My XI Button */}
            <AnimatePresence>
                {!showResults && hasLineup && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 overflow-hidden"
                    >
                        <button
                            onClick={handleVoteWithXI}
                            disabled={loading || !user}
                            className="w-full py-2.5 text-[10px] font-black capitalize tracking-widest bg-[var(--background)] border border-[var(--card-border)] text-[var(--accent)] hover:bg-[var(--hover-bg)] transition-all flex items-center justify-center gap-2"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            <span>⚡</span> Usar mi XI Ideal para pronosticar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function PollBar({ label, percent, color, isSelected }: { label: string; percent: number; color: string; isSelected: boolean }) {
    return (
        <div className={`relative flex-1 overflow-hidden transition-all border border-black/5`}
            style={isSelected ? { boxShadow: `0 0 0 1px ${color}`, borderRadius: 'var(--radius)' } : { borderRadius: 'var(--radius)' }}
        >
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-0 opacity-20"
                style={{ backgroundColor: color }}
            />
            <div className="relative flex items-center justify-between px-2 py-1.5">
                <span className={`text-[9px] font-black capitalize tracking-tighter truncate ${isSelected ? '' : 'text-[var(--text-muted)]'}`}
                    style={isSelected ? { color } : undefined}
                >
                    {label} {isSelected && '✓'}
                </span>
                <span className="text-[9px] font-black tabular-nums" style={{ color }}>
                    {percent}%
                </span>
            </div>
        </div>
    )
}
