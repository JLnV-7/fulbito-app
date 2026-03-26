'use client'
// src/components/feed/FeedGlobal.tsx

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Star, Trophy, ArrowRight } from 'lucide-react'

type ItemFeed = {
  id: string
  partido_id: number | string
  rating_partido: number | null
  review_text: string | null
  jugador_estrella: string | null
  equipo_local: string | null
  equipo_visitante: string | null
  created_at: string
  profile: {
    username: string
    avatar_url: string | null
  } | null
}

export function FeedGlobal() {
  const [items, setItems]     = useState<ItemFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('match_logs')
          .select(`
            id,
            partido_id,
            rating_partido,
            review_text,
            jugador_estrella,
            equipo_local,
            equipo_visitante,
            created_at,
            profile:profiles!match_logs_user_id_fkey(username, avatar_url)
          `)
          .eq('is_private', false)
          .not('review_text', 'is', null)
          .order('created_at', { ascending: false })
          .limit(12)

        if (fetchError) throw fetchError
        setItems((data as any[]) ?? [])
      } catch (err) {
        console.error('[FeedGlobal] Error:', err)
        setError('No se pudo cargar La Tribuna.')
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()

    const channel = supabase
      .channel('feed_global_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_logs' }, fetchFeed)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return <FeedSkeleton />

  if (error) return (
    <div className="p-8 text-center bg-red-500/5 border border-red-500/10 rounded-3xl">
      <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
    </div>
  )

  if (!items.length) return (
    <div className="p-12 text-center bg-[var(--card-bg)] border border-dashed border-[var(--card-border)] rounded-3xl">
      <p className="text-3xl mb-3">🏟️</p>
      <p className="text-[var(--text-muted)] text-sm font-black italic tracking-tighter">El feed está en silencio.</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-1 opacity-60 uppercase tracking-widest font-bold">
        ¡Sé el primero en dejar una reseña!
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(item => <FeedCard key={item.id} item={item} />)}
    </div>
  )
}

function FeedCard({ item }: { item: ItemFeed }) {
  const username = item.profile?.username ?? 'usuario'
  const avatar   = item.profile?.avatar_url
  const initial  = username.slice(0, 1).toUpperCase()

  return (
    <div className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--accent)]/30 hover:bg-white/[0.02] transition-all">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/perfil/${username}`} className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0">
            {avatar
              ? <img src={avatar} alt={username} className="w-full h-full object-cover" />
              : <span className="text-[10px] font-black text-[var(--accent)]">{initial}</span>
            }
          </div>
          <span className="text-xs font-black italic tracking-tighter text-[var(--foreground)] truncate hover:text-[var(--accent)] transition-colors">
            @{username}
          </span>
        </Link>

        {item.rating_partido != null && (
          <div className="flex items-center gap-1 bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-2 py-0.5 rounded-lg shrink-0">
            <Star size={9} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[11px] font-black text-[var(--accent)]">
              {item.rating_partido.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Texto */}
      {item.review_text && (
        <p className="text-[var(--foreground)] text-xs leading-relaxed font-medium line-clamp-3 opacity-90 flex-1">
          "{item.review_text}"
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]/40">
        <div className="flex items-center gap-2 min-w-0">
          {item.jugador_estrella ? (
            <div className="flex items-center gap-1">
              <Trophy size={9} className="text-yellow-500 shrink-0" />
              <span className="text-[9px] font-black text-yellow-500 uppercase tracking-wider truncate">
                {item.jugador_estrella}
              </span>
            </div>
          ) : (
            <span className="text-[9px] text-[var(--text-muted)] opacity-40 font-bold uppercase tracking-wide">
              {new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>
        <Link
          href={`/partido/${item.partido_id}`}
          className="flex items-center gap-1 text-[var(--accent)] text-[9px] font-black uppercase tracking-widest hover:opacity-70 transition-opacity shrink-0"
        >
          Ver <ArrowRight size={9} />
        </Link>
      </div>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {[1, 2, 3].map(n => (
        <div key={n} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--card-border)] animate-shimmer" />
              <div className="h-2.5 w-20 bg-[var(--card-border)] rounded animate-shimmer" />
            </div>
            <div className="h-5 w-10 bg-[var(--card-border)] rounded-lg animate-shimmer" />
          </div>
          <div className="space-y-1.5">
            <div className="h-2.5 bg-[var(--card-border)] rounded w-full animate-shimmer" />
            <div className="h-2.5 bg-[var(--card-border)] rounded w-4/5 animate-shimmer" />
            <div className="h-2.5 bg-[var(--card-border)] rounded w-2/3 animate-shimmer" />
          </div>
          <div className="flex justify-between pt-2 border-t border-[var(--card-border)]/30">
            <div className="h-2 w-16 bg-[var(--card-border)] rounded animate-shimmer" />
            <div className="h-2 w-8 bg-[var(--card-border)] rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  )
}