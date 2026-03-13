'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Star, Trophy, ArrowRight, User } from 'lucide-react'

type ItemFeed = {
  id: string
  partido_id: number
  rating: number | null
  texto: string
  mvp_jugador_nombre: string | null
  created_at: string
  username: string
  avatar_url: string | null
}

export function FeedGlobal() {
  const [items, setItems] = useState<ItemFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchFeed = async () => {
      try {
        const { data, error } = await supabase
          .from('match_logs')
          .select('*, profiles(username, avatar_url)')
          .order('created_at', { ascending: false })
          .limit(30)

        if (error) throw error
        
        const adaptedData = (data ?? []).map((item: any) => ({
          id: item.id,
          partido_id: item.match_id || item.partido_id,
          rating: item.rating,
          texto: item.content || item.texto,
          mvp_jugador_nombre: item.mvp_name,
          created_at: item.created_at,
          username: item.profiles?.username || 'Anónimo',
          avatar_url: item.profiles?.avatar_url
        }))

        setItems(adaptedData)
      } catch (err) {
        console.error('[FeedGlobal] Fetch error:', err)
        setError('No se pudo cargar el feed de la tribuna.')
      } finally {
        setLoading(false)
      }
    }

    fetchFeed()

    // Realtime: escuchar nuevos logs
    const channel = supabase
      .channel('match_logs_changes')
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
        <div key={item.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 space-y-4 hover:border-[var(--accent)]/30 transition-all group shadow-sm">
          {/* Header: usuario + partido */}
          <div className="flex items-center justify-between">
            <Link
              href={`/perfil/${item.username}`}
              className="flex items-center gap-2 group/user"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                {item.avatar_url ? (
                  <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                ) : (
                  <User size={14} className="text-[var(--accent)]" />
                )}
              </div>
              <span className="text-[var(--foreground)] text-xs font-black italic tracking-tighter group-hover/user:text-[var(--accent)] transition-colors">
                @{item.username}
              </span>
            </Link>
            <Link
              href={`/partido/${item.partido_id}`}
              className="flex items-center gap-1 text-[var(--accent)] text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              Ver partido <ArrowRight size={10} />
            </Link>
          </div>

          {/* Rating */}
          {item.rating && (
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={12} 
                  className={i < item.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 opacity-20'} 
                />
              ))}
            </div>
          )}

          {/* Texto de la reseña */}
          <p className="text-[var(--foreground)] text-sm leading-relaxed font-medium line-clamp-3">
             "{item.texto}"
          </p>

          {/* MVP y fecha */}
          <div className="flex justify-between items-center pt-3 border-t border-[var(--card-border)]/50">
            {item.mvp_jugador_nombre ? (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-lg">
                <Trophy size={10} className="text-green-500" />
                <span className="text-green-500 text-[9px] font-black uppercase tracking-widest">
                  MVP: {item.mvp_jugador_nombre}
                </span>
              </div>
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
          <div className="h-6 bg-[var(--card-border)] rounded w-1/2 mt-4" />
        </div>
      ))}
    </div>
  )
}
