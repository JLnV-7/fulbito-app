'use client'
// src/components/feed/FeedGlobal.tsx

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Star, Trophy, ArrowRight, Users, Heart, Globe, Crown } from 'lucide-react'
import { motion } from 'framer-motion'
import { hapticFeedback } from '@/lib/helpers'

type FeedTab = 'todos' | 'amigos' | 'mi-equipo'

type ItemFeed = {
  id: string
  user_id: string
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
    is_pro?: boolean
  } | null
}

export function FeedGlobal() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<FeedTab>('todos')
  const [items, setItems]     = useState<ItemFeed[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Cache de IDs de amigos y equipo favorito
  const [followedIds, setFollowedIds] = useState<string[]>([])
  const [equipoFavorito, setEquipoFavorito] = useState<string | null>(null)

  // Cargar follows y equipo favorito del usuario logueado
  useEffect(() => {
    if (!user) return
    const loadUserContext = async () => {
      const [followsRes, profileRes] = await Promise.all([
        supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
        supabase.from('profiles').select('equipo_favorito').eq('id', user.id).single(),
      ])
      if (followsRes.data) {
        setFollowedIds(followsRes.data.map(f => f.following_id))
      }
      if (profileRes.data?.equipo_favorito) {
        setEquipoFavorito(profileRes.data.equipo_favorito)
      }
    }
    loadUserContext()
  }, [user])

  const fetchFeed = useCallback(async (tab: FeedTab) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('match_logs')
        .select(`
          id,
          user_id,
          partido_id,
          rating_partido,
          review_text,
          jugador_estrella,
          equipo_local,
          equipo_visitante,
          created_at,
          profile:profiles!match_logs_user_id_fkey(username, avatar_url, is_pro)
        `)
        .eq('is_private', false)
        .not('review_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(18)

      if (tab === 'amigos' && followedIds.length > 0) {
        query = query.in('user_id', followedIds)
      } else if (tab === 'amigos' && followedIds.length === 0) {
        // Sin amigos → vacío
        setItems([])
        setLoading(false)
        return
      }

      if (tab === 'mi-equipo' && equipoFavorito) {
        query = query.or(`equipo_local.eq.${equipoFavorito},equipo_visitante.eq.${equipoFavorito}`)
      } else if (tab === 'mi-equipo' && !equipoFavorito) {
        setItems([])
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setItems((data as any[]) ?? [])
    } catch (err) {
      console.error('[FeedGlobal] Error:', err)
      setError('No se pudo cargar La Tribuna.')
    } finally {
      setLoading(false)
    }
  }, [followedIds, equipoFavorito])

  // Fetch cuando cambia el tab o los datos de contexto
  useEffect(() => {
    fetchFeed(activeTab)
  }, [activeTab, fetchFeed])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('feed_global_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'match_logs' }, () => fetchFeed(activeTab))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeTab, fetchFeed])

  const handleTabChange = (tab: FeedTab) => {
    hapticFeedback(5)
    setActiveTab(tab)
  }

  const TABS: { id: FeedTab; label: string; icon: React.ReactNode; requiresAuth?: boolean }[] = [
    { id: 'todos', label: 'Todos', icon: <Globe size={12} /> },
    { id: 'amigos', label: 'Amigos', icon: <Users size={12} />, requiresAuth: true },
    { id: 'mi-equipo', label: 'Mi equipo', icon: <Heart size={12} />, requiresAuth: true },
  ]

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1.5">
        {TABS.map(tab => {
          if (tab.requiresAuth && !user) return null
          const isActive = activeTab === tab.id
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all border
                ${isActive
                  ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm'
                  : 'bg-[var(--card-bg)] text-[var(--text-muted)] border-[var(--card-border)] hover:text-[var(--foreground)]'
                }`}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          )
        })}
      </div>

      {/* Content */}
      {loading ? (
        <FeedSkeleton />
      ) : error ? (
        <div className="p-8 text-center bg-red-500/5 border border-red-500/10 rounded-3xl">
          <p className="text-red-400 text-xs font-black uppercase tracking-widest">{error}</p>
        </div>
      ) : !items.length ? (
        <EmptyState tab={activeTab} hasEquipo={!!equipoFavorito} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(item => <FeedCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}

function EmptyState({ tab, hasEquipo }: { tab: FeedTab; hasEquipo: boolean }) {
  const messages: Record<FeedTab, { emoji: string; title: string; sub: string }> = {
    'todos': { emoji: '🏟️', title: 'El feed está en silencio.', sub: '¡Sé el primero en dejar una reseña!' },
    'amigos': { emoji: '👥', title: 'Tus amigos no ratearon nada todavía.', sub: 'Seguí a más gente para llenar tu feed.' },
    'mi-equipo': {
      emoji: '❤️',
      title: hasEquipo ? 'No hay reseñas de tu equipo todavía.' : 'No tenés equipo favorito.',
      sub: hasEquipo ? 'Rateá el próximo partido y aparecé acá.' : 'Configuralo en tu perfil para ver reseñas de tu equipo.',
    },
  }
  const m = messages[tab]
  return (
    <div className="p-12 text-center bg-[var(--card-bg)] border border-dashed border-[var(--card-border)] rounded-3xl">
      <p className="text-3xl mb-3">{m.emoji}</p>
      <p className="text-[var(--text-muted)] text-sm font-black italic tracking-tighter">{m.title}</p>
      <p className="text-[10px] text-[var(--text-muted)] mt-1 opacity-60 uppercase tracking-widest font-bold">{m.sub}</p>
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
          <span className="text-xs font-black italic tracking-tighter text-[var(--foreground)] truncate hover:text-[var(--accent)] transition-colors flex items-center gap-1">
            @{username}
            {item.profile?.is_pro && <Crown size={12} className="text-yellow-400 fill-yellow-400" />}
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