// src/components/feed/ProdeAchievementFeed.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Target, Trophy, Zap } from 'lucide-react'

type ProdeAchievement = {
  id: string
  user_id: string
  goles_local_pronostico: number
  goles_visitante_pronostico: number
  created_at: string
  partido: {
    id: string
    equipo_local: string
    equipo_visitante: string
    goles_local: number
    goles_visitante: number
    estado: string
  } | null
  profile: {
    username: string
    avatar_url: string | null
  } | null
}

type AchievementType = 'exact' | 'partial'

function getAchievementType(
  pronostico: ProdeAchievement
): AchievementType | null {
  const p = pronostico.partido
  if (!p || p.estado !== 'FINALIZADO') return null

  const exacto =
    pronostico.goles_local_pronostico === p.goles_local &&
    pronostico.goles_visitante_pronostico === p.goles_visitante

  if (exacto) return 'exact'

  // Partial: acertó el ganador o empate
  const pronoLocal = pronostico.goles_local_pronostico
  const pronoVisit = pronostico.goles_visitante_pronostico
  const pronoResult = pronoLocal > pronoVisit ? 'L' : pronoLocal < pronoVisit ? 'V' : 'E'
  const realResult = p.goles_local > p.goles_visitante ? 'L' : p.goles_local < p.goles_visitante ? 'V' : 'E'

  if (pronoResult === realResult) return 'partial'

  return null
}

export function ProdeAchievementFeed() {
  const [achievements, setAchievements] = useState<(ProdeAchievement & { type: AchievementType })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const { data, error } = await supabase
          .from('pronosticos')
          .select(`
            id,
            user_id,
            goles_local_pronostico,
            goles_visitante_pronostico,
            created_at,
            partido:partidos!pronosticos_partido_id_fkey(id, equipo_local, equipo_visitante, goles_local, goles_visitante, estado),
            profile:profiles!pronosticos_user_id_fkey(username, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        // Filter only achievements (exact or partial)
        const withType = ((data as any[]) ?? [])
          .map(item => {
            const type = getAchievementType(item)
            return type ? { ...item, type } : null
          })
          .filter(Boolean)
          .slice(0, 8) as (ProdeAchievement & { type: AchievementType })[]

        setAchievements(withType)
      } catch (err) {
        console.error('[ProdeAchievementFeed] Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAchievements()
  }, [])

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {[1, 2, 3].map(n => (
          <div key={n} className="min-w-[260px] h-24 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl animate-shimmer shrink-0" />
        ))}
      </div>
    )
  }

  if (achievements.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-[12px] font-bold tracking-tight text-[var(--foreground)] uppercase flex items-center gap-1.5">
          <Target size={13} className="text-green-500" />
          Aciertos del Prode
        </h2>
        <Link
          href="/prode"
          className="text-[9px] font-black text-[var(--accent)] uppercase tracking-widest hover:opacity-70 transition-opacity"
        >
          Ir al Prode →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
        {achievements.map(a => (
          <ProdeAchievementCard key={a.id} achievement={a} />
        ))}
      </div>
    </section>
  )
}

function ProdeAchievementCard({
  achievement: a,
}: {
  achievement: ProdeAchievement & { type: AchievementType }
}) {
  const username = a.profile?.username ?? 'usuario'
  const avatar = a.profile?.avatar_url
  const initial = username.slice(0, 1).toUpperCase()
  const partido = a.partido

  if (!partido) return null

  const isExact = a.type === 'exact'

  return (
    <div className={`min-w-[260px] shrink-0 rounded-2xl border p-3.5 flex flex-col gap-2.5 transition-all ${
      isExact
        ? 'bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/30'
        : 'bg-[var(--card-bg)] border-[var(--card-border)]'
    }`}>
      {/* User + badge */}
      <div className="flex items-center justify-between">
        <Link href={`/perfil/${username}`} className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 border border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0">
            {avatar
              ? <img src={avatar} alt={username} className="w-full h-full object-cover" />
              : <span className="text-[9px] font-black text-[var(--accent)]">{initial}</span>
            }
          </div>
          <span className="text-[11px] font-black italic text-[var(--foreground)] truncate">@{username}</span>
        </Link>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
          isExact
            ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
            : 'bg-green-500/20 text-green-600 dark:text-green-400'
        }`}>
          {isExact ? <><Zap size={9} /> Exacto</> : <><Trophy size={9} /> Acertó</>}
        </div>
      </div>

      {/* Match + prediction */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[var(--foreground)] truncate">
            {partido.equipo_local} vs {partido.equipo_visitante}
          </p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
            Predijo: <span className="font-black">{a.goles_local_pronostico} - {a.goles_visitante_pronostico}</span>
            {' · '}
            Real: <span className="font-black">{partido.goles_local} - {partido.goles_visitante}</span>
          </p>
        </div>
        <Link
          href={`/partido/${partido.id}`}
          className="shrink-0 text-[9px] font-black text-[var(--accent)] uppercase tracking-wider hover:opacity-70"
        >
          Ver →
        </Link>
      </div>
    </div>
  )
}
