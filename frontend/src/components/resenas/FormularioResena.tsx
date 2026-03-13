'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ResenaForm } from '@/types/resena'

type Props = {
  partidoId: number
  jugadoresDelPartido: { id: number; nombre: string }[]
  resenaExistente?: ResenaForm | null   // para modo edición
  onGuardado?: () => void
}

const ESTRELLAS = [1, 2, 3, 4, 5]

export function FormularioResena({
  partidoId,
  jugadoresDelPartido,
  resenaExistente,
  onGuardado,
}: Props) {
  const supabase = createClient()

  const [rating, setRating]               = useState<number | null>(resenaExistente?.rating ?? null)
  const [ratingHover, setRatingHover]     = useState<number | null>(null)
  const [texto, setTexto]                 = useState(resenaExistente?.texto ?? '')
  const [mvpId, setMvpId]                 = useState<number | null>(resenaExistente?.mvp_jugador_id ?? null)
  const [mvpNombre, setMvpNombre]         = useState(resenaExistente?.mvp_jugador_nombre ?? '')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!rating && !texto && !mvpId) {
      setError('Completá al menos un campo antes de guardar.')
      return
    }

    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Tenés que estar logueado.'); setLoading(false); return }

    const payload = {
      user_id: user.id,
      partido_id: partidoId,
      rating,
      texto: texto.trim() || null,
      mvp_jugador_id: mvpId,
      mvp_jugador_nombre: mvpNombre || null,
    }

    const { error: sbError } = await supabase
      .from('resenas')
      .upsert(payload, { onConflict: 'user_id,partido_id' })

    if (sbError) {
      console.error('[FormularioResena] Save error:', sbError)
      setError('No se pudo guardar la reseña. Intentá de nuevo.')
    } else {
      onGuardado?.()
    }

    setLoading(false)
  }

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl p-6 border border-[var(--card-border)] space-y-6 shadow-sm">
      <h3 className="text-[var(--foreground)] font-black text-xl italic tracking-tighter">TU RESEÑA DEL PARTIDO</h3>

      {/* Rating con estrellas */}
      <div className="space-y-3">
        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">¿Cómo estuvo el partido?</p>
        <div className="flex gap-2">
          {ESTRELLAS.map((n) => (
            <button
              key={n}
              onMouseEnter={() => setRatingHover(n)}
              onMouseLeave={() => setRatingHover(null)}
              onClick={() => setRating(rating === n ? null : n)}
              className="text-3xl transition-all duration-200 hover:scale-125"
            >
              {n <= (ratingHover ?? rating ?? 0) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Texto libre */}
      <div className="space-y-3">
        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
          Escribí algo sobre este partido{' '}
          <span className="opacity-50">(opcional)</span>
        </p>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Un golazo de media cancha, un arquero que salvó todo..."
          className="w-full bg-[var(--background)] text-[var(--foreground)] rounded-xl p-4 text-sm
                     placeholder:text-[var(--text-muted)]/50 border border-[var(--card-border)]
                     focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
        />
        <div className="flex justify-end">
          <p className="text-[var(--text-muted)] text-[10px] font-bold">
            {texto.length}/500
          </p>
        </div>
      </div>

      {/* MVP */}
      <div className="space-y-3">
        <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest">
          Tu mejor del partido{' '}
          <span className="opacity-50">(opcional)</span>
        </p>
        <select
          value={mvpId ?? ''}
          onChange={(e) => {
            const id = Number(e.target.value)
            const jugador = jugadoresDelPartido.find((j) => j.id === id)
            setMvpId(id || null)
            setMvpNombre(jugador?.nombre ?? '')
          }}
          className="w-full bg-[var(--background)] text-[var(--foreground)] rounded-xl p-4 text-sm
                     border border-[var(--card-border)] focus:outline-none focus:border-[var(--accent)] 
                     transition-colors appearance-none cursor-pointer"
        >
          <option value="">— Elegí un jugador —</option>
          {jugadoresDelPartido.map((j) => (
            <option key={j.id} value={j.id}>{j.nombre}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-500 text-xs font-bold">{error}</p>
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
