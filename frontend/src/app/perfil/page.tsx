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
import { NotificationSettings } from '@/components/NotificationSettings'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
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

export default function Perfil() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  const { language, setLanguage, t } = useLanguage()
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

      setSaveMessage('✅ Guardado!')

      setTimeout(() => {
        setShowEditor(false)
        setSaveMessage('')
      }, 1500)
    } catch (error) {
      console.error('Error guardando perfil:', error)
      setSaveMessage('❌ Error al guardar')
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
              Entrá a la cancha para llevar un registro de tus partidos, ganar XP, desbloquear medallas exclusivas y subir de nivel.
            </p>

            <div className="space-y-4 mb-8 text-left max-w-[250px] mx-auto text-sm">
              <div className="flex items-center gap-3"><span className="text-xl">📊</span> Stats de tus rateos</div>
              <div className="flex items-center gap-3"><span className="text-xl">🎖️</span> Grid de Badges</div>
              <div className="flex items-center gap-3"><span className="text-xl">🏆</span> Rango en el Prode</div>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-[var(--accent-green)] hover:bg-[#008f45] text-white font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-[var(--accent-green)]/30 active:scale-95"
            >
              Entrar a la cancha
            </button>
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

        {/* Hero Header con gradiente */}
        <div className="bg-gradient-to-br from-[var(--accent-green)] via-[#008f45] to-[#10b981] pt-8 pb-24 px-6 rounded-b-[50px] relative overflow-hidden shadow-[0_10px_40px_rgba(0,166,81,0.2)]">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-4 right-4 text-8xl">⚽</div>
            <div className="absolute bottom-8 left-8 text-6xl">🏆</div>
          </div>

          <div className="max-w-2xl mx-auto relative z-10">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => router.push('/')} className="bg-black/20 p-2.5 rounded-full backdrop-blur-md text-white hover:bg-black/40 transition-all">
                ←
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQRModal(true)}
                  className="bg-black/20 p-2.5 rounded-xl backdrop-blur-md text-white font-bold hover:bg-black/40 transition-all flex items-center justify-center shadow-lg"
                  aria-label="Mostrar código QR para compartir"
                >
                  <span className="text-sm">📱</span>
                </button>
                <button
                  onClick={() => setShowEditor(true)}
                  className="bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md text-white text-sm font-bold hover:bg-black/40 transition-all"
                >
                  ✏️ Editar
                </button>
                <button onClick={handleSignOut} className="bg-black/20 px-4 py-2 rounded-xl backdrop-blur-md text-white text-sm font-bold hover:bg-black/40 transition-all">
                  Salir
                </button>
              </div>
            </div>

            <div className="text-center text-white relative">
              <div className="relative inline-block mx-auto mb-4">
                {/* SVG Progress Ring */}
                <svg className="absolute -inset-3 w-[calc(100%+1.5rem)] h-[calc(100%+1.5rem)] -rotate-90 pointer-events-none drop-shadow-lg">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="46%"
                    fill="none"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="46%"
                    fill="none"
                    stroke="#F59E0B" // Amber-500 for gold
                    strokeWidth="6"
                    strokeDasharray="100 100"
                    strokeDashoffset={100 - xpProgress}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                    pathLength="100"
                  />
                </svg>
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-black px-2 py-1 rounded-full border-2 border-white shadow-xl z-10 transform rotate-12">
                  Lvl {userLevel}
                </div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center relative z-0 border-4 border-white/30 text-5xl shadow-xl overflow-hidden"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    '👤'
                  )}
                </motion.div>
              </div>

              <h1 className="text-3xl font-black mb-1 drop-shadow-md">{profile?.username || 'Usuario'}</h1>

              <div className="flex flex-col items-center gap-1 opacity-90 text-sm mb-4">
                <span>{user.email}</span>
                <span className="text-xs font-bold bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {userXp} / {nextLevelXp} XP
                </span>
              </div>

              {/* Follower Stats */}
              <div className="flex justify-center gap-6 mb-4">
                <div
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setFollowModalState({
                    isOpen: true,
                    type: 'followers',
                    title: 'Seguidores'
                  })}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="font-black text-xl text-white"
                  >
                    {followersCount}
                  </motion.div>
                  <div className="text-[10px] uppercase font-bold text-white/80 tracking-widest">Seguidores</div>
                </div>
                <div
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setFollowModalState({
                    isOpen: true,
                    type: 'following',
                    title: 'Siguiendo'
                  })}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="font-black text-xl text-white"
                  >
                    {followingCount}
                  </motion.div>
                  <div className="text-[10px] uppercase font-bold text-white/80 tracking-widest">Siguiendo</div>
                </div>
              </div>

              {profile?.equipo && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/10 mb-6">
                  <span>❤️</span>
                  <span className="font-bold">{profile.equipo}</span>
                </div>
              )}

              <div className="max-w-[200px] mx-auto mt-2">
                <ShareButton
                  titulo={`Perfil de ${profile?.username || 'Usuario'} en FutLog`}
                  texto="Mostrale a tus amigos lo que rateaste"
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  label="Compartir mi Perfil"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-10">
          <UserStatsCard stats={stats} prodeStats={prodeStats} />

          {/* Estadísticas Detalladas Accordion */}
          <ProfileAccordion
            title="Estadísticas Detalladas"
            icon="📊"
            defaultOpen={false}
          >
            <div className="space-y-6">
              <StatsRadar stats={buildRadarStats({
                partidos_vistos: stats.partidos_vistos,
                total_votos: stats.total_votos,
                promedio_general: stats.promedio_general,
                prode_puntos: prodeStats?.puntos_totales || 0,
                friend_matches_votes: stats.friend_matches_votes || 0,
              })} />

              {user && (
                <div className="border-t border-[var(--card-border)] pt-6">
                  <h4 className="font-bold text-sm mb-4 text-[var(--foreground)] text-center">Distribución de Ratings</h4>
                  <RatingPieChart userId={user.id} />
                </div>
              )}
            </div>
          </ProfileAccordion>

          {/* Badges/Logros Accordion */}
          <ProfileAccordion
            title="Logros y Títulos"
            icon="🏆"
            defaultOpen={true}
          >
            <div className="space-y-4">
              <BadgeDisplay stats={badgeStats} />
              {user && <UserBadgesGallery userId={user.id} isOwnProfile={true} />}
            </div>
          </ProfileAccordion>

          {/* Top Partidos Favoritos */}
          {user && (
            <div className="mb-6">
              <TopPartidos userId={user.id} editable />
            </div>
          )}

          {/* Listas Personalizadas */}
          {user && (
            <UserListsView userId={user.id} isOwnProfile={true} />
          )}

          <div className="mt-8 space-y-6">
            {/* Weekly Challenges Widget */}
            <WeeklyChallenges />

            {/* Tus Equipos / Notificaciones */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  🛡️ Tus Equipos
                </h3>
              </div>
              {profile?.equipo ? (
                <div className="flex items-center justify-between bg-[var(--background)] p-3 rounded-xl border border-[var(--card-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--hover-bg)] rounded-full flex items-center justify-center text-xl shadow-sm">
                      🛡️
                    </div>
                    <div>
                      <p className="font-bold text-sm">{profile.equipo}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Notificaciones activadas</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#10b981]"></div>
                  </label>
                </div>
              ) : (
                <div className="text-center py-6 bg-[var(--background)] rounded-xl border border-[var(--card-border)] border-dashed">
                  <p className="text-[var(--text-muted)] text-sm mb-3">No tenés equipo favorito configurado.</p>
                  <button onClick={() => setShowEditor(true)} className="text-xs font-bold text-[#10b981] hover:underline">
                    Configurar equipo
                  </button>
                </div>
              )}
            </div>

            <UserBadgesGallery
              userId={user.id}
              isOwnProfile={true}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
            <button
              onClick={() => router.push('/historial')}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-left hover:border-[#ff6b6b]/50 transition-all shadow-sm hover:shadow-md"
            >
              <span className="text-2xl mb-2 block">📜</span>
              <span className="font-bold text-sm block">Mi Historial</span>
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Ver todos mis pronósticos</span>
            </button>
            <button
              onClick={() => router.push('/grupos')}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 text-left hover:border-[#10b981]/50 transition-all shadow-sm hover:shadow-md"
            >
              <span className="text-2xl mb-2 block">👥</span>
              <span className="font-bold text-sm block">Mis Grupos</span>
              <span className="text-[10px] text-[var(--text-muted)] block mt-1">Competí con amigos</span>
            </button>
          </div>

          <NotificationSettings />

          {/* PWA Widget Info */}
          <div className="mt-6 bg-gradient-to-r from-[#6366f1]/10 to-[#8b5cf6]/10 border border-[#6366f1]/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📱</span>
              <div>
                <h4 className="font-bold text-sm mb-1 text-[#6366f1]">Instalá la App</h4>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Agregá FutLog a tu inicio para que cargue más rápido y funcione sin internet.
                </p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-[var(--card-bg)] px-2 py-1 rounded-full border border-[var(--card-border)]">✅ Offline</span>
                  <span className="bg-[var(--card-bg)] px-2 py-1 rounded-full border border-[var(--card-border)]">⚡ Rápida</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust & Compliance Footer */}
          <div className="mt-8 mb-4 border-t border-[var(--card-border)] pt-6 text-center">
            <div className="flex justify-center flex-wrap gap-3 text-xs font-bold text-[var(--text-muted)]">
              <Link href="/privacy" className="hover:text-[#10b981] hover:underline transition-colors">Privacidad</Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-[#10b981] hover:underline transition-colors">Términos</Link>
              <span>•</span>
              <Link href="/sources" className="hover:text-[#10b981] hover:underline transition-colors">Fuentes</Link>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-4 opacity-50">
              FutLog Beta © {new Date().getFullYear()}
            </p>
          </div>
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
              className="bg-[var(--card-bg)] rounded-3xl p-6 w-full max-w-lg border border-[var(--card-border)] shadow-2xl my-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black">✏️ Editar Perfil</h2>
                <button
                  onClick={() => setShowEditor(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Avatar Selection */}
                <div className="space-y-3 pb-2 pt-2 border-t border-[var(--card-border)]">
                  <label className="block text-sm font-bold text-[var(--foreground)] opacity-90 mx-1">
                    Foto de perfil
                  </label>

                  <AvatarUploader
                    currentAvatarUrl={editAvatar}
                    onUploadSuccess={(url) => setEditAvatar(url)}
                  />

                  <p className="text-[10px] text-center text-[var(--text-muted)] mt-2">
                    Toca la imagen para subir una foto desde tu galería o cámara. (Máx 5MB)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Username */}
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">
                      Nombre de Usuario
                    </label>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="Tu nombre..."
                      maxLength={20}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 
                                    focus:outline-none focus:border-[#ff6b6b] transition-colors"
                    />
                  </div>

                  {/* Equipo Favorito */}
                  <div>
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">
                      Equipo Favorito
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        value={editEquipo}
                        readOnly
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 cursor-default"
                        placeholder="Seleccionar abajo..."
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none opacity-50">▼</div>
                    </div>
                  </div>
                </div>

                {/* Team Selector Component */}
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)] text-sm mb-4">
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Buscar Equipo</p>
                  <EquipoSelector selectedEquipo={editEquipo} onSelect={setEditEquipo} />
                </div>

                {/* Idioma Selector */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2 block">
                    {t('profile.settings.language')}
                  </label>
                  <div className="flex gap-2">
                    {(['es', 'en', 'pt'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={(e) => {
                          e.preventDefault()
                          setLanguage(lang)
                        }}
                        className={`flex-1 py-3 px-4 rounded-xl border transition-all text-sm font-bold uppercase
                          ${language === lang
                            ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]'
                            : 'bg-[var(--background)] border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}
                      >
                        {lang === 'es' ? '🇪🇸 ES' : lang === 'en' ? '🇺🇸 EN' : '🇧🇷 PT'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mensaje de guardado */}
                {saveMessage && (
                  <div className="text-center p-3 rounded-xl bg-[#10b981]/10 text-[#10b981] font-bold text-sm animate-pulse">
                    {saveMessage}
                  </div>
                )}

                {/* Botón Guardar */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full bg-[#ff6b6b] text-white font-bold py-4 rounded-xl 
                                hover:bg-[#ee5a5a] transition-all disabled:opacity-50 shadow-lg shadow-[#ff6b6b]/20"
                  >
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
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