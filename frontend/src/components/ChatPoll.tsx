'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { BarChart2, Plus, X, Check } from 'lucide-react'

interface Poll {
    id: string
    question: string
    options: string[]
    active: boolean
}

interface VoteCount {
    option_index: number
    count: number
}

export function ChatPoll({ partidoId }: { partidoId: string }) {
    const { user } = useAuth()
    const [poll, setPoll] = useState<Poll | null>(null)
    const [votes, setVotes] = useState<VoteCount[]>([])
    const [userVote, setUserVote] = useState<number | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [newQuestion, setNewQuestion] = useState('')
    const [newOptions, setNewOptions] = useState(['', ''])

    useEffect(() => {
        if (!partidoId) return
        fetchPoll()

        const pollSub = supabase
            .channel(`poll-${partidoId}`)
            .on('postgres_changes' as any, { event: '*', table: 'chat_polls', filter: `partido_id=eq.${partidoId}` }, fetchPoll)
            .on('postgres_changes' as any, { event: '*', table: 'chat_poll_votes' }, fetchVotes)
            .subscribe()

        return () => { supabase.removeChannel(pollSub) }
    }, [partidoId])

    const fetchPoll = async () => {
        const { data, error } = await supabase
            .from('chat_polls')
            .select('*')
            .eq('partido_id', partidoId)
            .eq('active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (data) {
            setPoll(data)
            fetchVotes()
            if (user) fetchUserVote(data.id)
        } else {
            setPoll(null)
        }
    }

    const fetchVotes = async () => {
        if (!poll) return
        const { data, error } = await supabase
            .from('chat_poll_votes')
            .select('option_index')
            .eq('poll_id', poll.id)

        if (data) {
            const counts: Record<number, number> = {}
            data.forEach(v => {
                counts[v.option_index] = (counts[v.option_index] || 0) + 1
            })
            setVotes(Object.entries(counts).map(([idx, count]) => ({
                option_index: parseInt(idx),
                count
            })))
        }
    }

    const fetchUserVote = async (pollId: string) => {
        if (!user) return
        const { data } = await supabase
            .from('chat_poll_votes')
            .select('option_index')
            .eq('poll_id', pollId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (data) setUserVote(data.option_index)
    }

    const handleVote = async (idx: number) => {
        if (!user || !poll) return
        const { error } = await supabase
            .from('chat_poll_votes')
            .upsert({
                poll_id: poll.id,
                user_id: user.id,
                option_index: idx
            })

        if (!error) {
            setUserVote(idx)
            fetchVotes()
        }
    }

    const handleCreatePoll = async () => {
        if (!user || !newQuestion || newOptions.some(o => !o.trim())) return

        // Deactivate previous poll
        await supabase.from('chat_polls').update({ active: false }).eq('partido_id', partidoId)

        const { error } = await supabase.from('chat_polls').insert({
            partido_id: partidoId,
            created_by: user.id,
            question: newQuestion,
            options: newOptions.filter(o => o.trim() !== '')
        })

        if (!error) {
            setShowCreate(false)
            setNewQuestion('')
            setNewOptions(['', ''])
            fetchPoll()
        }
    }

    const totalVotes = votes.reduce((acc, v) => acc + v.count, 0)

    if (showCreate) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-2xl mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-sm">Nueva Encuesta</h4>
                    <button onClick={() => setShowCreate(false)}><X size={16} /></button>
                </div>
                <input
                    type="text"
                    placeholder="Pregunta (ej: ¿Quién gana?)"
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm mb-3"
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                />
                <div className="space-y-2 mb-4">
                    {newOptions.map((opt, i) => (
                        <input
                            key={i}
                            type="text"
                            placeholder={`Opción ${i + 1}`}
                            className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm"
                            value={opt}
                            onChange={e => {
                                const copy = [...newOptions]
                                copy[i] = e.target.value
                                setNewOptions(copy)
                            }}
                        />
                    ))}
                    {newOptions.length < 4 && (
                        <button
                            onClick={() => setNewOptions([...newOptions, ''])}
                            className="text-[10px] font-bold text-[var(--accent)]"
                        >
                            + AGREGAR OPCIÓN
                        </button>
                    )}
                </div>
                <button
                    onClick={handleCreatePoll}
                    className="w-full bg-[var(--accent)] text-white font-bold py-2 rounded-xl text-sm"
                >
                    Lanzar Encuesta
                </button>
            </div>
        )
    }

    if (!poll) {
        return (
            <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors p-2"
            >
                <Plus size={14} /> Lanzar encuesta en vivo
            </button>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-2xl mb-4 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <BarChart2 size={40} />
            </div>

            <h4 className="font-black text-sm mb-4 pr-10 capitalize tracking-tight">
                🔥 {poll.question}
            </h4>

            <div className="space-y-2.5">
                {poll.options.map((opt, i) => {
                    const voteData = votes.find(v => v.option_index === i)
                    const count = voteData?.count || 0
                    const percent = totalVotes > 0 ? (count / totalVotes) * 100 : 0
                    const isSelected = userVote === i

                    return (
                        <div key={i} className="relative">
                            <button
                                onClick={() => handleVote(i)}
                                disabled={!user}
                                className={`w-full relative z-10 p-3 rounded-xl border transition-all text-left flex justify-between items-center group
                                    ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--card-border)] bg-[var(--background)]/50 hover:bg-[var(--background)]'}`}
                            >
                                <span className={`text-xs font-bold ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--foreground)]'}`}>
                                    {opt}
                                </span>
                                {totalVotes > 0 && (
                                    <span className="text-[10px] font-black opacity-60">
                                        {Math.round(percent)}%
                                    </span>
                                )}
                                {isSelected && (
                                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-4 bg-[var(--accent)] rounded-r-full" />
                                )}
                            </button>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                className={`absolute inset-0 h-full rounded-xl pointer-events-none opacity-10
                                    ${isSelected ? 'bg-[var(--accent)]' : 'bg-[var(--text-muted)]'}`}
                            />
                        </div>
                    )
                })}
            </div>

            <div className="mt-4 flex justify-between items-center">
                <span className="text-[10px] font-bold text-[var(--text-muted)] capitalize tracking-widest">
                    {totalVotes} {totalVotes === 1 ? 'VOTO' : 'VOTOS'}
                </span>
                <button
                    onClick={() => setShowCreate(true)}
                    className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    NUEVA
                </button>
            </div>
        </div>
    )
}
