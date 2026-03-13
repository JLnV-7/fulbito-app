'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Star, ArrowRight, User } from 'lucide-react'

type ItemFeed = {
  id: string
  partido_id: string | number | null
  rating_partido: number | null
  review_text: string | null
  review_title: string | null
  jugador_estrella: string | null
  created_at: string
  equipo_local: string
  equipo_visitante: string
  goles_local: number | null
  goles_visitante: number | null
  is_spoiler: boolean
  profile: { username: string; avatar_url: string | null } | null
}

export function FeedGlobal() {
  const [items, setItems] = useState<ItemFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchFeed = async () => {
      try {
        const { data, error } = await supabase
          .from('match_logs')
          .select(`
            id, partido_id, rating_partido, review_text, review_title,
            jugador_estrella, created_at, equipo_local, equipo_visitante,
            goles_local, goles_visitante, is_spoiler,
            profile:profiles!match_logs_user_id_fkey(username, avatar_url)
          `)
          .eq('is_private', false)
          .not('review_text', 'is', null)
          .order('created_at', { ascending: false })
          .limit(30)

        if (error) throw error
        setItems((data ?? []) as ItemFeed[])
      } catch (err) {
        console.error('[FeedGlobal] Fetch error:', err)
        setError('No se pudo cargar el feed de la tribuna.')
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()

    const channel = supabase
      .channel('feed_global_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_logs',
      }, () => fetchFeed())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return <FeedSkeleton />

  if (error) return (
    <div className="p-8 text-center bg-red-500/5 border border-red-500/10 rounded-3xl">
      <p className="text-red-500 text-xs font-black uppercase tracking-widest">{error}</p>
    </div>
  )

  if (!items.length) return (
    <div className="p-12 text-center bg-[var(--card-bg)] border border-[var(--card-border)] border-dashed rounded-3xl">
      <p className="text-[var(--text-muted)] text-sm font-black italic tracking-tighter">
        El feed está en silencio. ¡Sé el primero en dejar una reseña!
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id}
          className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 space-y-4 hover:border-[var(--accent)]/30 transition-all shadow-sm">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <Link href={`/perfil/${item.profile?.username}`}
              className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                {item.profile?.avatar_url ? (
                  <img src={item.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-[var(--accent)]" />
                )}
              </div>
              <span className="text-xs font-black italic tracking-tighter group-hover:text-[var(--accent)] transition-colors">
                @{item.profile?.username || 'Anónimo'}
              </span>
            </Link>
            {item.partido_id && (
              <Link href={`/partido/${item.partido_id}`}
                className="flex items-center gap-1 text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                Ver partido <ArrowRight size={10} />
              </Link>
            )}
          </div>

          {/* Partido */}
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            {item.equipo_local}
            {item.goles_local != null ? ` ${item.goles_local} - ${item.goles_visitante} ` : ' vs '}
            {item.equipo_visitante}
          </p>

          {/* Rating */}
          {item.rating_partido && (
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12}
                  className={i < item.rating_partido! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 opacity-20'} />
              ))}
            </div>
          )}

          {/* Review */}
          {item.review_title && (
            <p className="text-sm font-black tracking-tight">{item.review_title}</p>
          )}
          {item.review_text && (
            item.is_spoiler ? (
              <p className="text-xs text-red-400 italic">⚠️ Reseña con spoilers</p>
            ) : (
              <p className="text-sm leading-relaxed line-clamp-3">"{item.review_text}"</p>
            )
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-[var(--card-border)]/50">
            {item.jugador_estrella ? (
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">
                ⭐ {item.jugador_estrella}
              </span>
            ) : <div />}
            <span className="text-[var(--text-muted)] text-[9px] font-bold opacity-50 uppercase">
              {new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 space-y-4 animate-pulse">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--card-border)]" />
              <div className="h-3 bg-[var(--card-border)] rounded w-16" />
            </div>
            <div className="h-3 bg-[var(--card-border)] rounded w-12" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-[var(--card-border)] rounded w-full" />
            <div className="h-3 bg-[var(--card-border)] rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
} 