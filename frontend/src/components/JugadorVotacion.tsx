// src/components/JugadorVotacion.tsx
'use client'

import { memo, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { Jugador } from '@/types'

interface JugadorVotacionProps {
  jugador: Jugador
  voto: number
  onVotar: (jugadorId: number, nota: number) => void
}

export const JugadorVotacion = memo(({ jugador, voto, onVotar }: JugadorVotacionProps) => {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = (nota: number) => {
    setIsVoting(true)


    onVotar(jugador.id, nota)

    setTimeout(() => setIsVoting(false), 500)
  }

  return (
    <motion.div
      className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] relative mt-4
                  hover:border-[#10b981]/40 border-b-4 border-b-transparent hover:border-b-[#10b981] transition-all shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Panini Player Out-of-Bounds Image */}
      <div className="absolute -top-6 -right-2 w-20 h-24 z-10 pointer-events-none drop-shadow-xl">
        <Image
          src={`https://api.sofascore.app/api/v1/player/${(jugador.id % 500000) + 1000}/image`}
          alt={jugador.nombre}
          fill
          className="object-contain object-bottom transition-transform duration-300 group-hover:scale-110"
          sizes="80px"
          unoptimized
          onError={(e) => {
            // Fallback to a generic silhouette or transparent if it fails
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Jugador info */}
      <div className="px-4 py-3 flex items-center justify-between gap-3 relative z-20 overflow-hidden rounded-t-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--card-bg)] via-[var(--card-bg)] to-transparent z-0" />

        <div className="flex items-center gap-3 flex-1 min-w-0 pr-16 relative z-10">
          {/* Número */}
          <div className="w-8 h-8 bg-black/20 rounded-lg flex items-center justify-center
                          text-xs font-black text-white shrink-0 border border-white/5 shadow-inner">
            {jugador.numero || '?'}
          </div>

          {/* Nombre y posición */}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate">{jugador.nombre}</p>
            <p className="text-[10px] text-[#10b981] uppercase font-bold tracking-wide">
              {jugador.posicion}
            </p>
          </div>
        </div>

        {/* Rating visual */}
        {voto > 0 && (
          <motion.div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ff6b6b] rounded-md shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <span className="text-white font-bold text-sm">{voto}.0</span>
          </motion.div>
        )}
      </div>

      {/* Votación con estrellas */}
      <div className="px-4 py-2 bg-[var(--background)]/50 flex items-center justify-between border-t border-[var(--card-border)] rounded-b-xl relative z-20">
        <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Calificación</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(estrella => (
            <motion.button
              key={estrella}
              onClick={() => handleVote(estrella)}
              disabled={isVoting}
              whileTap={{ scale: 0.8 }}
              whileHover={{ scale: 1.2 }}
              className={`w-7 h-7 flex items-center justify-center rounded transition-colors
                         ${voto >= estrella
                  ? 'text-[#fbbf24]'
                  : 'text-[var(--card-border)] hover:text-[var(--text-muted)]'
                }`}
              aria-label={`Votar ${estrella} estrellas`}
            >
              <span className="text-lg">★</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
})

JugadorVotacion.displayName = 'JugadorVotacion'
