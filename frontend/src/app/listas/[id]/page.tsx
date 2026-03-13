// src/app/listas/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { TeamLogo } from '@/components/TeamLogo'
import { ChevronRight, Share2, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ListViewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [list, setList] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchListData = async () => {
      setLoading(true)
      const { data: listData, error: listError } = await supabase
        .from('user_lists')
        .select('*, profile:profiles(username, avatar_url)')
        .eq('id', id)
        .single()

      if (listData) {
        setList(listData)
        const { data: itemData } = await supabase
          .from('user_list_items')
          .select('*')
          .eq('list_id', id)
          .order('created_at', { ascending: true })
        
        if (itemData) setItems(itemData)
      }
      setLoading(false)
    }

    if (id) fetchListData()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )

  if (!list) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 text-center">
        <div>
            <h1 className="text-2xl font-black mb-2">Lista no encontrada</h1>
            <button onClick={() => router.push('/')} className="text-[var(--accent)] font-bold">Volver al inicio</button>
        </div>
    </div>
  )

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 md:pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header de la Lista */}
            <div className="mb-10 text-center">
                <span className="text-4xl mb-4 block">{list.icon}</span>
                <h1 className="text-4xl font-black tracking-tighter mb-2">{list.title}</h1>
                <p className="text-[var(--text-muted)] text-sm max-w-lg mx-auto mb-6">{list.description}</p>
                
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[var(--card-border)] flex items-center justify-center text-[10px]">
                            {list.profile?.avatar_url || <User size={12} />}
                        </div>
                        <span className="text-xs font-bold text-[var(--accent)]">@{list.profile?.username}</span>
                    </div>
                    <div className="h-4 w-px bg-[var(--card-border)]" />
                    <button className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                        <Share2 size={14} /> Compartir
                    </button>
                </div>
            </div>

            {/* Items de la Lista */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
                    ⚽ {items.length} Partidos en esta lista
                </h3>
                
                {items.length === 0 ? (
                    <div className="py-20 text-center bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] border-dashed">
                        <p className="text-sm text-[var(--text-muted)] font-bold">Esta lista aún no tiene partidos.</p>
                    </div>
                ) : (
                    items.map((item, i) => {
                        const m = item.match_data || {}
                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Link 
                                    href={`/partido/${item.match_id}`}
                                    className="block bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 hover:border-[var(--accent)]/40 hover:shadow-lg transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="flex items-center gap-3 min-w-[120px] justify-end">
                                                <span className="text-xs font-black truncate">{m.equipo_local}</span>
                                                <TeamLogo src={m.logo_local} teamName={m.equipo_local} size={32} />
                                            </div>
                                            
                                            <div className="bg-[var(--background)] px-3 py-1 rounded-lg border border-[var(--card-border)] shadow-sm font-black text-sm tracking-tighter">
                                                {m.goles_local} - {m.goles_visitante}
                                            </div>

                                            <div className="flex items-center gap-3 min-w-[120px]">
                                                <TeamLogo src={m.logo_visitante} teamName={m.equipo_visitante} size={32} />
                                                <span className="text-xs font-black truncate">{m.equipo_visitante}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-[var(--text-muted)] opacity-30" />
                                    </div>
                                    
                                    {item.note && (
                                        <div className="mt-4 pt-4 border-t border-[var(--card-border)] flex gap-3 italic">
                                            <span className="text-lg leading-none text-[var(--accent)] opacity-50">“</span>
                                            <p className="text-xs font-bold text-[var(--text-muted)] flex-1">{item.note}</p>
                                        </div>
                                    )}
                                </Link>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
      </main>
      <NavBar />
    </>
  )
}
