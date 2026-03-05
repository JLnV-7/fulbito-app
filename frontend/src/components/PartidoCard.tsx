// src/components/PartidoCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import { memo, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FavoriteButton } from './FavoriteButton'
import { TeamLogo } from './TeamLogo'
import type { Partido } from '@/types'
import { formatearFecha, formatearHora } from '@/lib/utils'

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

  const isLive = partido.estado === 'EN_JUEGO'
  const isFinished = partido.estado === 'FINALIZADO'
  const showScore = isLive || isFinished

  return (
    <div
      onClick={handleClick}
      className={`bg-[var(--card-bg)] rounded-xl border overflow-hidden
                 hover:border-[#10b981]/40 hover:shadow-lg hover:shadow-[#10b981]/5
                 transition-all duration-200 cursor-pointer active:scale-[0.98]
                 ${isLive ? 'border-[#ff6b6b]/40 shadow-[0_0_15px_rgba(255,107,107,0.08)]' : 'border-[var(--card-border)]'}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header — liga + estado + fecha */}
      <div className="px-3 py-1.5 flex items-center justify-between bg-[var(--background)]/50">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {partido.liga}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          {isLive && (
            <span className="flex items-center gap-1 text-[#ff6b6b] font-bold">
              <span className="w-1.5 h-1.5 bg-[#ff6b6b] rounded-full animate-pulse" />
              VIVO
            </span>
          )}
          {isFinished && (
            <span className="text-[var(--text-muted)] font-medium">FIN</span>
          )}
          <span>{formatearFecha(partido.fecha_inicio)}</span>
          <span className="font-semibold">{formatearHora(partido.fecha_inicio)}</span>
        </div>
      </div>

      {/* Equipos — layout compacto horizontal */}
      <div className="px-3 py-3">
        {/* Local */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TeamLogo src={partido.logo_local} teamName={partido.equipo_local} size={24} />
            <span className={`text-[13px] font-bold truncate ${flashLocal ? 'text-[#ff6b6b]' : ''}`}>
              {partido.equipo_local}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <FavoriteButton equipo={partido.equipo_local} compact />
            </div>
            <motion.span
              animate={flashLocal ? { scale: [1, 1.3, 1], color: ['#ff6b6b', '#ff6b6b', 'var(--foreground)'] } : {}}
              transition={{ duration: 0.6 }}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold
                ${isLive ? 'bg-[#ff6b6b]/10 text-[#ff6b6b]' : 'bg-[var(--background)] text-[var(--foreground)]'}`}
            >
              {showScore && partido.goles_local !== undefined ? partido.goles_local : '-'}
            </motion.span>
          </div>
        </div>

        {/* Visitante */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TeamLogo src={partido.logo_visitante} teamName={partido.equipo_visitante} size={24} />
            <span className={`text-[13px] font-bold truncate ${flashVisitante ? 'text-[#ff6b6b]' : ''}`}>
              {partido.equipo_visitante}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div onClick={(e) => e.stopPropagation()}>
              <FavoriteButton equipo={partido.equipo_visitante} compact />
            </div>
            <motion.span
              animate={flashVisitante ? { scale: [1, 1.3, 1], color: ['#ff6b6b', '#ff6b6b', 'var(--foreground)'] } : {}}
              transition={{ duration: 0.6 }}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold
                ${isLive ? 'bg-[#ff6b6b]/10 text-[#ff6b6b]' : 'bg-[var(--background)] text-[var(--foreground)]'}`}
            >
              {showScore && partido.goles_visitante !== undefined ? partido.goles_visitante : '-'}
            </motion.span>
          </div>
        </div>
      </div>
    </div>
  )
})

PartidoCard.displayName = 'PartidoCard'
