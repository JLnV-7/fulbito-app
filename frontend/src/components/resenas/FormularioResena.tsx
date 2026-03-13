'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/contexts/ToastContext'
import { StarRating } from '@/components/StarRating'
import { PlayerRatingPicker } from '@/components/PlayerRatingPicker'
import { motion } from 'framer-motion'

type Props = {
  partidoId: number
  equipoLocal: string
  equipoVisitante: string
  logoLocal?: string
  logoVisitante?: string
  liga?: string
  golesLocal?: number
  golesVisitante?: number
  jugadoresDelPartido: { id: number; nombre: string }[]
  resenaExistente?: any
  onGuardado?: () => void
}

export function FormularioResena({
  partidoId, equipoLocal, equipoVisitante,
  logoLocal, logoVisitante, liga,
  golesLocal, golesVisitante,
  jugadoresDelPartido, resenaExistente, onGuardado
}: Props) {
  const supabase = createClient()
  const { showToast } = useToast()

  const [rating, setRating] = useState<number>(resenaExistente?.rating_partido ?? 0)
  const [texto, setTexto] = useState(resenaExistente?.review_text ?? '')
  const [titulo, setTitulo] = useState(resenaExistente?.review_title ?? '')
  const [isSpoiler, setIsSpoiler] = useState(resenaExistente?.is_spoiler ?? false)
  const [playerRatings, setPlayerRatings] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!rating) { showToast('Poné al menos una calificación al partido.', 'warning'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('Tenés que estar logueado.', 'error'); setLoading(false); return }

    try {
      // Upsert en match_logs
      const { data: newLog, error } = await supabase
        .from('match_logs')
        .upsert({
          user_id: user.id,
          partido_id: String(partidoId),
          match_type: 'tv',
          equipo_local: equipoLocal,
          equipo_visitante: equipoVisitante,
          logo_local: logoLocal,
          logo_visitante: logoVisitante,
          liga: liga,
          goles_local: golesLocal,
          goles_visitante: golesVisitante,
          fecha_partido: new Date().toISOString(),
          rating_partido: rating,
          review_title: titulo.trim() || null,
          review_text: texto.trim() || null,
          is_spoiler: isSpoiler,
          is_private: false,
          watched_at: new Date().toISOString(),
        }, { onConflict: 'user_id,partido_id' })
        .select().single()

      if (error) throw error

      // Guardar player ratings si hay
      const prEntries = Object.entries(playerRatings)
      if (prEntries.length > 0 && newLog) {
        const prRows = prEntries.map(([playerId, rating]) => {
          const jugador = jugadoresDelPartido.find(j => String(j.id) === playerId)
          return {
            match_log_id: newLog.id,
            player_name: jugador?.nombre || playerId,
            player_team: 'local' as const,
            rating,
          }
        })
        await supabase.from('match_log_player_ratings')
          .upsert(prRows, { onConflict: 'match_log_id,player_name' })
      }

      showToast('¡Reseña guardada!', 'success')
      onGuardado?.()
    } catch (err) {
      console.error(err)
      showToast('No se pudo guardar la reseña.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-sm">
      <h3 className="font-black text-xl italic tracking-tighter">TU RESEÑA DEL PARTIDO</h3>

      {/* Rating principal */}
      <div className="space-y-2">
        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">¿Cómo estuvo el partido?</p>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(rating === n ? 0 : n)}
              className="text-3xl transition-all hover:scale-125">
              {n <= rating ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Título opcional */}
      <div className="space-y-2">
        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">Título <span className="opacity-50">(opcional)</span></p>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          maxLength={100}
          placeholder="Un resumen en una línea..."
          className="w-full bg-[var(--background)] text-[var(--foreground)] rounded-xl p-4 text-sm
                     border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Texto */}
      <div className="space-y-2">
        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
          Tu reseña <span className="opacity-50">(opcional)</span>
        </p>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Un golazo de media cancha, un árbitro que arruinó todo..."
          className="w-full bg-[var(--background)] text-[var(--foreground)] rounded-xl p-4 text-sm
                     placeholder:text-[var(--text-muted)]/50 border border-[var(--card-border)]
                     focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isSpoiler} onChange={e => setIsSpoiler(e.target.checked)}
              className="rounded" />
            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Contiene spoilers</span>
          </label>
          <p className="text-[var(--text-muted)] text-[10px] font-bold">{texto.length}/500</p>
        </div>
      </div>

      {/* Player ratings */}
      {jugadoresDelPartido.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
          <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
            Calificá jugadores <span className="opacity-50">(opcional)</span>
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {jugadoresDelPartido.map(j => (
              <div key={j.id} className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold truncate flex-1 min-w-0">{j.nombre}</span>
                <PlayerRatingPicker
                  value={playerRatings[String(j.id)]}
                  onChange={val => setPlayerRatings(prev => ({ ...prev, [String(j.id)]: val }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[var(--foreground)] hover:opacity-90 disabled:opacity-50
                   text-[var(--background)] font-black text-sm uppercase tracking-widest
                   py-4 rounded-xl transition-all shadow-lg active:scale-95"
      >
        {loading ? 'Guardando...' : resenaExistente ? 'Actualizar reseña' : 'Guardar reseña'}
      </button>
    </div>
  )
}
