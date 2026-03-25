'use client'

import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { MatchLog } from '@/types'

interface ViterboInsightProps {
    resenas: MatchLog[]
    equipoFavorito?: string
}

export function ViterboInsight({ resenas, equipoFavorito }: ViterboInsightProps) {
    if (resenas.length < 3) return null

    // Helper logic to find insights
    const getInsight = () => {
        const teamReviews = resenas.filter(r => r.equipo_local === equipoFavorito || r.equipo_visitante === equipoFavorito)
        const avgTeamRating = teamReviews.length > 0 
            ? teamReviews.reduce((acc, r) => acc + r.rating_partido, 0) / teamReviews.length 
            : 0
        
        const otherReviews = resenas.filter(r => r.equipo_local !== equipoFavorito && r.equipo_visitante !== equipoFavorito)
        const avgOtherRating = otherReviews.length > 0
            ? otherReviews.reduce((acc, r) => acc + r.rating_partido, 0) / otherReviews.length
            : 0

        if (teamReviews.length >= 3 && avgTeamRating > 4.2) {
            return {
                title: 'Termo de Corazón',
                desc: `Tus reseñas de ${equipoFavorito} promedian ${avgTeamRating.toFixed(1)} ⭐. ¡La objetividad te la llevaste a marzo!`,
                icon: AlertTriangle,
                color: 'text-amber-500',
                bg: 'bg-amber-500/10'
            }
        }

        if (resenas.length > 10 && Math.abs(avgOtherRating - 3) < 0.5) {
            return {
                title: 'Equilibrio Puro',
                desc: 'Tus ratings suelen ser muy balanceados. Sos el VAR de la Tribuna.',
                icon: CheckCircle2,
                color: 'text-green-500',
                bg: 'bg-green-500/10'
            }
        }

        return {
            title: 'Analista en Ascenso',
            desc: `Has analizado ${resenas.length} partidos. Seguí rateando para desbloquear insights profundos de Viterbo.`,
            icon: TrendingUp,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        }
    }

    const { title, desc, icon: Icon, color, bg } = getInsight()

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-[2rem] border border-[var(--card-border)] ${bg} relative overflow-hidden group`}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Brain size={60} />
            </div>

            <div className="flex items-start gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${bg} border border-white/5`}>
                    <Icon className={color} size={24} />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Viterbo IA Insight</span>
                        <div className="h-1 w-1 rounded-full bg-[var(--accent)] animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black italic tracking-tighter uppercase">{title}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-medium max-w-sm leading-relaxed">
                        {desc}
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
