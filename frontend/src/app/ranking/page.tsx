// src/app/ranking/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { motion } from 'framer-motion'
import { SimuladorPuntos } from '@/components/SimuladorPuntos'
import { ReglasPuntajeModal } from '@/components/ReglasPuntajeModal'
import { ClubRanking } from '@/components/ClubRanking'
import { PullToRefresh } from '@/components/PullToRefresh'
import { MockProde } from '@/components/MockProde'
import type { RankingProde } from '@/types'

type TipoRanking = 'global' | 'liga'

export default function RankingPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [ranking, setRanking] = useState<RankingProde[]>([])
    const [loading, setLoading] = useState(true)
    const [periodo, setPeriodo] = useState<'semanal' | 'mensual' | 'global'>('global')
    const [filtroSocial, setFiltroSocial] = useState<'global' | 'amigos'>('global')

    useEffect(() => {
        fetchRanking()
    }, [periodo, filtroSocial])

    const fetchRanking = async () => {
        setLoading(true)

        try {
            let userIds: string[] = []

            if (filtroSocial === 'amigos' && user) {
                const { data: follows } = await supabase
                    .from('user_follows')
                    .select('following_id')
                    .eq('follower_id', user.id)

                if (follows) {
                    userIds = follows.map(f => f.following_id)
                    // Incluirme a mí mismo en el ranking de amigos
                    userIds.push(user.id)
                }
            }

            let query = supabase
                .from('ranking_prode')
                .select(`
                  *,
                  profile:profiles(*)
                `)
                .order('puntos_totales', { ascending: false })
                .limit(100)

            if (filtroSocial === 'amigos' && userIds.length > 0) {
                query = query.in('user_id', userIds)
            } else if (filtroSocial === 'amigos') {
                // Si no sigue a nadie y no hay IDs, forzar vacío o solo yo
                query = query.eq('user_id', user?.id || 'none')
            }

            const { data, error } = await query

            if (error) throw error

            setRanking(data || [])
        } catch (error) {
            console.error('Error fetching ranking:', error)
        } finally {
            setLoading(false)
        }
    }

    const getPosicionColor = (pos: number) => {
        if (pos === 1) return 'text-[#ffd700]' // Oro
        if (pos === 2) return 'text-[#c0c0c0]' // Plata
        if (pos === 3) return 'text-[#cd7f32]' // Bronce
        return 'text-[var(--text-muted)]'
    }

    const getPosicionEmoji = (pos: number) => {
        if (pos === 1) return '🥇'
        if (pos === 2) return '🥈'
        if (pos === 3) return '🥉'
        return pos
    }

    return (
        <>
            <DesktopNav />

            <PullToRefresh onRefresh={async () => { await fetchRanking() }}>
                <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                    {/* Header */}
                    <div className="px-6 py-6 md:py-8">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                                        🏆 Tabla de Posiciones
                                    </h1>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Los mejores pronosticadores del momento
                                    </p>
                                </div>
                                <ReglasPuntajeModal />
                            </div>
                        </div>
                    </div>

                    {/* Filtros de Período y Social */}
                    <div className="px-6 mb-6">
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {['semanal', 'mensual', 'global'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriodo(p as any)}
                                        className={`px-5 py-2 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap
                                       ${periodo === p
                                                ? 'bg-[#10b981] text-white shadow-md shadow-[#10b981]/20'
                                                : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)] hover:bg-[var(--hover-bg)]'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFiltroSocial('global')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                                        ${filtroSocial === 'global'
                                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'}
                                    `}
                                >
                                    Global
                                </button>
                                <button
                                    onClick={() => setFiltroSocial('amigos')}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all
                                        ${filtroSocial === 'amigos'
                                            ? 'bg-[var(--foreground)] text-[var(--background)]'
                                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'}
                                    `}
                                >
                                    Amigos
                                </button>
                            </div>

                            {/* Mock Prode Callout */}
                            <MockProde />
                        </div>
                    </div>

                    {/* Position Teaser */}
                    {user && !loading && (
                        <div className="px-6 mb-6">
                            <div className="max-w-4xl mx-auto bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                        📈
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-[var(--foreground)]">Tu progresión semanal</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {ranking.findIndex(r => r.user_id === user.id) !== -1
                                                    ? `Posición #${ranking.findIndex(r => r.user_id === user.id) + 1}`
                                                    : 'Fuera del Top 100'}
                                            </span>
                                            <span className="flex items-center gap-0.5 px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-black rounded-full">
                                                <motion.span
                                                    animate={{ y: [0, -2, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                                                >
                                                    ↑
                                                </motion.span>
                                                14 PUESTOS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button className="relative z-10 px-3 py-1.5 bg-[var(--background)] border border-[var(--card-border)] rounded-lg text-[10px] font-bold hover:bg-[var(--hover-bg)] transition-colors">
                                    VER ANALYTICS
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Top 3 Podio Premium */}
                    {!loading && ranking.length > 0 && (
                        <div className="px-6 mb-12">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-end justify-center gap-4 md:gap-8 mb-8 relative">
                                    {/* 2do puesto */}
                                    {ranking.length >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => router.push(`/perfil/${ranking[1].user_id}`)}
                                        >
                                            <div className="relative mb-3">
                                                <motion.div
                                                    animate={{ rotate: [-2, 2, -2] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="text-3xl absolute -top-5 -right-2 z-10"
                                                >
                                                    🥈
                                                </motion.div>
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--card-bg)] border-4 border-[#c0c0c0] p-1 shadow-lg shadow-[#c0c0c0]/20">
                                                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-3xl overflow-hidden grayscale">
                                                        {ranking[1].profile?.avatar_url || '👤'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[#c0c0c0]/10 border border-[#c0c0c0]/30 rounded-2xl p-3 text-center min-w-[110px] backdrop-blur-md shadow-sm">
                                                <div className="text-xs font-black truncate max-w-[100px] uppercase tracking-tighter">
                                                    {ranking[1].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-2xl font-black text-[#c0c0c0] leading-none my-1">
                                                    {ranking[1].puntos_totales}
                                                </div>
                                                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">Puntos</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 1er puesto - EL REY */}
                                    {ranking.length >= 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex flex-col items-center -mt-8 md:-mt-12 cursor-pointer hover:scale-105 transition-transform z-20"
                                            onClick={() => router.push(`/perfil/${ranking[0].user_id}`)}
                                        >
                                            <div className="relative mb-4">
                                                <motion.div
                                                    animate={{ y: [-5, 0, -5], scale: [1, 1.1, 1] }}
                                                    transition={{ repeat: Infinity, duration: 3 }}
                                                    className="text-6xl absolute -top-10 left-1/2 -translate-x-1/2 z-10 drop-shadow-lg"
                                                >
                                                    👑
                                                </motion.div>
                                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-b from-[#ffd700] to-[#b8860b] p-1 shadow-[0_10px_40px_rgba(255,215,0,0.4)]">
                                                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-5xl md:text-6xl overflow-hidden ring-4 ring-black/10">
                                                        {ranking[0].profile?.avatar_url || '👤'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[#ffd700]/20 border border-[#ffd700]/50 rounded-3xl p-5 text-center min-w-[140px] md:min-w-[160px] backdrop-blur-md shadow-xl ring-1 ring-white/10">
                                                <div className="text-sm font-black truncate max-w-[140px] uppercase text-[#ffd700]">
                                                    {ranking[0].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-4xl font-black text-[#ffd700] leading-none my-1 drop-shadow-sm">
                                                    {ranking[0].puntos_totales}
                                                </div>
                                                <div className="text-[10px] font-bold text-[#ffd700]/60 uppercase tracking-widest">Puntos</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 3er puesto */}
                                    {ranking.length >= 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => router.push(`/perfil/${ranking[2].user_id}`)}
                                        >
                                            <div className="relative mb-3">
                                                <motion.div
                                                    animate={{ rotate: [2, -2, 2] }}
                                                    transition={{ repeat: Infinity, duration: 2.5 }}
                                                    className="text-3xl absolute -top-5 -left-2 z-10"
                                                >
                                                    🥉
                                                </motion.div>
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--card-bg)] border-4 border-[#cd7f32] p-1 shadow-lg shadow-[#cd7f32]/20">
                                                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-3xl overflow-hidden sepia-[.3]">
                                                        {ranking[2].profile?.avatar_url || '👤'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[#cd7f32]/10 border border-[#cd7f32]/30 rounded-2xl p-3 text-center min-w-[110px] backdrop-blur-md shadow-sm">
                                                <div className="text-xs font-black truncate max-w-[100px] uppercase tracking-tighter">
                                                    {ranking[2].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-2xl font-black text-[#cd7f32] leading-none my-1">
                                                    {ranking[2].puntos_totales}
                                                </div>
                                                <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">Puntos</div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabla completa */}
                    <div className="px-6">
                        <div className="max-w-4xl mx-auto">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin text-4xl mb-4">⚽</div>
                                    <p className="text-sm text-[var(--text-muted)]">Cargando ranking...</p>
                                </div>
                            ) : ranking.length === 0 ? (
                                <div className="text-center py-12">
                                    <span className="text-6xl mb-4 block">📊</span>
                                    <h3 className="text-lg font-semibold mb-2">No hay datos aún</h3>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Sé el primero en hacer pronósticos y aparecer en el ranking
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-[var(--background)] border-b border-[var(--card-border)]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">
                                                        POS
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">
                                                        JUGADOR
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)]">
                                                        PTS
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)]">
                                                        EXACTOS
                                                    </th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--text-muted)]">
                                                        PARTIDOS
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ranking.map((jugador, index) => {
                                                    const isMe = user?.id === jugador.user_id
                                                    return (
                                                        <motion.tr
                                                            key={jugador.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            onClick={() => router.push(`/perfil/${jugador.user_id}`)}
                                                            className={`border-b transition-colors cursor-pointer ${isMe ? 'bg-[#10b981]/10 border-[#10b981]/30 hover:bg-[#10b981]/20' : 'border-[var(--card-border)] hover:bg-[var(--hover-bg)]'}`}
                                                        >
                                                            <td className="px-4 py-4">
                                                                <div className="flex flex-col items-center">
                                                                    <span className={`font-bold ${getPosicionColor(index + 1)}`}>
                                                                        {getPosicionEmoji(index + 1)}
                                                                    </span>
                                                                    {/* Mock trend indicator for premium feel */}
                                                                    <span className={`text-[8px] font-bold mt-1 ${index % 3 === 0 ? 'text-green-500' : index % 4 === 0 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                                                                        {index % 3 === 0 ? '↑2' : index % 4 === 0 ? '↓1' : '='}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center text-lg overflow-hidden">
                                                                        {jugador.profile?.avatar_url || '👤'}
                                                                    </div>
                                                                    <div className="font-medium">
                                                                        {jugador.profile?.username || 'Usuario'}
                                                                        {jugador.profile?.equipo && (
                                                                            <span className="text-[10px] text-[var(--text-muted)] block leading-none mt-0.5">
                                                                                {jugador.profile.equipo}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                <span className="font-bold text-[#10b981]">
                                                                    {jugador.puntos_totales}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center text-sm">
                                                                {jugador.aciertos_exactos}
                                                            </td>
                                                            <td className="px-4 py-4 text-center text-sm">
                                                                {jugador.partidos_jugados}
                                                            </td>
                                                        </motion.tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ranking de Clubes por la Comunidad */}
                    <div className="px-6 mt-8">
                        <div className="max-w-4xl mx-auto">
                            <ClubRanking />
                        </div>
                    </div>
                </main>
            </PullToRefresh>

            <NavBar />
        </>
    )
}
