'use client'
// src/components/LeagueChips.tsx

import { LIGAS, type Liga } from '@/lib/constants'
import { motion } from 'framer-motion'
import { hapticFeedback } from '@/lib/helpers'

interface LeagueChipsProps {
  activeLiga: Liga | 'Favoritos'
  onSelect: (liga: Liga | 'Favoritos') => void
  favorites?: string[] // mantenido por compatibilidad con page.tsx
}

const LIGA_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  'Liga Profesional':   { emoji: '🇦🇷', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  'Primera Nacional':   { emoji: '🇦🇷', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  'Copa Libertadores':  { emoji: '🏆', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   border: 'rgba(251,191,36,0.3)' },
  'Copa Sudamericana':  { emoji: '🌎', color: '#34d399', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.3)' },
  'Champions League':   { emoji: '⭐', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',   border: 'rgba(96,165,250,0.3)' },
  'La Liga':            { emoji: '🇪🇸', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  'Premier League':     { emoji: '🏴', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  'Serie A':            { emoji: '🇮🇹', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.3)' },
  'Bundesliga':         { emoji: '🇩🇪', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.3)' },
  'Ligue 1':            { emoji: '🇫🇷', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
}

const DEFAULT_CONFIG = { emoji: '⚽', color: '#16a34a', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)' }

export function LeagueChips({ activeLiga, onSelect }: LeagueChipsProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">

      <ChipButton
        active={activeLiga === 'Todos'}
        onClick={() => { hapticFeedback(10); onSelect('Todos') }}
        emoji="🌐" label="Todos"
        color="#16a34a" bg="rgba(22,163,74,0.12)" border="rgba(22,163,74,0.3)"
      />

      <ChipButton
        active={activeLiga === 'Favoritos'}
        onClick={() => { hapticFeedback(10); onSelect('Favoritos') }}
        emoji="⭐" label="Mis Equipos"
        color="#f59e0b" bg="rgba(245,158,11,0.12)" border="rgba(245,158,11,0.3)"
      />

      {LIGAS.filter(l => l !== 'Todos').map(liga => {
        const cfg = LIGA_CONFIG[liga] || DEFAULT_CONFIG
        return (
          <ChipButton
            key={liga}
            active={activeLiga === liga}
            onClick={() => { hapticFeedback(10); onSelect(liga) }}
            emoji={cfg.emoji} label={liga}
            color={cfg.color} bg={cfg.bg} border={cfg.border}
          />
        )
      })}
    </div>
  )
}

function ChipButton({ active, onClick, emoji, label, color, bg, border }: {
  active: boolean; onClick: () => void
  emoji: string; label: string
  color: string; bg: string; border: string
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border"
      style={active
        ? { backgroundColor: bg, color, borderColor: border }
        : { backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)', borderColor: 'var(--card-border)' }
      }
    >
      <span className="text-sm leading-none">{emoji}</span>
      {label}
    </motion.button>
  )
}
