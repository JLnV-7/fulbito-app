// src/app/perfil/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { NotificationSettings } from '@/components/NotificationSettings'
import { motion, AnimatePresence } from 'framer-motion'
import type { Profile, UserStats } from '@/types'
import { AvatarSelector } from '@/components/perfil/AvatarSelector'
import { EquipoSelector } from '@/components/perfil/EquipoSelector'
import { UserStatsCard } from '@/components/UserStatsCard'

export default function Perfil() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats>({
    partidos_vistos: 0,
    promedio_general: 0,
    total_votos: 0
  })
  const [prodeStats, setProdeStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Estado del editor
  const [showEditor, setShowEditor] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [editEquipo, setEditEquipo] = useState('')
  const [editAvatar, setEditAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user) {
        router.push('/login')
        return
      }

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
    return null
  }

  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">

        {/* Hero Header con gradiente */}
        <div className="bg-gradient-to-br from-[#ff6b6b] via-[#ee5a5a] to-[#ff8e8e] pt-8 pb-24 px-6 rounded-b-[50px] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-4 right-4 text-8xl">⚽</div>
            <div className="absolute bottom-8 left-8 text-6xl">🏆</div>
          </div>

          <div className="max-w-2xl mx-auto relative content-center">
            <div className="flex justify-between items-center mb-8">
              <button onClick={() => router.push('/')} className="bg-white/20 p-2 rounded-full backdrop-blur-md text-white">
                ←
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditor(true)}
                  className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md text-white text-sm font-medium hover:bg-white/30 transition-all"
                >
                  ✏️ Editar
                </button>
                <button onClick={handleSignOut} className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md text-white text-sm font-medium hover:bg-white/30 transition-all">
                  Cerrar Sesión
                </button>
              </div>
            </div>

            <div className="text-center text-white">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 text-5xl shadow-xl"
              >
                {profile?.avatar_url || '👤'}
              </motion.div>
              <h1 className="text-3xl font-black mb-1 drop-shadow-md">{profile?.username || 'Usuario'}</h1>
              <p className="opacity-80 text-sm mb-4">{user.email}</p>
              {profile?.equipo && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/10">
                  <span>❤️</span>
                  <span className="font-bold">{profile.equipo}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-2xl mx-auto px-6 -mt-12 relative z-10">
          <UserStatsCard stats={stats} prodeStats={prodeStats} />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                  Agregá Fulbito a tu inicio para que cargue más rápido y funcione sin internet.
                </p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-[var(--card-bg)] px-2 py-1 rounded-full border border-[var(--card-border)]">✅ Offline</span>
                  <span className="bg-[var(--card-bg)] px-2 py-1 rounded-full border border-[var(--card-border)]">⚡ Rápida</span>
                </div>
              </div>
            </div>
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
                <div>
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase mb-3 block">
                    Elegí tu Avatar
                  </label>
                  <div className="flex justify-center mb-4">
                    <div className="text-6xl p-4 bg-[var(--background)] rounded-full border-2 border-[var(--card-border)]">
                      {editAvatar || '👤'}
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-[var(--background)] rounded-xl border border-[var(--card-border)] mb-2">
                    <AvatarSelector selectedAvatar={editAvatar} onSelect={setEditAvatar} />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] text-center">Seleccioná uno de la lista</p>
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
                <div className="bg-[var(--background)] p-4 rounded-xl border border-[var(--card-border)] text-sm">
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Buscar Equipo</p>
                  <EquipoSelector selectedEquipo={editEquipo} onSelect={setEditEquipo} />
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
    </>
  )
}