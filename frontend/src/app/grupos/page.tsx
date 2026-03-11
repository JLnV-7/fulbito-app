// src/app/grupos/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGrupos } from '@/hooks/useGrupos'
import { useAuth } from '@/contexts/AuthContext'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { CrearGrupoForm } from '@/components/grupos/CrearGrupoForm'
import { UnirseGrupoForm } from '@/components/grupos/UnirseGrupoForm'
import { PullToRefresh } from '@/components/PullToRefresh'

export default function GruposPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { grupos, loading } = useGrupos()

    const [view, setView] = useState<'list' | 'create' | 'join'>('list')
    const [search, setSearch] = useState('')

    const filteredGrupos = grupos.filter(g => g.nombre.toLowerCase().includes(search.toLowerCase()))

    if (!user && !loading) {
        router.push('/login')
        return null
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <>
            <DesktopNav />
            <PullToRefresh onRefresh={async () => { /* Add refresh logic if useGrupos exposes refetch, else dummy */ window.location.reload() }}>
                <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                    <div className="px-6 py-6 md:py-8">
                        <div className="max-w-4xl mx-auto">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                                        Grupos de Amigos 🤝
                                    </h1>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Jugá torneos privados con tus amigos y competí por el podio.
                                    </p>
                                </div>

                                {view === 'list' && grupos.length > 0 && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setView('join')}
                                            className="px-4 py-2 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] 
                                                 text-sm font-medium hover:bg-[var(--hover-bg)] transition-all"
                                        >
                                            Unirse con Código
                                        </button>
                                        <button
                                            onClick={() => setView('create')}
                                            className="px-4 py-2 rounded-xl bg-[#16a34a] text-white 
                                                 text-sm font-bold hover:bg-[#059669] transition-all shadow-lg shadow-[#16a34a]/20"
                                        >
                                            + Crear Grupo
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <AnimatePresence mode="wait">
                                {view === 'list' && (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-6"
                                    >
                                        {/* Sticky Search Bar */}
                                        {grupos.length > 0 && (
                                            <div className="sticky top-0 z-10 bg-[var(--background)] py-4 backdrop-blur-md bg-opacity-90 -mx-6 px-6 mb-2 mt-4 transition-all">
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">🔍</span>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar grupos, amigos o torneos..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        className="w-full bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#16a34a] transition-colors shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {grupos.length === 0 ? (
                                            <div className="text-center py-16 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
                                                <div className="text-6xl mb-4">👋</div>
                                                <h3 className="text-xl font-bold mb-2">No tenés grupos todavía</h3>
                                                <p className="text-[var(--text-muted)] max-w-sm mx-auto mb-6">
                                                    Creá uno para invitar a tus amigos o pediles el código para unirte al suyo.
                                                </p>
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => setView('join')}
                                                        className="px-4 py-2 rounded-xl border border-[var(--card-border)] hover:bg-[var(--hover-bg)]"
                                                    >
                                                        Tengo un código
                                                    </button>
                                                    <button
                                                        onClick={() => setView('create')}
                                                        className="px-4 py-2 rounded-xl bg-[#16a34a] text-white font-bold"
                                                    >
                                                        Crear Grupo
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {filteredGrupos.map((grupo) => (
                                                    <motion.div
                                                        key={grupo.id}
                                                        layoutId={grupo.id}
                                                        onClick={() => router.push(`/grupos/${grupo.id}`)}
                                                        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5
                                                             hover:border-[#16a34a]/50 cursor-pointer transition-all hover:shadow-md group"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#16a34a] to-emerald-400 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                                                                    🏆
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <h3 className="text-base font-bold group-hover:text-[#16a34a] transition-colors line-clamp-1">{grupo.nombre}</h3>
                                                                        {(grupo as any).unread_count > 0 && (
                                                                            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                                                                                {(grupo as any).unread_count}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                                                        👥 {grupo.miembros_count || 0} miembros
                                                                        {((grupo.miembros_count || 0) > 2) && (
                                                                            <span className="ml-1 bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded font-bold">🔥 Actividad alta</span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {(grupo as any).mi_posicion && (
                                                                <span className={`text-xs font-bold px-2 py-1 rounded-lg
                                                                ${(grupo as any).mi_posicion === 1 ? 'bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30' :
                                                                        (grupo as any).mi_posicion === 2 ? 'bg-[#c0c0c0]/10 text-[#c0c0c0] border border-[#c0c0c0]/30' :
                                                                            (grupo as any).mi_posicion === 3 ? 'bg-[#cd7f32]/10 text-[#cd7f32] border border-[#cd7f32]/30' :
                                                                                'bg-[var(--background)] text-[var(--text-muted)]'
                                                                    }`}>
                                                                    #{(grupo as any).mi_posicion}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-1 mb-3">
                                                            <span className="flex items-center gap-1 font-mono bg-[var(--background)] px-1.5 py-0.5 rounded">
                                                                #{grupo.codigo_invitacion}
                                                            </span>
                                                            <span className="flex items-center gap-1 font-bold text-[#16a34a]">
                                                                ⭐ {(grupo as any).mi_puntos || 0} pts
                                                            </span>
                                                        </div>

                                                        {/* Last Message Preview */}
                                                        <div className="mt-4 p-3 bg-[#16a34a]/5 rounded-xl border border-[#16a34a]/10 flex flex-col gap-1 relative overflow-hidden">
                                                            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[var(--card-bg)] to-transparent pointer-events-none" />
                                                            <p className="text-xs text-[var(--text-muted)] line-clamp-1 italic pr-4">
                                                                <span className="font-bold text-[var(--foreground)] not-italic relative mr-1">
                                                                    <span className="absolute -left-1.5 top-0.5 w-[3px] h-[3px] rounded-full bg-[#16a34a]" />
                                                                    Lucas:
                                                                </span>
                                                                "Típico que se le escapa en el último minuto..."
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {view === 'create' && (
                                    <motion.div
                                        key="create"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <CrearGrupoForm onCancel={() => setView('list')} />
                                    </motion.div>
                                )}

                                {view === 'join' && (
                                    <motion.div
                                        key="join"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                    >
                                        <UnirseGrupoForm onCancel={() => setView('list')} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </main>
            </PullToRefresh>
            <NavBar />
        </>
    )
}
