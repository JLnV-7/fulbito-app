'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { DesktopNav } from '@/components/DesktopNav'
import { NavBar } from '@/components/NavBar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { motion } from 'framer-motion'
import { Trophy, Star, Share2, TrendingUp, Calendar, Zap, Download } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'
import { TeamLogo } from '@/components/TeamLogo'
import { useToast } from '@/contexts/ToastContext'
import { toBlob } from 'html-to-image'

export default function MyStatsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const supabase = createClient()
  const [stats, setStats] = useState<any>(null)
  const [topTeam, setTopTeam] = useState<{ name: string; logo?: string; count: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return
      setLoading(true)

      // Stats base
      const { data } = await supabase
        .from('stats_usuario')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Ranking real — cuántos usuarios tienen más reseñas que vos
      const { count: rankingPos } = await supabase
        .from('stats_usuario')
        .select('*', { count: 'exact', head: true })
        .gt('total_resenas', data?.total_resenas || 0)

      // Equipo más visto
      const { data: logsData } = await supabase
        .from('match_logs')
        .select('equipo_local, equipo_visitante, logo_local, logo_visitante')
        .eq('user_id', user.id)

      if (logsData && logsData.length > 0) {
        const teamCount: Record<string, { count: number; logo?: string }> = {}
        logsData.forEach(l => {
          if (l.equipo_local) {
            teamCount[l.equipo_local] = {
              count: (teamCount[l.equipo_local]?.count || 0) + 1,
              logo: l.logo_local || undefined
            }
          }
          if (l.equipo_visitante) {
            teamCount[l.equipo_visitante] = {
              count: (teamCount[l.equipo_visitante]?.count || 0) + 1,
              logo: l.logo_visitante || undefined
            }
          }
        })
        const sorted = Object.entries(teamCount).sort((a, b) => b[1].count - a[1].count)
        if (sorted.length > 0) {
          setTopTeam({
            name: sorted[0][0],
            logo: sorted[0][1].logo,
            count: sorted[0][1].count
          })
        }
      }

      setStats({ ...data, ranking_pos: (rankingPos || 0) + 1 })
      setLoading(false)
    }

    fetchStats()
  }, [user])

  if (loading) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <p className="text-[var(--text-muted)] font-bold">Iniciá sesión para ver tus stats.</p>
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
      value: Number(stats?.rating_promedio || 0).toFixed(1),
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
    },
  ]

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32 md:pt-20">
        <div className="max-w-4xl mx-auto px-6 py-12">

          <div id="stats-wrapped-capture" className="p-4 sm:p-8 rounded-[3rem] bg-[var(--background)] relative">
            {/* Elementos decorativos para la imagen */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

            <header className="text-center mb-10 relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[var(--accent)]/10 text-[var(--accent)] mb-6 shadow-xl"
              >
                <TrendingUp size={40} />
              </motion.div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic mb-3 text-transparent bg-clip-text bg-gradient-to-br from-[var(--foreground)] to-[var(--text-muted)]">
                FUTLOG WRAPPED
              </h1>
              <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs md:text-sm">
                Tu temporada en números
              </p>
            </header>

            {/* Cards de stats */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 mb-8 relative z-10">
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

            {/* Equipo más visto */}
            {topTeam && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 flex items-center gap-4 mb-8"
            >
              <TeamLogo src={topTeam.logo} teamName={topTeam.name} size={56} />
              <div>
                <p className="text-2xl font-black tracking-tighter">{topTeam.name}</p>
                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">
                  Tu equipo más visto · {topTeam.count} partido{topTeam.count !== 1 ? 's' : ''}
                </p>
              </div>
            </motion.div>
            )}
            
            <div className="mt-8 pt-6 border-t border-[var(--card-border)]/50 flex justify-between items-center opacity-50 relative z-10">
               <span className="font-black italic tracking-tighter">FUTLOG APP</span>
               <span className="text-[10px] uppercase font-bold tracking-widest">{user.user_metadata?.full_name || user.email}</span>
            </div>
          </div>

          {/* Compartir */}
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-8 relative overflow-hidden mt-6">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md text-center md:text-left">
                <h2 className="text-3xl font-black tracking-tighter mb-3">Presumí tus números</h2>
                <p className="text-sm text-[var(--text-muted)] font-medium mb-8">
                  Generá una imagen de tu FutLog Wrapped y compartila con tus amigos en WhatsApp o redes sociales.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={async () => {
                      hapticFeedback(50)
                      try {
                        const node = document.getElementById('stats-wrapped-capture')
                        if (!node) return
                        
                        // Añadimos un feedback visual de carga
                        const originalBg = node.style.backgroundColor
                        node.style.backgroundColor = '#0a0a0a' // Forzar fondo oscuro para la captura si es dark mode
                        
                        const blob = await toBlob(node, { 
                            cacheBust: true, 
                            quality: 1,
                            pixelRatio: 2 // Alta calidad
                        })
                        
                        node.style.backgroundColor = originalBg

                        if (!blob) throw new Error('Blob is null')

                        const file = new File([blob], 'futlog-wrapped.png', { type: 'image/png' })
                        
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({
                            title: 'Mi FutLog Wrapped',
                            text: `¡Mirá mi temporada en FutLog! Logueé ${stats?.total_resenas || 0} partidos.`,
                            files: [file]
                          })
                        } else {
                          // Fallback descarga
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = 'futlog-wrapped.png'
                          a.click()
                        }
                      } catch (err) {
                        console.error('Error sharing image:', err)
                        showToast('No pudimos generar la imagen. Intentá de nuevo.', 'error')
                      }
                    }}
                    className="w-full sm:w-auto bg-[var(--accent)] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-[var(--accent)]/20"
                  >
                    <Download size={18} /> Crear Tarjeta
                  </button>
                  <button
                    onClick={() => {
                      hapticFeedback(15)
                      navigator.clipboard.writeText(window.location.href)
                      showToast('Enlace copiado al portapapeles.', 'success')
                    }}
                    className="w-full sm:w-auto bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--foreground)] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all"
                  >
                    <Share2 size={16} /> Copiar Link
                  </button>
                </div>
              </div>
              <div className="w-full md:w-64 aspect-square bg-gradient-to-br from-[var(--accent)] via-[#6366f1] to-purple-600 rounded-3xl rotate-6 shadow-2xl flex items-center justify-center text-white p-8">
                <Trophy size={80} className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
              </div>
            </div>
          </div>

        </div>
      </main>
      <NavBar />
    </>
  )
}