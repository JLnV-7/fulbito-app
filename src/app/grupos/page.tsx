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

export default function GruposPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { grupos, loading } = useGrupos()

    const [view, setView] = useState<'list' | 'create' | 'join'>('list')

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
                                        className="px-4 py-2 rounded-xl bg-[#10b981] text-white 
                                                 text-sm font-bold hover:bg-[#059669] transition-all shadow-lg shadow-[#10b981]/20"
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
                                                    className="px-4 py-2 rounded-xl bg-[#10b981] text-white font-bold"
                                                >
                                                    Crear Grupo
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {grupos.map((grupo) => (
                                                <motion.div
                                                    key={grupo.id}
                                                    layoutId={grupo.id}
                                                    onClick={() => router.push(`/grupos/${grupo.id}`)}
                                                    className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5
                                                             hover:border-[#10b981]/50 cursor-pointer transition-all hover:scale-[1.02] group"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h3 className="text-lg font-bold group-hover:text-[#10b981] transition-colors">{grupo.nombre}</h3>
                                                        {grupo.mi_posicion && (
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg
                                                                ${grupo.mi_posicion === 1 ? 'bg-[#ffd700]/20 text-[#ffd700]' :
                                                                    grupo.mi_posicion === 2 ? 'bg-[#c0c0c0]/20 text-[#c0c0c0]' :
                                                                        grupo.mi_posicion === 3 ? 'bg-[#cd7f32]/20 text-[#cd7f32]' :
                                                                            'bg-[var(--background)] text-[var(--text-muted)]'
                                                                }`}>
                                                                #{grupo.mi_posicion}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2 min-h-[40px]">
                                                        {grupo.descripcion || 'Grupo de amigos'}
                                                    </p>
                                                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                                        <span className="flex items-center gap-1 font-mono bg-[var(--background)] px-1.5 py-0.5 rounded">
                                                            #{grupo.codigo_invitacion}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            👥 {grupo.miembros_count}
                                                        </span>
                                                        <span className="flex items-center gap-1 font-bold text-[#10b981]">
                                                            ⭐ {grupo.mi_puntos || 0} pts
                                                        </span>
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
            <NavBar />
        </>
    )
}
