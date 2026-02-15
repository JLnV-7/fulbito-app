// src/components/JugadorVotacion.tsx
'use client'

import { memo, useState } from 'react'
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

    // Confetti effect
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.7 },
      colors: ['#ff6b6b', '#ffd700', '#ffffff']
    })

    onVotar(jugador.id, nota)

    setTimeout(() => setIsVoting(false), 500)
  }

  return (
    <motion.div
      className="bg-[#242424] rounded-lg border border-[#333333] overflow-hidden
                  hover:border-[#ff6b6b]/30 transition-all"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Jugador info */}
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Número */}
          <div className="w-8 h-8 bg-[#1e1e1e] rounded-lg flex items-center justify-center
                          text-xs font-bold text-[#909090] shrink-0">
            {jugador.numero || '?'}
          </div>

          {/* Nombre y posición */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{jugador.nombre}</p>
            <p className="text-[10px] text-[#909090] uppercase font-medium tracking-wide">
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
      <div className="px-4 py-2 bg-[#1e1e1e] flex items-center justify-between border-t border-[#333333]">
        <span className="text-[10px] text-[#909090] uppercase font-medium">Calificación</span>
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
                  : 'text-[#3a3a3a] hover:text-[#606060]'
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
