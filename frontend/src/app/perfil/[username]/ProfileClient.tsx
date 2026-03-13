'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, UserPlus, UserCheck, Star, Trophy, 
  MessageSquare, Calendar, ArrowRight, Share2 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { UserBadgesGallery } from '@/components/UserBadgesGallery'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useFollows } from '@/hooks/useMatchLogs'
import { useToast } from '@/contexts/ToastContext'
import { ActivityHeatmap } from '@/components/ActivityHeatmap'
import { useProfileFollowers } from '@/hooks/useProfileFollowers'
import { FollowListModal, type FollowListType } from '@/components/FollowListModal'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

type Props = {
  initialProfile: any
  initialStats: any
  initialResenas: any[]
  initialProdes: any[]
}

export function ProfileClient({ initialProfile, initialStats, initialResenas, initialProdes }: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const { isFollowing, toggleFollow } = useFollows()
  const { followersCount, followingCount } = useProfileFollowers(initialProfile.id)
  const supabase = createClient()

  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'activity' | 'stats' | 'listas'>('activity')
  const [followModal, setFollowModal] = useState<FollowListType | null>(null)
  const [listas, setListas] = useState<any[]>([])
  const isOwnProfile = user?.id === initialProfile.id

  useEffect(() => {
    const fetchListas = async () => {
      const { data } = await supabase
        .from('user_lists')
        .select('id, title, description, created_at, items_count:user_list_items(count)')
        .eq('user_id', initialProfile.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
      if (data) setListas(data)
    }
    fetchListas()
  }, [initialProfile.id])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Perfil de ${initialProfile.username} en FutLog`,
          url: window.location.href,
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast('Link copiado al portapapeles', 'success')
    }
  }

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28 pt-10 md:pt-24 px-6">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Cabecera Estilo 2.0 */}
          <div className="relative bg-[var(--card-bg)] rounded-3xl p-8 border border-[var(--card-border)] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
               <div className="absolute -top-10 -right-10 text-[150px] rotate-12">⚽</div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 relative z-10">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-5xl border-4 border-[var(--background)] shadow-xl overflow-hidden shrink-0"
              >
                {initialProfile.avatar_url ? (
                  <img src={initialProfile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-black italic opacity-20">{initialProfile.username?.[0] || '?'}</span>
                )}
              </motion.div>

              <div className="text-center md:text-left flex-1 space-y-4">
                <div className="space-y-1">
                  <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
                    @{initialProfile.username}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                    <button 
                      onClick={() => setFollowModal('followers')}
                      className="hover:text-[var(--accent)] transition-colors"
                    >
                      {followersCount} Seguidores
                    </button>
                    <span>|</span>
                    <button 
                      onClick={() => setFollowModal('following')}
                      className="hover:text-[var(--accent)] transition-colors"
                    >
                      {followingCount} Siguiendo
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {initialProfile.equipo_favorito && (
                    <div className="px-4 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-full text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] flex items-center gap-2">
                       ❤️ {initialProfile.equipo_favorito}
                    </div>
                  )}
                  {initialProfile.bio && (
                    <p className="text-sm font-medium text-[var(--text-muted)] max-w-md">
                      {initialProfile.bio}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                {!isOwnProfile && user && (
                  <Button
                    onClick={() => toggleFollow(initialProfile.id)}
                    variant={isFollowing(initialProfile.id) ? 'outline' : 'primary'}
                    className="flex-1 md:flex-none uppercase tracking-widest text-[10px] font-black h-12 px-8 rounded-2xl"
                  >
                    {isFollowing(initialProfile.id) ? 'Siguiendo' : 'Seguir'}
                  </Button>
                )}
                <button 
                  onClick={handleShare}
                  className="p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl hover:bg-[var(--hover-bg)] transition-all"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'RESEÑAS', value: initialStats?.total_resenas ?? 0, color: 'text-blue-500' },
              { label: 'PRODES', value: initialStats?.total_prodes ?? 0, color: 'text-amber-500' },
              { label: 'PUNTERÍA', value: `${initialStats?.porcentaje_aciertos ?? 0}%`, color: 'text-green-500' },
              { label: 'RATING', value: Number(initialStats?.rating_promedio || 0).toFixed(1), color: 'text-yellow-500' },
            ].map((s) => (
              <div key={s.label} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 text-center">
                <p className={`text-3xl font-black italic tracking-tighter ${s.color}`}>{s.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {isOwnProfile && (
            <Link
              href="/mis-stats"
              className="flex items-center justify-between p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl hover:border-[var(--accent)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                  <TrendingUp size={18} className="text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-black">Mi Resumen 2025</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Tu temporada en números</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
            </Link>
          )}

          {/* Activity Heatmap */}
          <ActivityHeatmap userId={initialProfile.id} />

          {/* Tabs Activity vs Stats */}
          <div className="flex gap-4 border-b border-[var(--card-border)] pb-2 overflow-x-auto no-scrollbar">
             {['activity', 'stats', 'listas'].map((tab) => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all relative
                   ${activeTab === tab ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-50'}`}
               >
                 {tab === 'activity' ? 'Actividad' : tab === 'stats' ? 'Estadísticas' : 'Listas'}
                 {activeTab === tab && (
                   <motion.div layoutId="tab-active" className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--accent)] rounded-full" />
                 )}
               </button>
             ))}
          </div>

          {activeTab === 'activity' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-3">
                   <MessageSquare size={14} /> Reseñas Recientes
                </h2>
                <div className="space-y-4">
                  {initialResenas.map((r) => (
                    <Link key={r.id} href={`/partido/${r.partido_id}`} className="block bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-[var(--accent)] transition-all">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[9px] font-black opacity-60 uppercase tracking-wider">
                            {r.partido
                              ? `${r.partido.equipo_local} ${r.partido.goles_local ?? ''} - ${r.partido.goles_visitante ?? ''} ${r.partido.equipo_visitante}`
                              : `Partido #${r.partido_id}`
                            }
                          </span>
                          <div className="flex gap-0.5">
                            {[...Array(r.rating || 0)].map((_, i) => <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />)}
                          </div>
                       </div>
                       <p className="text-sm font-medium italic">"{r.texto || 'Sin comentario'}"</p>
                    </Link>
                  ))}
                  {initialResenas.length === 0 && <p className="text-xs opacity-30 italic text-center py-10">No hay reseñas todavía.</p>}
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-3">
                   <Trophy size={14} /> Pronósticos
                </h2>
                <div className="space-y-3">
                  {initialProdes.map((p) => (
                    <div key={p.id} className={`p-4 rounded-2xl border ${p.acerto ? 'bg-green-500/5 border-green-500/30' : 'bg-[var(--card-bg)] border-[var(--card-border)]'}`}>
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold">Partido #{p.partido_id}</span>
                          <span className="text-lg font-black tracking-widest tabular-nums">{p.goles_local} - {p.goles_visitante}</span>
                       </div>
                    </div>
                  ))}
                  {initialProdes.length === 0 && <p className="text-xs opacity-30 italic text-center py-10">No hay pronósticos todavía.</p>}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-8">
               <BadgeDisplay stats={{
                 total_logs: initialStats?.total_resenas || 0,
                 reviews_with_text: initialResenas.filter(r => r.texto).length,
                 total_votos: 0,
                 grupos_joined: 0,
                 followers_count: followersCount,
                 total_likes_received: 0,
                 distinct_ligas: 0,
                 prode_aciertos: initialStats?.total_aciertos || 0,
                 neutral_reviews: 0,
                 early_logs: 0,
                 late_logs: 0
               }} />
               <UserBadgesGallery userId={initialProfile.id} isOwnProfile={isOwnProfile} />
            </div>
          )}

          {activeTab === 'listas' && (
            <div className="space-y-4">
              {listas.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[var(--card-border)] rounded-2xl">
                  <p className="text-xs text-[var(--text-muted)] font-bold">
                    {isOwnProfile ? 'No creaste listas todavía.' : 'Este usuario no tiene listas públicas.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listas.map((lista: any) => (
                    <Link key={lista.id} href={`/listas/${lista.id}`}>
                      <div className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl hover:border-[var(--foreground)] transition-all">
                        <h3 className="font-black text-sm mb-1 truncate">{lista.title}</h3>
                        {lista.description && (
                          <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-2">{lista.description}</p>
                        )}
                        <span className="text-[10px] text-[var(--text-muted)] font-bold">
                          {lista.items_count?.[0]?.count || 0} partidos
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {followModal && (
        <FollowListModal
          isOpen={!!followModal}
          userId={initialProfile.id}
          type={followModal}
          title={followModal === 'followers' ? 'Seguidores' : 'Siguiendo'}
          onClose={() => setFollowModal(null)}
        />
      )}
      <NavBar />
    </>
  )
}
