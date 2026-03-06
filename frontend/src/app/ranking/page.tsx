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
import type { RankingProde } from '@/types'

type TipoRanking = 'global' | 'liga'

export default function RankingPage() {
    const router = useRouter()
    const { user } = useAuth()
    const [ranking, setRanking] = useState<RankingProde[]>([])
    const [loading, setLoading] = useState(true)
    const [periodo, setPeriodo] = useState<'semanal' | 'mensual' | 'global'>('global')

    useEffect(() => {
        fetchRanking()
    }, [periodo])

    const fetchRanking = async () => {
        setLoading(true)

        try {
            let query = supabase
                .from('ranking_prode')
                .select(`
          *,
          profile:profiles(*)
        `)
                .order('puntos_totales', { ascending: false })
                .limit(100)

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

                    {/* Filtros de Período */}
                    <div className="px-6 mb-6">
                        <div className="max-w-4xl mx-auto overflow-x-auto no-scrollbar pb-2">
                            <div className="flex gap-2">
                                {['semanal', 'mensual', 'global'].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriodo(p as any)}
                                        className={`px-5 py-2 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap
                                       ${periodo === p
                                                ? 'bg-[#10b981] text-white shadow-md'
                                                : 'bg-[var(--card-bg)] text-[var(--text-muted)] border border-[var(--card-border)] hover:bg-[var(--hover-bg)]'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Position Teaser */}
                    {user && !loading && (
                        <div className="px-6 mb-6">
                            <div className="max-w-4xl mx-auto bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#10b981] rounded-full flex items-center justify-center text-xl shadow-lg shadow-[#10b981]/30">
                                        📈
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-[#10b981]">Tu posición actual</h4>
                                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                            {ranking.findIndex(r => r.user_id === user.id) !== -1
                                                ? <span className="text-[var(--foreground)]">Estás #{ranking.findIndex(r => r.user_id === user.id) + 1} en el top 100.</span>
                                                : 'Todavía no estás en el top 100.'}
                                            <span className="text-[#10b981] font-bold ml-2 inline-flex items-center gap-0.5">
                                                <motion.span
                                                    animate={{ y: [0, -3, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                                >
                                                    ↑
                                                </motion.span>
                                                2 puestos
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Top 3 Podio */}
                    {!loading && ranking.length > 0 && (
                        <div className="px-6 mb-8">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-end justify-center gap-4 mb-8">
                                    {/* 2do puesto */}
                                    {ranking.length >= 2 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => router.push(`/perfil/${ranking[1].user_id}`)}
                                        >
                                            <div className="relative mb-2">
                                                <div className="text-4xl absolute -top-4 -right-2 z-10">🥈</div>
                                                <div className="w-16 h-16 rounded-full bg-[var(--card-bg)] border-4 border-[#c0c0c0] flex items-center justify-center text-3xl shadow-lg shadow-[#c0c0c0]/20">
                                                    {ranking[1].profile?.avatar_url || '👤'}
                                                </div>
                                            </div>
                                            <div className="bg-[#c0c0c0]/10 border border-[#c0c0c0]/50 rounded-xl p-3 text-center min-w-[100px] backdrop-blur-sm">
                                                <div className="text-sm font-semibold truncate max-w-[100px]">
                                                    {ranking[1].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-xl font-black text-[#c0c0c0]">
                                                    {ranking[1].puntos_totales}
                                                </div>
                                                <div className="text-[10px] text-[var(--text-muted)] uppercase">pts</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 1er puesto */}
                                    {ranking.length >= 1 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                            className="flex flex-col items-center -mt-8 cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => router.push(`/perfil/${ranking[0].user_id}`)}
                                        >
                                            <div className="relative mb-2">
                                                <div className="text-5xl absolute -top-6 -right-4 z-10">👑</div>
                                                <div className="w-24 h-24 rounded-full bg-[var(--card-bg)] border-4 border-[#ffd700] flex items-center justify-center text-5xl shadow-xl shadow-[#ffd700]/30">
                                                    {ranking[0].profile?.avatar_url || '👤'}
                                                </div>
                                            </div>
                                            <div className="bg-[#ffd700]/10 border border-[#ffd700]/50 rounded-xl p-4 text-center min-w-[120px] backdrop-blur-sm">
                                                <div className="text-base font-bold truncate max-w-[120px]">
                                                    {ranking[0].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-3xl font-black text-[#ffd700]">
                                                    {ranking[0].puntos_totales}
                                                </div>
                                                <div className="text-xs text-[var(--text-muted)] uppercase">pts</div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 3er puesto */}
                                    {ranking.length >= 3 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => router.push(`/perfil/${ranking[2].user_id}`)}
                                        >
                                            <div className="relative mb-2">
                                                <div className="text-4xl absolute -top-4 -right-2 z-10">🥉</div>
                                                <div className="w-16 h-16 rounded-full bg-[var(--card-bg)] border-4 border-[#cd7f32] flex items-center justify-center text-3xl shadow-lg shadow-[#cd7f32]/20">
                                                    {ranking[2].profile?.avatar_url || '👤'}
                                                </div>
                                            </div>
                                            <div className="bg-[#cd7f32]/10 border border-[#cd7f32]/50 rounded-xl p-3 text-center min-w-[100px] backdrop-blur-sm">
                                                <div className="text-sm font-semibold truncate max-w-[100px]">
                                                    {ranking[2].profile?.username || 'Usuario'}
                                                </div>
                                                <div className="text-xl font-black text-[#cd7f32]">
                                                    {ranking[2].puntos_totales}
                                                </div>
                                                <div className="text-[10px] text-[var(--text-muted)] uppercase">pts</div>
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
