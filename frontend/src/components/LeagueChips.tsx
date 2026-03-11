// src/components/LeagueChips.tsx
'use client'

import { Trophy, Globe, Star } from 'lucide-react'
import { LIGAS, type Liga } from '@/lib/constants'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { hapticFeedback } from '@/lib/helpers'
import { useTheme } from '@/contexts/ThemeContext'

interface LeagueChipsProps {
    activeLiga: Liga | 'Favoritos'
    onSelect: (liga: Liga | 'Favoritos') => void
    favorites?: string[]
}

export function LeagueChips({ activeLiga, onSelect, favorites = [] }: LeagueChipsProps) {
    const router = useRouter()
    const { classicMode } = useTheme()

    // Mapear slugs legibles para las URLs (ej: "Liga Profesional" -> "liga-profesional")
    const getSlug = (liga: string) => liga.toLowerCase().replace(/\s+/g, '-')

    const handleLeagueClick = (liga: Liga | 'Favoritos') => {
        hapticFeedback(10)

        if (liga === 'Todos') {
            onSelect('Todos')
            return
        }

        if (liga === 'Favoritos') {
            onSelect('Favoritos')
            return
        }

        // For specific leagues, navigate to the league page
        const slug = getSlug(liga)
        router.push(`/liga/${slug}`)
    }

    return (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {/* "Todos" siempre primero */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect('Todos')}
                aria-label="Ver todos los partidos"
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold capitalize tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap border
      ${activeLiga === 'Todos'
                        ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm'
                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]'
                    }`}
            >
                <Globe size={13} />
                Todos
            </motion.button>

            {/* Ligas Favoritas (si existen) */}
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect('Favoritos')}
                aria-label="Ver partidos de mis equipos favoritos"
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold capitalize tracking-tight transition-all whitespace-nowrap flex items-center gap-1.5 border
      ${activeLiga === 'Favoritos'
                        ? 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)] border-[var(--accent-yellow)]/30'
                        : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--accent-yellow)] border-[var(--card-border)]'
                    }`}
            >
                <Star size={13} fill={activeLiga === 'Favoritos' ? 'currentColor' : 'none'} />
                Mis Equipos
            </motion.button>

            {/* Listado de Ligas */}
            {LIGAS.filter(l => l !== 'Todos').map((liga) => (
                <motion.button
                    key={liga}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleLeagueClick(liga)}
                    aria-label={`Ver partidos de ${liga}`}
                    className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold capitalize tracking-tight transition-all flex items-center gap-1.5 whitespace-nowrap border
        ${activeLiga === liga
                            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm'
                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]'
                        }`}
                >
                    <Trophy size={13} className={activeLiga === liga ? '' : 'text-[var(--accent-yellow)]'} />
                    {liga}
                </motion.button>
            ))}
        </div>
    )
}
