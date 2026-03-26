'use client'
// src/components/LeagueChips.tsx
//
// CAMBIOS:
// ✅ Colores por liga: cada chip tiene su color de identidad en estado activo
// ✅ Emojis de banderas/iconos por liga — mucho más visual que Trophy genérico para todas
// ✅ El chip activo tiene el color de la liga, no el color foreground genérico
// ✅ Eliminado router.push('/liga/:slug') al clickear — causaba navegación inesperada
//    cuando el usuario solo quería filtrar. Si necesitás páginas por liga, hacelo desde otro lugar.

import { Star } from 'lucide-react'
import { LIGAS, type Liga } from '@/lib/constants'
import { motion } from 'framer-motion'
import { hapticFeedback } from '@/lib/helpers'

interface LeagueChipsProps {
  activeLiga: Liga | 'Favoritos'
  onSelect: (liga: Liga | 'Favoritos') => void
  favorites?: string[]
}

// Configuración visual por liga
const LIGA_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Liga Profesional':    { emoji: '🇦🇷', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  'Primera Nacional':    { emoji: '🇦🇷', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  'Copa Libertadores':   { emoji: '🏆', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  'Copa Sudamericana':   { emoji: '🌎', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.3)' },
  'Champions League':    { emoji: '⭐', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  'La Liga':             { emoji: '🇪🇸', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  'Premier League':      { emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  'Serie A':             { emoji: '🇮🇹', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)' },
  'Bundesliga':          { emoji: '🇩🇪', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  'Ligue 1':             { emoji: '🇫🇷', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
}

const DEFAULT_CONFIG = { emoji: '⚽', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)' }

export function LeagueChips({ activeLiga, onSelect, favorites = [] }: LeagueChipsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">

      {/* Todos */}
      <ChipButton
        active={activeLiga === 'Todos'}
        onClick={() => { hapticFeedback(10); onSelect('Todos') }}
        emoji="🌐"
        label="Todos"
        color="#16a34a"
        bg="rgba(22,163,74,0.12)"
        border="rgba(22,163,74,0.3)"
      />

      {/* Mis Equipos */}
      <ChipButton
        active={activeLiga === 'Favoritos'}
        onClick={() => { hapticFeedback(10); onSelect('Favoritos') }}
        emoji="⭐"
        label="Mis Equipos"
        color="#f59e0b"
        bg="rgba(245,158,11,0.12)"
        border="rgba(245,158,11,0.3)"
      />

      {/* Ligas */}
      {LIGAS.filter((l: string) => l !== 'Todos').map((liga: string) => {
        const cfg = LIGA_CONFIG[liga] || DEFAULT_CONFIG
        return (
          <ChipButton
            key={liga}
            active={activeLiga === liga}
            onClick={() => { hapticFeedback(10); onSelect(liga as Liga) }}
            emoji={cfg.emoji}
            label={liga}
            color={cfg.color}
            bg={cfg.bg}
            border={cfg.border}
          />
        )
      })}
    </div>
  )
}

function ChipButton({
  active, onClick, emoji, label, color, bg, border,
}: {
  active: boolean
  onClick: () => void
  emoji: string
  label: string
  color: string
  bg: string
  border: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border"
      style={active ? {
        backgroundColor: bg,
        color: color,
        borderColor: border,
      } : {
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-muted)',
        borderColor: 'var(--card-border)',
      }}
    >
      <span className="text-sm leading-none">{emoji}</span>
      {label}
    </motion.button>
  )
}
