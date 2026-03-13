// src/app/mis-stats/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Shield, Share2, TrendingUp, Calendar, Zap } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'

export default function MyStatsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [topTeam, setTopTeam] = useState<{ name: string; logo?: string; count: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      setLoading(true)

      // Fetch stats from materialized view or calculate
      const { data } = await supabase
        .from('stats_usuario')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setStats(data)
        
        // Ranking real
        const { count: rankingPos } = await supabase
          .from('stats_usuario')
          .select('*', { count: 'exact', head: true })
          .gt('total_resenas', data.total_resenas || 0)

        setStats((prev: any) => ({ ...prev, ranking_pos: (rankingPos || 0) + 1 }))

        // Equipo más visto
        const { data: logsData } = await supabase
          .from('match_logs')
          .select('equipo_local, equipo_visitante, logo_local, logo_visitante')
          .eq('user_id', user.id)

        if (logsData) {
          const teamCount: Record<string, { count: number; logo?: string }> = {}
          logsData.forEach(l => {
            teamCount[l.equipo_local] = { count: (teamCount[l.equipo_local]?.count || 0) + 1, logo: l.logo_local }
            teamCount[l.equipo_visitante] = { count: (teamCount[l.equipo_visitante]?.count || 0) + 1, logo: l.logo_visitante }
          })
          const topTeamEntry = Object.entries(teamCount).sort((a, b) => b[1].count - a[1].count)[0]
          if (topTeamEntry) {
            setTopTeam({ name: topTeamEntry[0], logo: topTeamEntry[1].logo, count: topTeamEntry[1].count })
          }
        }
      }
      setLoading(false)
    }

    fetchStats()
  }, [user])

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )

  const cards = [
    {
      title: 'Partidos Logueados',
      value: stats?.total_resenas || 0,
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Rating Promedio',
      value: (stats?.rating_promedio || 0).toFixed(1),
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Aciertos Prode',
      value: stats?.prodes_correctos || 0,
      icon: Zap,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Ranking Global',
      value: stats?.ranking_pos ? `#${stats.ranking_pos}` : '—',
      icon: Trophy,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    }
  ]

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 md:pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block p-4 rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)] mb-6"
            >
              <TrendingUp size={48} />
            </motion.div>
            <h1 className="text-5xl font-black tracking-tighter italic mb-4">MI RESUMEN 2025</h1>
            <p className="text-[var(--text-muted)] font-bold tracking-tight">Tu temporada en FutLog en números.</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {cards.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 flex flex-col items-center gap-4 text-center group hover:border-[var(--accent)] transition-all"
                >
                  <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <p className="text-4xl font-black tracking-tighter tabular-nums mb-1">{card.value}</p>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{card.title}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {topTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 flex items-center gap-4 mb-12"
            >
              <img 
                src={topTeam.logo} 
                alt={topTeam.name} 
                className="w-12 h-12 object-contain" 
                onError={e => e.currentTarget.style.display='none'} 
              />
              <div>
                <p className="text-2xl font-black tracking-tighter">{topTeam.name}</p>
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
                  Tu equipo más visto · {topTeam.count} partidos
                </p>
              </div>
            </motion.div>
          )}

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-2xl font-black tracking-tight mb-3">¿Listo para compartir tu pasión?</h2>
                <p className="text-sm text-[var(--text-muted)] font-medium mb-6">Generá una imagen personalizada con tus mejores estadísticas para presumir en tus redes.</p>
                <button
                  onClick={() => { hapticFeedback(50); /* image generation logic */ }}
                  className="w-full md:w-auto bg-[var(--foreground)] text-[var(--background)] px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                >
                  <Share2 size={16} /> Generar Resumen
                </button>
              </div>
              <div className="w-full md:w-64 aspect-square bg-gradient-to-br from-[var(--accent)] to-[#6366f1] rounded-3xl rotate-3 shadow-2xl flex items-center justify-center text-white">
                <Shield size={100} className="drop-shadow-lg" />
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-32 -mt-32" />
          </div>
        </div>
      </main>
      <NavBar />
    </>
  )
}
