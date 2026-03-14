// src/components/PartidoCard.tsx
'use client'

import { useRouter } from 'next/navigation'
import { memo, useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FavoriteButton } from './FavoriteButton'
import { TeamLogo } from './TeamLogo'
import { useTheme } from '@/contexts/ThemeContext'
import type { Partido } from '@/types'
import { formatearFecha, formatearHora } from '@/lib/utils'

interface PartidoCardProps {
  partido: Partido
}

export const PartidoCard = memo(({ partido }: PartidoCardProps) => {
    const router = useRouter()
  // Utilidad para extraer color "glow" semialeatorio según el nombre
  const getGlowColor = (teamName: string) => {
    let hash = 0
    for (let i = 0; i < teamName.length; i++) hash = teamName.charCodeAt(i) + ((hash << 5) - hash)
    return `hsl(${Math.abs(hash % 360)}, 70%, 50%)`
  }
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
      className={`bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden
                 transition-all duration-200 cursor-pointer active:scale-[0.99]
                 ${isLive ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/20' : ''}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Header — liga + estado + fecha */}
      <div className="px-3 py-1.5 flex items-center justify-between bg-[var(--background)]/50">
        <span className="text-[9px] font-bold text-[var(--text-muted)] capitalize tracking-wider">
          {partido.liga}
        </span>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          {isLive && (
            <span className="flex items-center gap-1 text-[var(--accent)] font-black">
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
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

      {/* Equipos — layout Inmersivo Centrado (Escudos Gigantes) */}
      <div className="px-4 py-6 relative">
        <div className="flex items-center justify-between relative z-10 w-full">
          {/* Local */}
          <div className="flex flex-col items-center flex-1 gap-2 cursor-pointer group">
            <TeamLogo src={partido.logo_local} teamName={partido.equipo_local} size={40} className="relative z-10" />
            <span className={`text-[12px] md:text-sm font-bold text-center leading-tight line-clamp-2 px-1 ${flashLocal ? 'text-[#ff6b6b]' : ''}`}>
              {partido.equipo_local}
            </span>
          </div>

          {/* VS / Score Divider */}
          <div className="flex flex-col items-center justify-center px-2 shrink-0 w-[80px]">
            {showScore ? (
              <div className="flex items-center gap-2 font-black text-3xl md:text-3xl tracking-tighter">
                <motion.span animate={flashLocal ? { scale: [1, 1.1, 1], color: ['var(--foreground)', 'var(--foreground)', 'var(--foreground)'] } : {}} transition={{ duration: 0.6 }}>
                  {partido.goles_local ?? '-'}
                </motion.span>
                <span className="text-[var(--text-muted)] opacity-30 text-xl mx-1">:</span>
                <motion.span animate={flashVisitante ? { scale: [1, 1.1, 1], color: ['var(--foreground)', 'var(--foreground)', 'var(--foreground)'] } : {}} transition={{ duration: 0.6 }}>
                  {partido.goles_visitante ?? '-'}
                </motion.span>
              </div>
            ) : (
              <div className="border border-[var(--card-border)] bg-[var(--background)] px-2 py-1">
                <span className="text-[9px] font-black text-[var(--text-muted)] italic">VS</span>
              </div>
            )}

            {/* Quick Favorite actions centered below score */}
            <div className="flex justify-center gap-4 mt-2" onClick={(e) => e.stopPropagation()}>
              <FavoriteButton equipo={partido.equipo_local} compact />
              <FavoriteButton equipo={partido.equipo_visitante} compact />
            </div>
          </div>

          {/* Visitante */}
          <div className="flex flex-col items-center flex-1 gap-2 cursor-pointer group">
            <TeamLogo src={partido.logo_visitante} teamName={partido.equipo_visitante} size={40} className="relative z-10" />
            <span className={`text-[12px] md:text-sm font-bold text-center leading-tight line-clamp-2 px-1 ${flashVisitante ? 'text-[#ff6b6b]' : ''}`}>
              {partido.equipo_visitante}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
})

PartidoCard.displayName = 'PartidoCard'
