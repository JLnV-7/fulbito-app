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

  // Estado del editor
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

  // Estado del modal de seguidores
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

        if (error && error.code !== 'PGRST116') {
          throw error
        }

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
          } catch (statsError) {
            console.log('Stats de votos no disponibles')
          }

          try {
            const { data: prodeData } = await supabase
              .from('ranking_prode')
              .select('*')
              .eq('user_id', user.id)
              .single()

            if (prodeData) {
              setProdeStats(prodeData)
            }
          } catch (prodeError) {
            console.log('Stats de prode no disponibles')
          }
        }

        // Fetch Friend Match Stats
        try {
          const { data: votosAmigos } = await supabase
            .from('votos_partido_amigo')
            .select('nota')
            .eq('user_id', user.id)

          if (votosAmigos) {
            const totalVotos = votosAmigos.length
            const promedio = totalVotos > 0
              ? votosAmigos.reduce((acc, curr) => acc + curr.nota, 0) / totalVotos
              : 0

            setStats(prev => ({
              ...prev,
              friend_matches_votes: totalVotos,
              friend_matches_average: promedio
            }))
          }
        } catch (err: any) {
          console.error('Error cargando stats de amigos:', err)
        }

        // Fetch Badge Stats
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
          const earlyLogs = logs.filter(l => {
            const h = new Date(l.created_at).getHours()
            return h < 10
          }).length
          const lateLogs = logs.filter(l => {
            const h = new Date(l.created_at).getHours()
            return h >= 0 && h < 5
          }).length

          setBadgeStats({
            total_logs: logs.length,
            reviews_with_text: reviewsWithText,
            total_votos: votosRes.data?.length || 0,
            grupos_joined: gruposRes.data?.length || 0,
            followers_count: followersRes.data?.length || 0,
            total_likes_received: likesRes.data?.length || 0,
            distinct_ligas: distinctLigas,
            prode_aciertos: prodeStats ? (prodeStats.aciertos_exactos + (prodeStats.aciertos_parciales || 0)) : 0,
            neutral_reviews: neutralReviews,
            early_logs: earlyLogs,
            late_logs: lateLogs,
          })
        } catch (err: any) {
          console.error('Error cargando badge stats:', err)
        }
      } catch (error) {
        console.error('Error cargando perfil:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      cargarPerfil()
    }
  }, [user, authLoading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
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

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates
        })

      if (error) throw error

      setProfile(prev => ({
        ...prev!,
        ...updates
      }))

      setSaveMessage('Cambios guardados correctamente')

      setTimeout(() => {
        setShowEditor(false)
        setSaveMessage('')
      }, 1500)
    } catch (error) {
      console.error('Error guardando perfil:', error)
      setSaveMessage('No pudimos cargar los datos. Intentá de nuevo')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <DesktopNav />
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20 flex flex-col items-center justify-center px-6 relative overflow-hidden">
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 right-10 text-8xl">⚽</div>
            <div className="absolute bottom-20 left-10 text-6xl">🏆</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl blur-sm opacity-50">🌟</div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 w-full max-w-md bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)] rounded-3xl p-8 text-center shadow-2xl"
          >
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-[var(--accent-green)] to-[var(--accent-blue)] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[var(--accent-green)]/20">
              <span className="text-4xl text-white">🔒</span>
            </div>

            <h1 className="text-2xl font-black mb-3 bg-gradient-to-r from-[var(--accent-green)] to-[var(--accent-blue)] bg-clip-text text-transparent">
              {t('profile.title')}
            </h1>

            <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
              Iniciá sesión para llevar un registro de tus partidos, ganar XP, desbloquear medallas y subir de nivel.
            </p>

            <div className="space-y-4 mb-8 text-left max-w-[250px] mx-auto text-sm">
              <div className="flex items-center gap-3"><span className="text-xl">📊</span> Stats de tus rateos</div>
              <div className="flex items-center gap-3"><span className="text-xl">🎖️</span> Grid de Badges</div>
              <div className="flex items-center gap-3"><span className="text-xl">🏆</span> Rango en el Prode</div>
            </div>

            <Button
              onClick={() => router.push('/login')}
              fullWidth
              size="lg"
            >
              Iniciar sesión
            </Button>
          </motion.div>
        </main>
        <NavBar />
      </>
    )
  }

  // Cálculos de XP y Nivel
  const userLevel = profile?.level || 1
  const userXp = profile?.xp || 0
  const currentLevelXp = Math.pow(userLevel - 1, 2) * 100
  const nextLevelXp = Math.pow(userLevel, 2) * 100
  const xpProgress = Math.min(100, Math.max(0, ((userXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))

  return (
    <>
      <DesktopNav />
      {/* Modals outside the flow */}
      <ProfileQRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        userId={user?.id || ''}
        username={profile?.username || 'Usuario'}
      />

      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">

        {/* Hero Header - Bento Grid Style */}
        <div className="bg-[var(--card-bg)] pt-6 pb-8 px-4 md:px-6 border-b border-[var(--card-border)] relative overflow-hidden">
          {profile?.equipo && (
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-60 blur-[100px] pointer-events-none opacity-20 dark:opacity-[0.15]"
              style={{ backgroundColor: getTeamColor(profile.equipo) }}
            />
          )}
          
          <div className="max-w-4xl mx-auto relative z-10 flex flex-col gap-5">
            {/* Top Toolbar */}
            <div className="flex justify-between items-center w-full">
              <button onClick={() => router.push('/')} className="border border-[var(--card-border)] p-2 bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all rounded-full w-9 h-9 flex items-center justify-center shadow-sm">
                ←
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="border border-[var(--card-border)] p-2 bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all rounded-full w-9 h-9 flex items-center justify-center shadow-sm"
                  aria-label="QR"
                  title="Código QR"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></svg>
                </button>
                <button
                  onClick={() => setShowEditor(true)}
                  className="border border-[var(--card-border)] px-4 py-2 bg-[var(--background)] text-[var(--foreground)] text-[10px] font-bold capitalize tracking-tight hover:bg-[var(--hover-bg)] transition-all rounded-full shadow-sm"
                >
                  EDITAR
                </button>
                <button onClick={handleSignOut} className="border border-[var(--card-border)] px-4 py-2 bg-[var(--background)] text-[var(--text-muted)] text-[10px] font-bold capitalize tracking-tight hover:bg-[var(--hover-bg)] transition-all rounded-full shadow-sm hidden md:block">
                  SALIR
                </button>
              </div>
            </div>

            {/* Bento Grid Header */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Columna Izquierda: Identidad */}
              <div className="md:col-span-5 bg-[var(--background)] border border-[var(--card-border)] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/10 blur-3xl rounded-full" />
                <div className="relative inline-block mb-4">
                  <div className="absolute -top-2 -right-2 bg-[var(--foreground)] text-[var(--background)] text-[9px] font-black px-2.5 py-1 border border-[var(--card-border)] z-10 capitalize rounded-full shadow-lg">
                    LVL {userLevel}
                  </div>
                  <div className="w-24 h-24 md:w-28 md:h-28 bg-[var(--card-bg)] border-4 border-[var(--card-border)] flex items-center justify-center relative z-0 text-5xl overflow-hidden shadow-xl" style={{ borderRadius: '2rem' }}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      '👤'
                    )}
                  </div>
                </div>

                <h1 className="text-xl font-black mb-1 capitalize tracking-tight text-[var(--foreground)] truncate max-w-[200px]">{profile?.username || 'Usuario'}</h1>
                <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-wider mb-4 opacity-70 truncate max-w-[200px] block">{user.email}</span>

                {profile?.equipo && (
                  <div className="inline-flex items-center gap-2 bg-[var(--card-bg)] px-3 py-1.5 border border-[var(--card-border)] rounded-full mb-4 shadow-sm">
                    <span className="text-xs">❤️</span>
                    <span className="font-bold text-[10px] capitalize tracking-wider">{profile.equipo}</span>
                  </div>
                )}
                
                <div className="w-full max-w-[180px]">
                  <ShareButton
                    titulo={`Perfil de ${profile?.username || 'Usuario'} en FutLog`}
                    texto="Mostrale a tus amigos lo que rateaste"
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                    label="Compartir Perfil"
                  />
                </div>
              </div>

              {/* Columna Derecha: Stats Bento */}
              <div className="md:col-span-7 grid grid-cols-2 gap-4">
                {/* Experiencia (Full Width) */}
                <div className="col-span-2 bg-[var(--background)] border border-[var(--card-border)] rounded-3xl p-5 shadow-sm flex flex-col justify-center">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h3 className="text-[10px] font-black text-[var(--text-muted)] capitalize tracking-widest">PROGRESO</h3>
                      <div className="text-2xl font-black leading-none mt-1">Nivel {userLevel}</div>
                    </div>
                    <div className="text-[10px] font-bold bg-[var(--card-bg)] px-3 py-1.5 rounded-full border border-[var(--card-border)] shadow-sm">
                      {userXp} / {nextLevelXp} XP
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-[var(--card-bg)] rounded-full overflow-hidden border border-[var(--card-border)]">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${xpProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Seguidores */}
                <div 
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-3xl p-5 shadow-sm flex flex-col justify-center items-center cursor-pointer hover:bg-[var(--card-bg)] transition-colors group"
                  onClick={() => setFollowModalState({ isOpen: true, type: 'followers', title: 'Seguidores' })}
                >
                  <span className="text-3xl font-black group-hover:scale-110 transition-transform">{followersCount}</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] capitalize tracking-widest mt-1">SEGUIDORES</span>
                </div>

                {/* Siguiendo */}
                <div 
                  className="bg-[var(--background)] border border-[var(--card-border)] rounded-3xl p-5 shadow-sm flex flex-col justify-center items-center cursor-pointer hover:bg-[var(--card-bg)] transition-colors group"
                  onClick={() => setFollowModalState({ isOpen: true, type: 'following', title: 'Siguiendo' })}
                >
                  <span className="text-3xl font-black group-hover:scale-110 transition-transform">{followingCount}</span>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] capitalize tracking-widest mt-1">SIGUIENDO</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs Navigation — Letterboxd Notebook Tab Style */}
        <div className="flex border-b border-[var(--card-border)] overflow-x-auto no-scrollbar bg-[var(--background)] px-4 md:px-0">
          <div className="max-w-2xl mx-auto w-full flex items-end pt-2 gap-1">
            <button
                className={`py-3 px-5 text-[11px] font-black capitalize tracking-widest transition-colors whitespace-nowrap border-t border-x -mb-[1px]
                  ${activeTab === 'social'
                  ? 'border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)] border-b-transparent hover:bg-[var(--hover-bg)]'
                }`}
              style={{ borderBottomColor: activeTab === 'social' ? 'var(--background)' : 'transparent' }}
              onClick={() => setActiveTab('social')}
            >
              {t('nav.profile')}
            </button>
            <button
              className={`py-3 px-5 text-[11px] font-black capitalize tracking-widest transition-colors whitespace-nowrap border-t border-x -mb-[1px]
                  ${activeTab === 'stats'
                  ? 'border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)] border-b-transparent hover:bg-[var(--hover-bg)]'
                }`}
              style={{ borderBottomColor: activeTab === 'stats' ? 'var(--background)' : 'transparent' }}
              onClick={() => setActiveTab('stats')}
            >
              {t('profile.stats.title') || 'STATS'}
            </button>
            <button
              className={`py-3 px-5 text-[11px] font-black capitalize tracking-widest transition-colors whitespace-nowrap border-t border-x -mb-[1px]
                  ${activeTab === 'ajustes'
                  ? 'border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--foreground)] border-b-transparent hover:bg-[var(--hover-bg)]'
                }`}
              style={{ borderBottomColor: activeTab === 'ajustes' ? 'var(--background)' : 'transparent' }}
              onClick={() => setActiveTab('ajustes')}
            >
              {t('profile.settings.title') || 'CONFIGURACIÓN'}
            </button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="max-w-2xl mx-auto px-6 mt-6 pb-8 relative z-10">

          <AnimatePresence mode="wait">
            {/* ===================== TAB: SOCIAL ===================== */}
            {activeTab === 'social' && user && (
              <motion.div
                key="social"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* 📓 Match Diary — Letterboxd-style timeline */}
                <MatchDiary userId={user.id} isOwnProfile />

                {/* Build Your Own XI */}
                <BuildXI />

                {/* Top Partidos Favoritos */}
                <TopPartidos userId={user.id} editable />

                {/* Listas Personalizadas */}
                <UserListsView userId={user.id} isOwnProfile={true} />

                {/* Quick Actions (Grupos & Historial) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push('/historial')}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 text-left hover:bg-[var(--hover-bg)] transition-all flex flex-col justify-between rounded-2xl"
                  >
                    <div>
                      <span className="text-xl mb-1 block">📜</span>
                      <span className="font-bold text-xs capitalize tracking-tight block">Mi Historial</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-3 font-medium capitalize">Ver pronósticos</span>
                  </button>
                  <button
                    onClick={() => router.push('/grupos')}
                    className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 text-left hover:bg-[var(--hover-bg)] transition-all flex flex-col justify-between rounded-2xl"
                  >
                    <div>
                      <span className="text-xl mb-1 block">👥</span>
                      <span className="font-bold text-xs capitalize tracking-tight block">Mis Grupos</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] block mt-3 font-medium capitalize">Competir</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===================== TAB: STATS ===================== */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Overview Stats Cards */}
                <UserStatsCard stats={stats} prodeStats={prodeStats} />

                {/* Radar Chart */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-4">Radar de Rendimiento</h3>
                  <StatsRadar stats={buildRadarStats({
                    partidos_vistos: stats.partidos_vistos,
                    total_votos: stats.total_votos,
                    promedio_general: stats.promedio_general,
                    prode_puntos: prodeStats?.puntos_totales || 0,
                    friend_matches_votes: stats.friend_matches_votes || 0,
                  })} />
                </div>

                {/* Logros (Badges) Summary y Gallery combinados */}
                <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-4">Logros y Títulos</h3>
                  <BadgeDisplay stats={badgeStats} />
                  {user && (
                    <div className="mt-6 border-t border-[var(--card-border)] pt-4">
                      <UserBadgesGallery userId={user.id} isOwnProfile={true} />
                    </div>
                  )}
                </div>

                {/* Rating Distribution */}
                {user && (
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-sm">
                    <h3 className="font-bold text-sm flex items-center gap-2 mb-4">Distribución de Ratings</h3>
                    <RatingPieChart userId={user.id} />
                  </div>
                )}
              </motion.div>
            )}

            {/* ===================== TAB: AJUSTES ===================== */}
            {activeTab === 'ajustes' && (
              <motion.div
                key="ajustes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Tus Equipos / Notificaciones básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tus Equipos / Notificaciones básicas */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 border-b border-[var(--card-border)] pb-3">
                      <h3 className="text-xs font-bold capitalize tracking-tight flex items-center gap-2">
                        🏆 {t('profile.teams.favorite')}
                      </h3>
                    </div>
                    {profile?.equipo ? (
                      <div className="flex flex-col h-full justify-between bg-[var(--background)] p-4 border border-[var(--card-border)] rounded-2xl flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-10 h-10 bg-[var(--hover-bg)] border border-[var(--card-border)] flex items-center justify-center text-xl rounded-xl">
                            🛡️
                          </div>
                          <div>
                            <p className="font-bold text-xs capitalize tracking-tight">{profile.equipo}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-black capitalize mt-1 tracking-widest">{t('profile.stats.matchesRated')}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 mt-auto">
                          <button onClick={() => setShowEditor(true)} className="text-[10px] font-bold text-[var(--accent-green)] hover:underline capitalize tracking-tight text-center">
                            {t('common.change')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-[var(--background)] border border-[var(--card-border)] border-dashed rounded-2xl flex-1 flex flex-col justify-center">
                        <p className="text-[var(--text-muted)] text-[10px] font-bold capitalize mb-3 tracking-tight">{t('profile.teams.noTeam')}</p>
                        <button onClick={() => setShowEditor(true)} className="text-[10px] font-bold text-[var(--accent-green)] hover:underline capitalize tracking-tight">
                          {t('profile.teams.configure')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sincronización Offline */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-col h-full">
                    <h3 className="text-xs font-bold capitalize tracking-tight flex items-center gap-2 mb-4 border-b border-[var(--card-border)] pb-3">
                      🔄 {t('profile.settings.sync.title')}
                    </h3>
                    <div className="flex flex-col justify-between flex-1">
                      <p className="text-[10px] font-medium text-[var(--text-muted)] capitalize mb-5 leading-relaxed tracking-tight">
                        {t('profile.settings.sync.desc')}
                      </p>
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={async () => {
                          setSyncing(true)
                          await syncOfflineLogs()
                          setSyncing(false)
                        }}
                        loading={syncing}
                        size="sm"
                        className="rounded-xl mt-auto"
                      >
                        {t('profile.settings.sync.action')}
                      </Button>
                    </div>
                  </div>

                  {/* Ajustes de Apariencia */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-col h-full">
                    <h3 className="text-xs font-bold capitalize tracking-tight flex items-center gap-2 mb-5 border-b border-[var(--card-border)] pb-3">
                      🎨 {t('profile.settings.appearance.title')}
                    </h3>

                    <div className="flex flex-col justify-center flex-1 space-y-6">
                      <div className="flex items-center justify-between bg-[var(--background)] p-4 border border-[var(--card-border)] rounded-2xl">
                        <div>
                          <p className="font-bold text-xs capitalize tracking-tight">{t('profile.settings.appearance.dark')}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-medium capitalize mt-0.5">{t('profile.settings.appearance.darkDesc')}</p>
                        </div>
                        <button
                          onClick={() => { hapticFeedback(10); toggleTheme(); }}
                          className={`w-12 h-6 border-2 border-[var(--card-border)] transition-colors relative rounded-full ${theme === 'dark' ? 'bg-[var(--accent-green)] border-[var(--accent-green)]' : 'bg-[var(--hover-bg)]'}`}
                        >
                          <motion.div
                            animate={{ x: theme === 'dark' ? 24 : 0 }}
                            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${theme === 'dark' ? 'bg-white' : 'bg-[var(--text-muted)]'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PWA Widget Info */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-col h-full">
                    <h3 className="text-xs font-bold capitalize tracking-tight flex items-center gap-2 mb-4 border-b border-[var(--card-border)] pb-3">
                      📱 {t('profile.settings.pwa.title')}
                    </h3>
                    <div className="flex flex-col justify-center flex-1">
                      <p className="text-[10px] font-medium text-[var(--text-muted)] capitalize mb-4 leading-relaxed tracking-tight">
                        {t('profile.settings.pwa.desc')}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[9px] font-black capitalize mt-auto">
                        <span className="bg-[var(--background)] px-2.5 py-1.5 border border-[var(--card-border)] rounded-lg">{t('profile.settings.pwa.offline')}</span>
                        <span className="bg-[var(--background)] px-2.5 py-1.5 border border-[var(--card-border)] rounded-lg">{t('profile.settings.pwa.fast')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notificaciones */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-col h-full md:col-span-2">
                    <NotificationSettings />
                  </div>

                  {/* Participación & Feedback */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-col h-full md:col-span-2">
                    <h3 className="text-xs font-bold capitalize tracking-tight flex items-center gap-2 mb-4 border-b border-[var(--card-border)] pb-3">
                      ⭐ Participación & Feedback
                    </h3>
                    <div className="flex flex-col">
                      <FeedbackWidget inline={true} />
                    </div>
                  </div>

                  {/* Danger Zone - Logout */}
                  <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-3xl flex flex-col justify-center md:col-span-2 mt-4">
                    <h3 className="text-xs font-black capitalize tracking-widest flex items-center justify-center gap-2 mb-4 border-b border-[var(--card-border)] pb-3 border-dashed text-[#ff4d4d]">
                      {t('profile.settings.danger.title')}
                    </h3>
                    <div className="max-w-xs mx-auto w-full">
                      <Button variant="destructive" fullWidth onClick={handleSignOut} size="md" className="rounded-xl font-bold tracking-widest text-[#ff4d4d] bg-[#ff4d4d]/10 hover:bg-[#ff4d4d] hover:text-white border border-[#ff4d4d]/20 transition-all">
                        {t('profile.settings.logout')}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Trust & Compliance Footer */}
                <div className="mt-8 mb-4 border-t border-[var(--card-border)] pt-6 text-center">
                  <div className="flex justify-center flex-wrap gap-3 text-xs font-bold text-[var(--text-muted)]">
                    <Link href="/privacy" className="hover:text-[#16a34a] hover:underline transition-colors">{t('footer.privacy')}</Link>
                    <span>•</span>
                    <Link href="/terms" className="hover:text-[#16a34a] hover:underline transition-colors">{t('footer.terms')}</Link>
                    <span>•</span>
                    <Link href="/sources" className="hover:text-[#16a34a] hover:underline transition-colors">{t('footer.sources')}</Link>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-4 opacity-50">
                    FutLog Beta © {new Date().getFullYear()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NavBar />
      </main>

      {/* Modal Editor de Perfil */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--card-bg)] p-6 w-full max-w-lg border border-[var(--card-border)] my-auto"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className="flex items-center justify-between mb-6 border-b border-[var(--card-border)] pb-2 border-dashed">
                <h2 className="text-sm font-black capitalize tracking-widest">✏️ Editar Perfil</h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="w-7 h-7 flex items-center justify-center border border-[var(--card-border)] bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Avatar Selection */}
                <div className="space-y-3 pb-2 pt-2 border-t border-[var(--card-border)] border-dashed">
                  <label className="block text-[10px] font-black capitalize tracking-widest text-[var(--foreground)] opacity-90 mx-1">
                    Foto de perfil
                  </label>

                  <AvatarUploader
                    currentAvatarUrl={editAvatar}
                    onUploadSuccess={(url) => setEditAvatar(url)}
                  />

                  <p className="text-[8px] text-center text-[var(--text-muted)] font-black capitalize mt-2">
                    Toca la imagen para subir (MÁX 5MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="text-[9px] font-black text-[var(--text-muted)] capitalize mb-2 block">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Tu nombre..."
                      maxLength={20}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] px-4 py-3 
                                    focus:outline-none focus:border-[var(--foreground)] transition-colors"
                      style={{ borderRadius: 'var(--radius)' }}
                    />
                  </div>

                  {/* Equipo Favorito */}
                  <div>
                    <label className="text-[9px] font-black text-[var(--text-muted)] capitalize mb-2 block">
                      Equipo Favorito
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={editEquipo}
                        readOnly
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] px-4 py-3 cursor-default"
                        style={{ borderRadius: 'var(--radius)' }}
                        placeholder="Seleccionar abajo..."
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50 text-[10px]">▼</div>
                    </div>
                  </div>
                </div>

                {/* Team Selector Component */}
                <div className="bg-[var(--background)] p-4 border border-[var(--card-border)] text-sm mb-4" style={{ borderRadius: 'var(--radius)' }}>
                  <p className="text-[9px] font-black text-[var(--text-muted)] capitalize mb-2 border-b border-[var(--card-border)] pb-1 border-dashed">Buscar Equipo</p>
                  <EquipoSelector selectedEquipo={editEquipo} onSelect={setEditEquipo} />
                </div>

                {/* Idioma Selector */}
                <div>
                  <label className="text-[9px] font-black text-[var(--text-muted)] capitalize mb-2 block">
                    {t('profile.settings.language')}
                  </label>
                  <div className="flex gap-1">
                    {(['es', 'en', 'pt'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={(e) => {
                          e.preventDefault()
                          setLanguage(lang)
                        }}
                        className={`flex-1 py-2 px-3 border transition-all text-[9px] font-black capitalize
                          ${language === lang
                            ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)]'
                            : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--foreground)]'}`}
                        style={{ borderRadius: 'var(--radius)' }}
                      >
                        {lang === 'es' ? '🇪🇸 ES' : lang === 'en' ? '🇺🇸 EN' : '🇧🇷 PT'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensaje de guardado */}
                {saveMessage && (
                  <div className="text-center p-3 rounded-xl bg-[#16a34a]/10 text-[#16a34a] font-bold text-sm animate-pulse">
                    {saveMessage}
                  </div>
                )}

                {/* Botón Guardar */}
                <div className="pt-2">
                  <Button
                    onClick={handleSaveProfile}
                    loading={saving}
                    fullWidth
                    size="sm"
                  >
                    GUARDAR CAMBIOS
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow List Modal */}
      {user && (
        <FollowListModal
          isOpen={followModalState.isOpen}
          onClose={() => setFollowModalState(prev => ({ ...prev, isOpen: false }))}
          userId={user.id}
          type={followModalState.type}
          title={followModalState.title}
        />
      )}
    </>
  )
}