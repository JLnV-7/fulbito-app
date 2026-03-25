'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Star, MessageSquareQuote } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TeamLogo } from '@/components/TeamLogo'

type TopMatch = {
    partido_id: string | number
    equipo_local: string
    equipo_visitante: string
    logo_local?: string
    logo_visitante?: string
    goles_local?: number
    goles_visitante?: number
    liga: string
    rating_avg: number
    reviews_count: number
}

export function TopRatedMatches() {
    const [matches, setMatches] = useState<TopMatch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTopMatches = async () => {
            try {
                const supabase = createClient()

                // Approximation: fetch recent high-rated logs and aggregate them manually in JS for speed
                // In production with millions of rows, this should be a Supabase View or RPC
                const { data, error } = await supabase
                    .from('match_logs')
                    .select('partido_id, rating_partido, review_text, equipo_local, equipo_visitante, goles_local, goles_visitante')
                    .gte('rating_partido', 3)
                    .order('created_at', { ascending: false })
                    .limit(50)

                if (error) throw error

                if (data && data.length > 0) {
                    const matchMap = new Map<string, TopMatch>()
                    
                    data.forEach(log => {
                        const pid = String(log.partido_id)
                        if (!matchMap.has(pid)) {
                            matchMap.set(pid, {
                                partido_id: log.partido_id!,
                                equipo_local: log.equipo_local,
                                equipo_visitante: log.equipo_visitante,
                                goles_local: log.goles_local ?? undefined,
                                goles_visitante: log.goles_visitante ?? undefined,
                                liga: 'Destacado', // placeholder, since match_logs might not have liga
                                rating_avg: log.rating_partido || 0,
                                reviews_count: 1
                            })
                        } else {
                            const existing = matchMap.get(pid)!
                            existing.rating_avg = ((existing.rating_avg * existing.reviews_count) + (log.rating_partido || 0)) / (existing.reviews_count + 1)
                            existing.reviews_count += 1
                        }
                    })

                    // Sort by average rating descending, then review count
                    const sorted = Array.from(matchMap.values())
                        .sort((a, b) => b.rating_avg - a.rating_avg || b.reviews_count - a.reviews_count)
                        .slice(0, 4) // Top 4
                    
                    setMatches(sorted)
                }
            } catch (err) {
                console.error("Top matches error:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchTopMatches()
    }, [])

    if (loading) {
        return (
            <div className="mb-8">
                <div className="h-6 w-48 bg-[var(--card-bg)] animate-pulse rounded mb-4" />
                <div className="flex gap-4 overflow-hidden">
                    <div className="w-64 h-32 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-pulse" />
                    <div className="w-64 h-32 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-pulse" />
                </div>
            </div>
        )
    }

    if (matches.length === 0) return null

    return (
        <section className="mb-10">
            <div className="flex items-center gap-2 mb-4 px-1">
                <span className="text-xl">🌟</span>
                <h2 className="text-lg font-black italic uppercase tracking-tighter text-[var(--foreground)]">
                    Mejor Puntuados Hoy
                </h2>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-1 px-1 snap-x">
                {matches.map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        key={m.partido_id}
                        className="shrink-0 snap-center"
                    >
                        <Link href={`/partido/${m.partido_id}`}>
                            <div className="w-[280px] group relative bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[2rem] p-5 shadow-sm hover:shadow-xl hover:border-[#fde047]/50 transition-all overflow-hidden cursor-pointer">
                                {/* Glow background */}
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#fde047]/10 rounded-full blur-3xl group-hover:bg-[#fde047]/20 transition-all" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fde047]/10 border border-[#fde047]/20 text-[#ca8a04]">
                                            <Star size={10} className="fill-[#ca8a04]" />
                                            <span className="text-[10px] font-black">{m.rating_avg.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[var(--text-muted)] text-[10px] font-bold">
                                            <MessageSquareQuote size={12} />
                                            <span>{m.reviews_count} reseñas</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col items-center w-[40%]">
                                            <TeamLogo teamName={m.equipo_local} size={36} />
                                            <span className="text-[10px] font-bold text-center mt-2 truncate w-full uppercase">{m.equipo_local}</span>
                                        </div>

                                        <div className="text-2xl font-black italic tabular-nums tracking-tighter w-[20%] text-center px-2">
                                            {m.goles_local ?? '-'}<span className="text-[var(--text-muted)] opacity-30 mx-0.5">-</span>{m.goles_visitante ?? '-'}
                                        </div>

                                        <div className="flex flex-col items-center w-[40%]">
                                            <TeamLogo teamName={m.equipo_visitante} size={36} />
                                            <span className="text-[10px] font-bold text-center mt-2 truncate w-full uppercase">{m.equipo_visitante}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
