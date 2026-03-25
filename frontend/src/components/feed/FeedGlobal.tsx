import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Hash, Users, Activity } from 'lucide-react'
import { MatchLogCard } from '@/components/MatchLogCard'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import type { MatchLog } from '@/types'

export function FeedGlobal() {
  const { user } = useAuth()
  const [items, setItems] = useState<MatchLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'following'>('all')

  const fetchFeed = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    try {
      let query = supabase
        .from('match_logs')
        .select(`
          id, partido_id, rating_partido, review_text, review_title,
          jugador_estrella, created_at, equipo_local, equipo_visitante,
          goles_local, goles_visitante, is_spoiler, logo_local, logo_visitante,
          match_type, is_private, is_neutral, mood, user_id,
          profile:profiles!match_logs_user_id_fkey(username, avatar_url)
        `)
        .eq('is_private', false)
        .not('review_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30)

      if (activeTab === 'following' && user) {
        // Get following IDs first
        const { data: followingData } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id)
        
        const followingIds = followingData?.map(f => f.following_id) || []
        
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds)
        } else {
          setItems([])
          setLoading(false)
          return
        }
      }

      const { data, error } = await query

      if (error) throw error
      const logs = data as any[]

      // Fetch prode hits for these logs
      if (logs.length > 0) {
        const userIds = Array.from(new Set(logs.map(l => l.user_id)))
        const fixtureIds = Array.from(new Set(logs.map(l => l.partido_id)))

        const { data: prodeHits } = await supabase
          .from('puntuacion_prode')
          .select(`
            tipo_acierto, puntos, user_id,
            partido:partidos!inner(fixture_id)
          `)
          .in('user_id', userIds)
          .in('partido.fixture_id', fixtureIds)

        const itemsWithProde = logs.map(log => {
          const hit = prodeHits?.find(ph => 
            ph.user_id === log.user_id && 
            (ph.partido as any).fixture_id === log.partido_id
          )
          return { ...log, prode_hit: hit?.tipo_acierto, prode_puntos: hit?.puntos }
        })

        setItems(itemsWithProde)
      } else {
        setItems([])
      }
    } catch (err) {
      console.error('[FeedGlobal] Fetch error:', err)
      setError('No se pudo cargar el feed de la tribuna.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, user])

  useEffect(() => {
    fetchFeed()

    const supabase = createClient()
    const channel = supabase
      .channel('feed_global_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'match_logs',
      }, () => fetchFeed())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchFeed])

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

  const handleLike = async (id: string, type: string = 'like') => {
    // Optimistic UI update or full refetch
    // For now we rely on the realtime subscription to fetchFeed or manual update
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1 bg-[var(--card-bg)] p-1 rounded-2xl border border-[var(--card-border)]">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'all' 
                ? 'bg-[var(--accent)] text-white shadow-lg' 
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Activity size={12} />
            Global
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'following' 
                ? 'bg-[var(--accent)] text-white shadow-lg' 
                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            <Users size={12} />
            Siguiendo
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {items.map((item: MatchLog, idx: number) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <MatchLogCard 
              log={item} 
              onLike={handleLike}
            />
          </motion.div>
        ))}
      </AnimatePresence>
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