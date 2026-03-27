// src/components/FeaturedLists.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Share2, List, ArrowRight } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'

type FeaturedList = {
  id: string
  title: string
  description: string | null
  user_id: string
  created_at: string
  profile: {
    username: string
    avatar_url: string | null
  } | null
  items: { id: string }[]
}

export function FeaturedLists() {
  const [lists, setLists] = useState<FeaturedList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data, error } = await supabase
          .from('user_lists')
          .select(`
            id,
            title,
            description,
            user_id,
            created_at,
            profile:profiles!user_lists_user_id_fkey(username, avatar_url),
            items:user_list_items(id)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(8)

        if (error) throw error
        // Only show lists with at least 1 item
        const withItems = (data as any[] ?? []).filter((l: any) => l.items && l.items.length > 0)
        setLists(withItems)
      } catch (err) {
        console.error('[FeaturedLists] Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleShare = async (list: FeaturedList) => {
    hapticFeedback(10)
    const url = `${window.location.origin}/listas/${list.id}`
    const text = `📋 "${list.title}" — una lista de partidos en FutLog`

    if (navigator.share) {
      try {
        await navigator.share({ title: list.title, text, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {[1, 2, 3].map(n => (
          <div key={n} className="min-w-[240px] h-28 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-shimmer shrink-0" />
        ))}
      </div>
    )
  }

  if (lists.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] uppercase">
            📋 Listas de la semana
          </h2>
        </div>
        <Link
          href="/listas"
          className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest hover:opacity-70 transition-opacity"
        >
          Ver todas →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {lists.map(list => {
          const username = list.profile?.username ?? 'usuario'
          const avatar = list.profile?.avatar_url
          const initial = username.slice(0, 1).toUpperCase()
          const itemCount = list.items?.length ?? 0

          return (
            <div
              key={list.id}
              className="min-w-[260px] shrink-0 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex flex-col gap-3 hover:border-[var(--accent)]/30 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <Link href={`/listas/${list.id}`}>
                    <h3 className="text-sm font-black text-[var(--foreground)] truncate group-hover:text-[var(--accent)] transition-colors">
                      {list.title}
                    </h3>
                  </Link>
                  {list.description && (
                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      {list.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleShare(list)}
                  className="shrink-0 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
                  title="Compartir lista"
                >
                  <Share2 size={13} />
                </button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--accent)]/10 border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0">
                    {avatar
                      ? <img src={avatar} alt={username} className="w-full h-full object-cover" />
                      : <span className="text-[8px] font-black text-[var(--accent)]">{initial}</span>
                    }
                  </div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] truncate">@{username}</span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider">
                  <List size={10} />
                  {itemCount} {itemCount === 1 ? 'partido' : 'partidos'}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
