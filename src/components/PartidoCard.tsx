// src/components/PartidoCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import { memo, useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { FavoriteButton } from './FavoriteButton'
import { TeamForm } from './TeamForm'
import { TeamLogo } from './TeamLogo'
import type { Partido } from '@/types'
import { formatearFecha, formatearHora, generateCalendarUrl } from '@/lib/utils'

interface PartidoCardProps {
  partido: Partido
}

export const PartidoCard = memo(({ partido }: PartidoCardProps) => {
  const router = useRouter()
  const prevGolesLocal = useRef(partido.goles_local)
  const prevGolesVisitante = useRef(partido.goles_visitante)

  const [flashLocal, setFlashLocal] = useState(false)
  const [flashVisitante, setFlashVisitante] = useState(false)

  useEffect(() => {
    if (partido.goles_local !== undefined && partido.goles_local !== prevGolesLocal.current) {
      if (prevGolesLocal.current !== undefined) {
        setFlashLocal(true)
        setTimeout(() => setFlashLocal(false), 3000)
      }
      prevGolesLocal.current = partido.goles_local
    }
    if (partido.goles_visitante !== undefined && partido.goles_visitante !== prevGolesVisitante.current) {
      if (prevGolesVisitante.current !== undefined) {
        setFlashVisitante(true)
        setTimeout(() => setFlashVisitante(false), 3000)
      }
      prevGolesVisitante.current = partido.goles_visitante
    }
  }, [partido.goles_local, partido.goles_visitante])

  const handleClick = () => {
    router.push(`/partido/${partido.id}`)
  }

  const EstadoBadge = () => {
    if (partido.estado === 'EN_JUEGO') {
      return (
        <div className="flex items-center gap-1 text-[10px] font-semibold text-[#ff6b6b]">
          <span className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-pulse"></span>
          EN VIVO
        </div>
      )
    }
    return null
  }

  const ScoreDisplay = ({ goles, flash }: { goles?: number, flash: boolean }) => {
    const showScore = partido.estado === 'EN_JUEGO' || partido.estado === 'FINALIZADO'

    return (
      <motion.div
        animate={flash ? {
          backgroundColor: ['rgba(255, 107, 107, 0)', 'rgba(255, 107, 107, 0.4)', 'rgba(255, 107, 107, 0)'],
          scale: [1, 1.3, 1],
        } : {}}
        transition={{ duration: 0.8, repeat: flash ? 2 : 0 }}
        className={`w-8 h-8 flex items-center justify-center rounded-lg text-base font-bold transition-all duration-500
          ${flash ? 'text-[#ff6b6b] shadow-[0_0_15px_rgba(255,107,107,0.5)]' : 'text-[var(--foreground)]'}
          ${partido.estado === 'EN_JUEGO' ? 'bg-[#ff6b6b]/5' : 'bg-[var(--background)]'}
        `}
      >
        {showScore && goles !== undefined
          ? goles
          : <span className="text-[var(--text-muted)] opacity-50">-</span>
        }
      </motion.div>
    )
  }

  const handleCalendarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(generateCalendarUrl(partido), '_blank')
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-[var(--card-bg)] rounded-xl border overflow-hidden
                 hover:border-[#ff6b6b]/50 hover:shadow-lg
                 transition-all duration-300 cursor-pointer active:scale-[0.98]
                 animate-fade-in
                 hover:scale-[1.02]
                 ${partido.estado === 'EN_JUEGO' ? 'border-[#ff6b6b]/40 shadow-[0_0_20px_rgba(255,107,107,0.1)]' : 'border-[var(--card-border)]'}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header compacto */}
      <div className="px-4 py-2 bg-[var(--background)] flex items-center justify-between border-b border-[var(--card-border)]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[#ff6b6b] uppercase">
            {partido.liga}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
          <EstadoBadge />
          <span>{formatearFecha(partido.fecha_inicio)}</span>
          <span className="font-semibold">{formatearHora(partido.fecha_inicio)}</span>
        </div>
      </div>

      {/* Equipos - estilo SofaScore */}
      <div className="px-4 py-4 space-y-3">
        {/* Equipo Local */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TeamLogo
              src={partido.logo_local}
              teamName={partido.equipo_local}
              size={28}
            />
            <span className={`text-sm font-bold truncate transition-colors duration-500 ${flashLocal ? 'text-[#ff6b6b]' : 'text-[var(--foreground)]'}`}>
              {partido.equipo_local}
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <FavoriteButton equipo={partido.equipo_local} compact />
            </div>
          </div>
          <ScoreDisplay goles={partido.goles_local} flash={flashLocal} />
        </div>

        {/* Equipo Visitante */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TeamLogo
              src={partido.logo_visitante}
              teamName={partido.equipo_visitante}
              size={28}
            />
            <span className={`text-sm font-bold truncate transition-colors duration-500 ${flashVisitante ? 'text-[#ff6b6b]' : 'text-[var(--foreground)]'}`}>
              {partido.equipo_visitante}
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <FavoriteButton equipo={partido.equipo_visitante} compact />
            </div>
          </div>
          <ScoreDisplay goles={partido.goles_visitante} flash={flashVisitante} />
        </div>
      </div>

      {/* Rachas de equipos */}
      <div className="px-4 py-2 bg-[var(--background)]/30 border-t border-[var(--card-border)] flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--text-muted)] w-12 truncate">{partido.equipo_local.split(' ')[0]}</span>
            <TeamForm equipo={partido.equipo_local} compact />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--text-muted)] w-12 truncate">{partido.equipo_visitante.split(' ')[0]}</span>
            <TeamForm equipo={partido.equipo_visitante} compact />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {partido.estado === 'PREVIA' && (
            <button
              onClick={handleCalendarClick}
              className="text-xs bg-[var(--card-bg)] border border-[var(--card-border)] px-2 py-1 rounded-lg 
                         hover:border-[#4285f4] hover:text-[#4285f4] transition-colors flex items-center gap-1"
              title="Agregar a Google Calendar"
            >
              📅
            </button>
          )}
          <span className="text-xs">→</span>
        </div>
      </div>
    </div>
  )
})

PartidoCard.displayName = 'PartidoCard'

