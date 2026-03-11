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
import { PullToRefresh } from '@/components/PullToRefresh'
import { ClubRanking } from '@/components/ClubRanking'
import type { RankingProde } from '@/types'
import { RankingGoal } from '@/components/ranking/RankingGoal'

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
                    userIds.push(user.id)
                }
            }

            let pointsColumn = 'puntos_totales'
            if (periodo === 'semanal') pointsColumn = 'puntos_semanales'
            if (periodo === 'mensual') pointsColumn = 'puntos_mensuales'

            let query = supabase
                .from('ranking_prode')
                .select(`
                  *,
                  profile:profiles(*)
                `)
                .order(pointsColumn, { ascending: false })
                .limit(100)

            if (filtroSocial === 'amigos' && userIds.length > 0) {
                query = query.in('user_id', userIds)
            } else if (filtroSocial === 'amigos') {
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
        if (pos === 1) return 'text-amber-400'
        if (pos === 2) return 'text-slate-300'
        if (pos === 3) return 'text-orange-400'
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
                    <div className="px-6 py-10">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                                        🏆 Tabla de Posiciones
                                    </h1>
                                    <p className="text-sm text-[var(--text-muted)] font-medium">
                                        Los mejores pronosticadores del momento
                                    </p>
                                </div>
                                <ReglasPuntajeModal />
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="px-6 mb-10">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                {['semanal', 'mensual', 'global'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriodo(p as any)}
                                        className={`px-6 py-2.5 rounded-2xl text-[11px] font-bold capitalize tracking-tight transition-all whitespace-nowrap border
                                        ${periodo === p
                                                ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-purple-500/20'
                                                : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)] hover:bg-[var(--hover-bg)]'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFiltroSocial('global')}
                                    className={`flex-1 py-3.5 rounded-2xl text-[11px] font-bold capitalize tracking-tight transition-all border
                                        ${filtroSocial === 'global'
                                            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-lg'
                                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'}
                                    `}
                                >
                                    Global
                                </button>
                                <button
                                    onClick={() => setFiltroSocial('amigos')}
                                    className={`flex-1 py-3.5 rounded-2xl text-[11px] font-bold capitalize tracking-tight transition-all border
                                        ${filtroSocial === 'amigos'
                                            ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-lg'
                                            : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)]'}
                                    `}
                                >
                                    Amigos
                                </button>
                            </div>

                            {user && ranking.length > 0 && (
                                <RankingGoal
                                    currentPoints={ranking.find(r => r.user_id === user.id)?.[periodo === 'global' ? 'puntos_totales' : periodo === 'mensual' ? 'puntos_mensuales' : 'puntos_semanales'] || 0}
                                    rank={ranking.findIndex(r => r.user_id === user.id) !== -1 ? ranking.findIndex(r => r.user_id === user.id) + 1 : undefined}
                                />
                            )}
                        </div>
                    </div>

                    {/* Tu Posición */}
                    {user && !loading && (
                        <div className="px-6 mb-12">
                            <div className="max-w-4xl mx-auto bg-[var(--accent)]/5 border border-[var(--accent)]/10 rounded-[2rem] p-8 flex items-center justify-between shadow-xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="w-16 h-16 bg-[var(--accent)] text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-500/20">
                                        {ranking.findIndex(r => r.user_id === user.id) !== -1 ? `${ranking.findIndex(r => r.user_id === user.id) + 1}°` : '-'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[var(--foreground)] text-lg">Tu posición actual</h4>
                                        <p className="text-[11px] text-[var(--text-muted)] font-medium capitalize tracking-tight mt-1">
                                            {ranking.findIndex(r => r.user_id === user.id) !== -1
                                                ? `${ranking.find(r => r.user_id === user.id)?.partidos_jugados || 0} prodes jugados`
                                                : 'Aún no estás en el Top 100'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/perfil/${user.id}`)}
                                    className="relative z-10 px-5 py-2.5 bg-[var(--background)] border border-[var(--accent)]/20 text-[var(--accent)] rounded-xl text-[10px] font-bold capitalize tracking-tight hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm"
                                >
                                    VER MI PERFIL
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Podio */}
                    {!loading && ranking.length > 0 && (
                        <div className="px-6 mb-16">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-end justify-center gap-4 md:gap-12 mb-8 relative">
                                    {/* 2do */}
                                    {ranking.length >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex flex-col items-center cursor-pointer group"
                                            onClick={() => router.push(`/perfil/${ranking[1].user_id}`)}
                                        >
                                            <div className="relative mb-4">
                                                <span className="text-3xl absolute -top-5 -right-2 z-10">🥈</span>
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--card-bg)] border-4 border-slate-300 p-1 shadow-2xl group-hover:scale-110 transition-transform">
                                                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-3xl overflow-hidden grayscale">
                                                        {ranking[1].profile?.avatar_url || '👤'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[1.5rem] p-4 text-center min-w-[120px] shadow-lg">
                                                <div className="text-[11px] font-bold truncate max-w-[100px] capitalize tracking-tight mb-1">
                                                    {ranking[1].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-2xl font-bold text-slate-300">
                                                    {ranking[1].puntos_totales}
                                                </div>
                                                <div className="text-[9px] font-medium text-[var(--text-muted)] capitalize tracking-tight opacity-60">PUNTOS</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 1ro */}
                                    {ranking.length >= 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center -mt-12 cursor-pointer z-20 group"
                                            onClick={() => router.push(`/perfil/${ranking[0].user_id}`)}
                                        >
                                            <div className="relative mb-6">
                                                <motion.div animate={{ y: [-5, 0, -5] }} transition={{ repeat: Infinity, duration: 3 }} className="text-6xl absolute -top-12 left-1/2 -translate-x-1/2 z-10">👑</motion.div>
                                                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-1 shadow-[0_20px_50px_rgba(251,191,36,0.4)] group-hover:scale-105 transition-transform">
                                                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-5xl md:text-6xl overflow-hidden">
                                                        {ranking[0].profile?.avatar_url || '👤'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[var(--card-bg)] border-2 border-amber-400/50 rounded-[2rem] p-6 text-center min-w-[160px] md:min-w-[180px] shadow-2xl backdrop-blur-xl">
                                                <div className="text-sm font-bold truncate max-w-[140px] capitalize tracking-tight text-amber-500 mb-1">
                                                    {ranking[0].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-4xl font-bold text-amber-500">
                                                    {ranking[0].puntos_totales}
                                                </div>
                                                <div className="text-[10px] font-medium text-amber-500/60 capitalize tracking-tight">PUNTOS</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 3ro */}
                                    {ranking.length >= 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex flex-col items-center cursor-pointer group"
                                            onClick={() => router.push(`/perfil/${ranking[2].user_id}`)}
                                        >
                                            <div className="relative mb-4">
                                                <span className="text-3xl absolute -top-5 -left-2 z-10">🥉</span>
                                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--card-bg)] border-4 border-orange-400 p-1 shadow-2xl group-hover:scale-110 transition-transform">
                                                    <div className="w-full h-full rounded-full bg-[var(--background)] flex items-center justify-center text-3xl overflow-hidden sepia-[.2]">
                                                        {ranking[2].profile?.avatar_url || '👤'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[1.5rem] p-4 text-center min-w-[120px] shadow-lg">
                                                <div className="text-[11px] font-bold truncate max-w-[100px] capitalize tracking-tight mb-1">
                                                    {ranking[2].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-2xl font-bold text-orange-400">
                                                    {ranking[2].puntos_totales}
                                                </div>
                                                <div className="text-[9px] font-medium text-[var(--text-muted)] capitalize tracking-tight opacity-60">PUNTOS</div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabla */}
                    <div className="px-6 mb-12">
                        <div className="max-w-4xl mx-auto">
                            {loading ? (
                                <div className="text-center py-20 font-black italic capitalize tracking-widest text-[var(--text-muted)] animate-pulse">Analizando ranking...</div>
                            ) : ranking.length === 0 ? (
                                <div className="text-center py-20 bg-[var(--card-bg)] rounded-[2rem] border border-[var(--card-border)]">
                                    <span className="text-6xl mb-6 block">📊</span>
                                    <h3 className="text-xl font-black italic capitalize tracking-tighter mb-2">Sin datos todavía</h3>
                                    <p className="text-sm text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                                        ¡Sumate al prode hoy mismo!
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-[var(--card-bg)] rounded-[2.5rem] border border-[var(--card-border)] overflow-hidden shadow-2xl">
                                    <div className="overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="bg-[var(--background)]/50 border-b border-[var(--card-border)]">
                                                <tr>
                                                    <th className="p-5 text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)]">POS</th>
                                                    <th className="p-5 text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)]">JUGADOR</th>
                                                    <th className="p-5 text-center text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)]">PTS</th>
                                                    <th className="p-5 text-center text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)]">EXACTOS</th>
                                                    <th className="p-5 text-center text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)]">PJ</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--card-border)]">
                                                {ranking.map((jugador, index) => {
                                                    const isMe = user?.id === jugador.user_id
                                                    return (
                                                        <tr
                                                            key={jugador.id}
                                                            onClick={() => router.push(`/perfil/${jugador.user_id}`)}
                                                            className={`transition-colors cursor-pointer group ${isMe ? 'bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10' : 'hover:bg-[var(--hover-bg)]'}`}
                                                        >
                                                            <td className="p-5">
                                                                <div className="flex flex-col items-center">
                                                                    <span className={`font-black text-base ${getPosicionColor(index + 1)}`}>
                                                                        {getPosicionEmoji(index + 1)}
                                                                    </span>
                                                                    <span className="text-[8px] font-black text-[var(--text-muted)] capitalize tracking-tighter mt-1">
                                                                        {periodo}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-[var(--background)] border border-[var(--card-border)] flex items-center justify-center text-xl overflow-hidden shadow-sm group-hover:border-[var(--accent)] transition-colors">
                                                                        {jugador.profile?.avatar_url || '👤'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-sm">{jugador.profile?.username}</div>
                                                                        <div className="text-[10px] text-[var(--text-muted)] font-black capitalize tracking-widest">{jugador.profile?.equipo || 'Amante del fútbol'}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-5 text-center">
                                                                <span className="font-black text-lg text-[var(--accent)]">
                                                                    {periodo === 'global' ? jugador.puntos_totales : periodo === 'mensual' ? jugador.puntos_mensuales : jugador.puntos_semanales}
                                                                </span>
                                                            </td>
                                                            <td className="p-5 text-center font-bold text-sm">{jugador.aciertos_exactos}</td>
                                                            <td className="p-5 text-center font-bold text-sm text-[var(--text-muted)]">{jugador.partidos_jugados}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 mt-12 mb-8">
                        <div className="max-w-4xl mx-auto">
                            <ClubRanking />
                        </div>
                    </div>
                </main>
            </PullToRefresh >

            <NavBar />
        </>
    )
}
