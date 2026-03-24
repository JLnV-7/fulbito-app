// src/app/perfil/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { FeedbackWidget } from '@/components/FeedbackWidget'
import { ChallengesFAB } from '@/components/ChallengesFAB'
import { NotificationSettings } from '@/components/NotificationSettings'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback, getTeamColor } from '@/lib/helpers'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useProfileFollowers } from '@/hooks/useProfileFollowers'
import { FollowListModal, type FollowListType } from '@/components/FollowListModal'
import type { Profile, UserStats } from '@/types'
import type { BadgeStats } from '@/lib/badges'
import { AvatarUploader } from '@/components/perfil/AvatarUploader'
import { EquipoSelector } from '@/components/perfil/EquipoSelector'
import { UserStatsCard } from '@/components/UserStatsCard'
import { TopPartidos } from '@/components/TopPartidos'
import { StatsRadar, buildRadarStats } from '@/components/StatsRadar'
import { UserListsView } from '@/components/UserListsView'
import { UserBadgesGallery } from '@/components/UserBadgesGallery'
import { WeeklyChallenges } from '@/components/WeeklyChallenges'
import { ShareButton } from '@/components/ShareButton'
import { ProfileQRModal } from '@/components/perfil/ProfileQRModal'
import { ProfileAccordion } from '@/components/perfil/ProfileAccordion'
import { RatingPieChart } from '@/components/perfil/RatingPieChart'
import { PushDebug } from '@/components/PushDebug'
import { Button } from '@/components/ui/Button'
import { BuildXI } from '@/components/perfil/BuildXI'
import { MatchDiary } from '@/components/perfil/MatchDiary'
import { useMatchLogs } from '@/hooks/useMatchLogs'
import { Settings, Edit3, QrCode, LogOut, Users, BarChart2, BookOpen, ChevronRight, Search, Trophy } from 'lucide-react'

type ProfileTab = 'social' | 'stats' | 'ajustes'

export default function Perfil() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { followersCount, followingCount } = useProfileFollowers(user?.id || '')

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    partidos_vistos: 0,
    promedio_general: 0,
    total_votos: 0
  })
  const [prodeStats, setProdeStats] = useState<{ user_id: string; puntos_totales: number; aciertos_exactos: number; aciertos_parciales: number } | null>(null)
  const [loading, setLoading] = useState(true)

  const [showEditor, setShowEditor] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editEquipo, setEditEquipo] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [activeTab, setActiveTab] = useState<ProfileTab>('social')
  const { syncOfflineLogs } = useMatchLogs()
  const [syncing, setSyncing] = useState(false)
  const [badgeStats, setBadgeStats] = useState<BadgeStats>({
    total_logs: 0, reviews_with_text: 0, total_votos: 0,
    grupos_joined: 0, followers_count: 0, total_likes_received: 0,
    distinct_ligas: 0, prode_aciertos: 0, neutral_reviews: 0,
    early_logs: 0, late_logs: 0,
  })

  const [followModalState, setFollowModalState] = useState<{
    isOpen: boolean;
    type: FollowListType;
    title: string;
  }>({ isOpen: false, type: 'followers', title: '' })

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error && error.code !== 'PGRST116') throw error

        if (data) {
          setProfile(data)
          setEditUsername(data.username || '')
          setEditEquipo(data.equipo || '')
          setEditAvatar(data.avatar_url || '👤')

          try {
            const { data: statsData } = await supabase
              .rpc('get_user_stats', { user_id_param: user.id })
            if (statsData && statsData[0]) {
              setStats({
                partidos_vistos: statsData[0].partidos_vistos || 0,
                promedio_general: statsData[0].promedio_general || 0,
                total_votos: statsData[0].total_votos || 0
              })
            }
          } catch { console.log('Stats no disponibles') }

          try {
            const { data: prodeData } = await supabase
              .from('ranking_prode').select('*').eq('user_id', user.id).single()
            if (prodeData) setProdeStats(prodeData)
          } catch { console.log('Prode stats no disponibles') }
        }

        try {
          const { data: votosAmigos } = await supabase
            .from('votos_partido_amigo').select('nota').eq('user_id', user.id)
          if (votosAmigos) {
            const totalVotos = votosAmigos.length
            const promedio = totalVotos > 0
              ? votosAmigos.reduce((acc, curr) => acc + curr.nota, 0) / totalVotos : 0
            setStats(prev => ({ ...prev, friend_matches_votes: totalVotos, friend_matches_average: promedio }))
          }
        } catch (err: any) { console.error('Error stats amigos:', err) }

        try {
          const [logsRes, votosRes, gruposRes, followersRes, likesRes] = await Promise.all([
            supabase.from('match_logs').select('id, review_text, liga, is_neutral, created_at').eq('user_id', user.id),
            supabase.from('votaciones').select('id').eq('user_id', user.id),
            supabase.from('miembros_grupo').select('id').eq('user_id', user.id),
            supabase.from('user_follows').select('id').eq('following_id', user.id),
            supabase.from('match_log_likes').select('id').eq('match_log_id', user.id),
          ])
          const logs = logsRes.data || []
          const distinctLigas = new Set(logs.map(l => l.liga).filter(Boolean)).size
          const reviewsWithText = logs.filter(l => l.review_text && l.review_text.length > 0).length
          const neutralReviews = logs.filter(l => l.is_neutral).length
          const earlyLogs = logs.filter(l => new Date(l.created_at).getHours() < 10).length
          const lateLogs = logs.filter(l => { const h = new Date(l.created_at).getHours(); return h >= 0 && h < 5 }).length
          setBadgeStats({
            total_logs: logs.length, reviews_with_text: reviewsWithText,
            total_votos: votosRes.data?.length || 0, grupos_joined: gruposRes.data?.length || 0,
            followers_count: followersRes.data?.length || 0, total_likes_received: likesRes.data?.length || 0,
            distinct_ligas: distinctLigas,
            prode_aciertos: prodeStats ? (prodeStats.aciertos_exactos + (prodeStats.aciertos_parciales || 0)) : 0,
            neutral_reviews: neutralReviews, early_logs: earlyLogs, late_logs: lateLogs,
          })
        } catch (err: any) { console.error('Error badge stats:', err) }
      } catch (error) {
        console.error('Error cargando perfil:', error)
      } finally {
        setLoading(false)
      }
    }
    if (!authLoading) cargarPerfil()
  }, [user, authLoading, router])

  const handleSignOut = async () => {
    try { await signOut(); router.push('/login') }
    catch (error) { console.error('Error al cerrar sesión:', error) }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaveMessage('')
    try {
      const updates = {
        username: editUsername.trim(),
        equipo: editEquipo.trim(),
        avatar_url: editAvatar,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('profiles').upsert({ id: user.id, ...updates })
      if (error) throw error
      setProfile(prev => ({ ...prev!, ...updates }))
      setSaveMessage('Cambios guardados correctamente')
      setTimeout(() => { setShowEditor(false); setSaveMessage('') }, 1500)
    } catch (error) {
      console.error('Error guardando perfil:', error)
      setSaveMessage('No pudimos guardar los datos. Intentá de nuevo')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <DesktopNav />
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28 md:pt-16">
          {/* Skeleton banner */}
          <div className="h-32 w-full bg-[var(--card-border)] animate-pulse" />
          <div className="px-5 pb-4">
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="w-24 h-24 rounded-3xl border-4 border-[var(--background)] bg-[var(--card-bg)] animate-pulse" />
              <div className="w-20 h-9 rounded-2xl bg-[var(--card-bg)] animate-pulse" />
            </div>
            <div className="h-6 w-40 bg-[var(--card-bg)] rounded-xl animate-pulse mb-2" />
            <div className="h-4 w-28 bg-[var(--card-bg)] rounded-xl animate-pulse mb-4" />
            <div className="h-1.5 w-full bg-[var(--card-border)] rounded-full mb-5" />
            <div className="grid grid-cols-3 gap-3">
              {[0,1,2].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse" />
              ))}
            </div>
          </div>
        </main>
        <NavBar />
      </>
    )
  }

  if (!user) {
    return (
      <>
        <DesktopNav />
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 right-10 text-8xl">⚽</div>
            <div className="absolute bottom-20 left-10 text-6xl">🏆</div>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center relative z-10 max-w-sm">
            <div className="text-6xl mb-6">👤</div>
            <h1 className="text-3xl font-black italic tracking-tighter mb-3">Tu Perfil</h1>
            <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
              Iniciá sesión para ver tus partidos logeados, estadísticas y conectar con otros fanáticos.
            </p>
            <Link href="/login" className="inline-block bg-[var(--accent)] text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:brightness-110 transition-all">
              Iniciar Sesión
            </Link>
          </motion.div>
          <NavBar />
        </main>
      </>
    )
  }

  // Color del equipo para el banner
  const teamColor = profile?.equipo ? getTeamColor(profile.equipo) : '#16a34a'
  const level = profile?.level || 1
  const xp = profile?.xp || 0
  const xpForNext = level * 100

  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'social', label: 'Perfil', icon: <BookOpen size={15} /> },
    { id: 'stats', label: 'Estadísticas', icon: <BarChart2 size={15} /> },
    { id: 'ajustes', label: 'Ajustes', icon: <Settings size={15} /> },
  ]

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28 md:pt-16">

        {/* ── HEADER TIPO RED SOCIAL ── */}
        <div className="relative">
          {/* Banner de color del equipo */}
          <div
            className="h-32 w-full"
            style={{
              background: `linear-gradient(135deg, ${teamColor}cc 0%, ${teamColor}44 100%)`,
            }}
          />

          {/* Acciones top-right */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setShowQRModal(true)}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-all border border-white/10"
            >
              <QrCode size={18} />
            </button>
            <button
              onClick={() => setActiveTab('ajustes')}
              className="p-2.5 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 transition-all border border-white/10"
            >
              <Settings size={18} />
            </button>
          </div>

          {/* Avatar grande — sobresale del banner */}
          <div className="px-6 pb-4">
            <div className="flex items-end justify-between -mt-14 mb-4">
              <div className="relative">
                <button
                  onClick={() => setActiveTab('ajustes')}
                  className="w-28 h-28 rounded-full border-4 border-[var(--background)] shadow-2xl flex items-center justify-center text-5xl overflow-hidden relative group cursor-pointer bg-[var(--card-bg)]"
                >
                  {profile?.avatar_url?.startsWith('http') ? (
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{profile?.avatar_url || '👤'}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 size={24} className="text-white" />
                  </div>
                </button>
                {/* Badge de nivel */}
                <div
                  className="absolute bottom-1 -right-1 px-2.5 py-0.5 rounded-full text-[11px] font-black text-white shadow-xl border-2 border-[var(--background)]"
                  style={{ background: teamColor }}
                >
                  LVL {level}
                </div>
              </div>

              {/* Botón salir */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-muted)] text-xs font-bold hover:bg-[var(--hover-bg)] transition-all mb-2"
              >
                <LogOut size={14} />
                Salir
              </button>
            </div>

            {/* Nombre y equipo */}
            <div className="mb-5">
              <h1 className="text-2xl font-black tracking-tight">{profile?.username || 'Usuario'}</h1>
              {profile?.equipo && (
                <p className="text-sm font-bold mt-0.5" style={{ color: teamColor }}>
                  ❤️ {profile.equipo}
                </p>
              )}
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{user.email}</p>
            </div>

            {/* XP bar */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Progreso</span>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">{xp} / {xpForNext} XP</span>
              </div>
              <div className="h-2 bg-[var(--card-border)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((xp / xpForNext) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: teamColor }}
                />
              </div>
            </div>

            {/* Stats sociales — seguidores / siguiendo / partidos */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              <button
                onClick={() => setFollowModalState({ isOpen: true, type: 'followers', title: 'Seguidores' })}
                className="flex flex-col items-center p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--card-border-hover)] transition-all active:scale-95 shadow-sm"
              >
                <span className="text-xl font-black">{followersCount}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">Seguidores</span>
              </button>
              <button
                onClick={() => setFollowModalState({ isOpen: true, type: 'following', title: 'Siguiendo' })}
                className="flex flex-col items-center p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--card-border-hover)] transition-all active:scale-95 shadow-sm"
              >
                <span className="text-xl font-black">{followingCount}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">Siguiendo</span>
              </button>
              <div className="flex flex-col items-center p-3 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)] shadow-sm">
                <span className="text-xl font-black">{stats.partidos_vistos}</span>
                <span className="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">Partidos</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="sticky top-0 md:top-16 z-30 bg-[var(--background)]/95 backdrop-blur-xl border-b border-[var(--card-border)]">
          <div className="flex px-4 max-w-2xl mx-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { hapticFeedback(5); setActiveTab(tab.id) }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all relative ${
                  activeTab === tab.id
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeProfileTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--foreground)]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENIDO ── */}
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >

              {/* ── TAB PERFIL / SOCIAL ── */}
              {activeTab === 'social' && (
                <div className="space-y-5">
                  <MatchDiary userId={user.id} />
                  <TopPartidos userId={user.id} />
                  <UserListsView userId={user.id} isOwnProfile={true} />
                  <UserBadgesGallery userId={user.id} isOwnProfile={true} />
                  <BuildXI />
                </div>
              )}

              {/* ── TAB ESTADÍSTICAS ── */}
              {activeTab === 'stats' && (
                <div className="space-y-5">
                  {/* Stats rápidas */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Promedio General', value: stats.promedio_general?.toFixed(1) || '–', emoji: '⭐' },
                      { label: 'Total Votos', value: stats.total_votos || 0, emoji: '🗳️' },
                      { label: 'Votos Amigos', value: stats.friend_matches_votes || 0, emoji: '⚽' },
                      { label: 'Prom. Amigos', value: stats.friend_matches_average?.toFixed(1) || '–', emoji: '📊' },
                    ].map((s, i) => (
                      <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{s.emoji}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">{s.label}</span>
                        </div>
                        <p className="text-2xl font-black">{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {prodeStats && (
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">🎯 Prode</p>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-2xl font-black">{prodeStats.puntos_totales}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Puntos</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black">{prodeStats.aciertos_exactos}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Exactos</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black">{prodeStats.aciertos_parciales || 0}</p>
                          <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">Parciales</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <UserStatsCard stats={stats} prodeStats={prodeStats || null} />
                  <StatsRadar stats={buildRadarStats({ ...stats, prode_puntos: prodeStats?.puntos_totales })} />
                  <RatingPieChart userId={user.id} />
                </div>
              )}

              {/* ── TAB AJUSTES ── */}
              {activeTab === 'ajustes' && (
                <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  
                  {/* Editar Perfil */}
                  <section>
                    <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-4 mb-3">
                      Perfil Público
                    </h3>
                    <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-sm">
                      <div className="p-5 flex flex-col items-center gap-4 border-b border-[var(--card-border)]/50">
                        <AvatarUploader
                          currentAvatarUrl={editAvatar}
                          onUploadSuccess={setEditAvatar}
                        />
                        <p className="text-[10px] text-[var(--text-muted)] font-medium text-center max-w-[200px]">
                          Tocá la imagen para cambiar tu foto
                        </p>
                      </div>
                      <div className="p-5 space-y-5">
                        <div className="group">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block group-focus-within:text-[var(--foreground)] transition-colors">
                            Usuario
                          </label>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={e => setEditUsername(e.target.value)}
                            className="w-full bg-[var(--background)]/50 border border-[var(--card-border)] rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                            placeholder="Tu nombre de usuario"
                          />
                        </div>
                        <div className="group">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 block group-focus-within:text-[var(--foreground)] transition-colors">
                            Equipo del corazón
                          </label>
                          <EquipoSelector
                            selectedEquipo={editEquipo}
                            onSelect={setEditEquipo}
                          />
                        </div>
                        
                        {saveMessage && (
                          <div className={`px-4 py-3 rounded-xl border text-xs font-bold text-center ${
                            saveMessage.includes('Error') || saveMessage.includes('No') 
                              ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                              : 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]'
                          }`}>
                            {saveMessage}
                          </div>
                        )}
                        
                        <button
                          onClick={handleSaveProfile}
                          disabled={saving}
                          className="w-full bg-[var(--foreground)] text-[var(--background)] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:hover:scale-100"
                        >
                          {saving ? '⏳ Guardando...' : 'Guardar Cambios'}
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Preferencias de la App */}
                  <section>
                    <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-4 mb-3">
                      Preferencias
                    </h3>
                    <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-sm divide-y divide-[var(--card-border)]/50">
                      
                      {/* Tema */}
                      <div className="flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--background)] flex items-center justify-center border border-[var(--card-border)]">
                            {theme === 'dark' ? '🌙' : '☀️'}
                          </div>
                          <div>
                            <p className="text-sm font-bold">Apariencia</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium">Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</p>
                          </div>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className="px-4 py-2 rounded-full border border-[var(--card-border)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--background)] transition-all active:scale-95"
                        >
                          Cambiar
                        </button>
                      </div>

                      {/* Idioma */}
                      <div className="flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--background)] flex items-center justify-center border border-[var(--card-border)]">
                            🌍
                          </div>
                          <div>
                            <p className="text-sm font-bold">Idioma</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium">Global</p>
                          </div>
                        </div>
                        <select
                          value={language}
                          onChange={e => setLanguage(e.target.value as any)}
                          className="bg-[var(--background)] border border-[var(--card-border)] rounded-full px-3 py-2 text-[10px] font-black uppercase focus:outline-none focus:border-[var(--accent)] transition-all cursor-pointer"
                        >
                          <option value="es">🇦🇷 Español</option>
                          <option value="en">🇺🇸 English</option>
                          <option value="pt">🇧🇷 Português</option>
                        </select>
                      </div>

                      {/* Notificaciones */}
                      <div className="p-4">
                        <NotificationSettings />
                      </div>

                      {/* Desafíos */}
                      <div className="p-4">
                        <ChallengesFAB inline={true} />
                      </div>
                    </div>
                  </section>

                  {/* Acciones */}
                  <section>
                    <h3 className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest pl-4 mb-3">
                      Acciones
                    </h3>
                    <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] rounded-3xl overflow-hidden shadow-sm divide-y divide-[var(--card-border)]/50">
                      
                      {/* QR */}
                      <button
                        onClick={() => setShowQRModal(true)}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors active:bg-[var(--card-border)]/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                            📱
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold">Compartir Perfil</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium">Mostrar mi código QR</p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--text-muted)]" />
                      </button>

                      {/* Sync */}
                      <button
                        onClick={async () => {
                          setSyncing(true)
                          try { await syncOfflineLogs() }
                          finally { setSyncing(false) }
                        }}
                        disabled={syncing}
                        className="w-full flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors active:bg-[var(--card-border)]/50 disabled:opacity-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20">
                            🔄
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold">Sincronizar Offline</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-medium">Subir partidos pendientes</p>
                          </div>
                        </div>
                        {syncing ? <LoadingSpinner /> : <ChevronRight size={18} className="text-[var(--text-muted)]" />}
                      </button>

                      {/* Feedback */}
                      <FeedbackWidget inline={true} />
                    </div>
                  </section>

                  {/* Cerrar sesión */}
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl border border-red-500/20 bg-red-500/5 text-red-500 font-black text-[11px] uppercase tracking-widest hover:bg-red-500/10 active:scale-95 transition-all"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modales */}
        <AnimatePresence>
          {showQRModal && profile && (
            <ProfileQRModal
              isOpen={showQRModal}
              username={profile?.username || ''}
              userId={profile?.id || ''}
              onClose={() => setShowQRModal(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {followModalState.isOpen && (
            <FollowListModal
              isOpen={followModalState.isOpen}
              userId={user.id}
              type={followModalState.type}
              title={followModalState.title}
              onClose={() => setFollowModalState(prev => ({ ...prev, isOpen: false }))}
            />
          )}
        </AnimatePresence>

      </main>
      <NavBar />
    </>
  )
}