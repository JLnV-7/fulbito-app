// src/components/LeagueChips.tsx
'use client'

import { Globe, Star } from 'lucide-react'
import { LIGAS, LIGA_FLAGS, type Liga } from '@/lib/constants'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { hapticFeedback } from '@/lib/helpers'

interface LeagueChipsProps {
    activeLiga: Liga | 'Favoritos'
    onSelect: (liga: Liga | 'Favoritos') => void
    favorites?: string[]
}

const GRUPOS: { label: string; ligas: (Liga)[] }[] = [
    {
        label: 'Argentina',
        ligas: ['Liga Profesional', 'Primera Nacional', 'Copa Argentina'],
    },
    {
        label: 'Latinoamérica',
        ligas: ['Copa Libertadores', 'Copa Sudamericana', 'Brasileirão', 'Liga MX', 'Primera División Chile', 'Liga BetPlay', 'Primera División Uruguay', 'Liga 1 Perú'],
    },
    {
        label: 'Europa',
        ligas: ['Champions League', 'La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1'],
    },
    {
        label: 'Resto',
        ligas: ['MLS'],
    },
]

export function LeagueChips({ activeLiga, onSelect, favorites = [] }: LeagueChipsProps) {
    const router = useRouter()

    const getSlug = (liga: string) => liga.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, c =>
        ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[c] || c)
    )

    const handleLeagueClick = (liga: Liga | 'Favoritos') => {
        hapticFeedback(10)
        if (liga === 'Todos' || liga === 'Favoritos') {
            onSelect(liga)
            return
        }
        router.push(`/liga/${getSlug(liga)}`)
    }

    const chipBase = 'px-3 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap border'
    const chipActive = 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm'
    const chipInactive = 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]'

    return (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">

            {/* Todos */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect('Todos')}
                aria-label="Ver todos los partidos"
                className={`${chipBase} ${activeLiga === 'Todos' ? chipActive : chipInactive}`}
            >
                <Globe size={13} />
                Todos
            </motion.button>

            {/* Favoritos */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect('Favoritos')}
                aria-label="Ver partidos de mis equipos favoritos"
                className={`${chipBase} ${activeLiga === 'Favoritos'
                    ? 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] border-[var(--accent-yellow)]/30'
                    : chipInactive}`}
            >
                <Star size={13} fill={activeLiga === 'Favoritos' ? 'currentColor' : 'none'} />
                Mis equipos
            </motion.button>

            {/* Separador */}
            <div className="w-px bg-[var(--card-border)] self-stretch mx-0.5 shrink-0" />

            {/* Grupos de ligas */}
            {GRUPOS.map((grupo, gi) => (
                <div key={grupo.label} className="flex items-center gap-1.5">
                    {/* Separador entre grupos (excepto el primero) */}
                    {gi > 0 && (
                        <div className="w-px bg-[var(--card-border)] self-stretch mx-0.5 shrink-0" />
                    )}
                    {grupo.ligas.map((liga) => (
                        <motion.button
                            key={liga}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLeagueClick(liga)}
                            aria-label={`Ver partidos de ${liga}`}
                            className={`${chipBase} ${activeLiga === liga ? chipActive : chipInactive}`}
                        >
                            <span style={{ fontSize: 14 }}>{LIGA_FLAGS[liga] ?? '🏆'}</span>
                            {liga}
                        </motion.button>
                    ))}
                </div>
            ))}
        </div>
    )
}
