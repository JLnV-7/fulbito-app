// src/app/grupos/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useGrupos } from '@/hooks/useGrupos'
import { useToast } from '@/contexts/ToastContext'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { PartidosAmigosTab } from '@/components/grupos/PartidosAmigosTab'
import { CommentSection } from '@/components/CommentSection'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { motion } from 'framer-motion'
import type { GrupoProde } from '@/types'

interface MiembroGrupo {
    user_id: string
    puntos_grupo: number
    joined_at: string
    profile?: {
        id: string
        username: string | null
        avatar_url: string | null
        equipo: string | null
    }
    puntos_mostrados: number
}

export default function GrupoDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { salirDeGrupo } = useGrupos()
    const { showToast } = useToast()

    const [grupo, setGrupo] = useState<GrupoProde | null>(null)
    const [miembros, setMiembros] = useState<MiembroGrupo[]>([])
    const [loading, setLoading] = useState(true)
    const [confirmandoSalir, setConfirmandoSalir] = useState(false)
    const [procesando, setProcesando] = useState(false)
    const [activeTab, setActiveTab] = useState<'ranking' | 'partidos' | 'chat'>('ranking')

    useEffect(() => {
        if (id && user) fetchGrupoData()
    }, [id, user])

    const fetchGrupoData = async () => {
        try {
            const { data: grupoData, error: errorGrupo } = await supabase
                .from('grupos_prode')
                .select('*')
                .eq('id', id)
                .single()

            if (errorGrupo) throw errorGrupo
            setGrupo(grupoData)

            const { data: miembrosData, error: errorMiembros } = await supabase
                .from('miembros_grupo')
                .select(`puntos_grupo, joined_at, user_id`)
                .eq('grupo_id', id)
                .order('puntos_grupo', { ascending: false })

            if (errorMiembros) throw errorMiembros

            const userIds = miembrosData.map(m => m.user_id)

            // Fetch Profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', userIds)

            // Fetch Rakings (Global Points)
            const { data: rankings } = await supabase
                .from('ranking_prode')
                .select('user_id, puntos_totales')
                .in('user_id', userIds)

            const miembrosWithData = miembrosData.map(m => {
                const ranking = rankings?.find(r => r.user_id === m.user_id)
                return {
                    ...m,
                    profile: profiles?.find(p => p.id === m.user_id),
                    // Usamos puntos globales para el ranking del grupo por ahora
                    puntos_mostrados: ranking?.puntos_totales || 0
                }
            })

            // Ordenar por puntos globales
            miembrosWithData.sort((a, b) => b.puntos_mostrados - a.puntos_mostrados)

            setMiembros(miembrosWithData)
        } catch (error) {
            console.error('Error fetching group:', error)
            router.push('/grupos')
        } finally {
            setLoading(false)
        }
    }

    const copiarCodigo = () => {
        if (grupo?.codigo_invitacion) {
            navigator.clipboard.writeText(grupo.codigo_invitacion)
            showToast('Código copiado: ' + grupo.codigo_invitacion, 'success')
        }
    }

    const compartirWhatsApp = () => {
        if (!grupo) return
        const texto = `¡Unite a mi grupo "${grupo.nombre}" en Fulbito! 🎯⚽\n\nCódigo: ${grupo.codigo_invitacion}`
        const url = `https://wa.me/?text=${encodeURIComponent(texto)}`
        window.open(url, '_blank')
    }

    const handleSalirGrupo = async () => {
        if (!grupo) return
        setProcesando(true)
        try {
            await salirDeGrupo(grupo.id)
            showToast('Saliste del grupo', 'success')
            router.push('/grupos')
        } catch (error: any) {
            showToast(error.message, 'error')
        } finally {
            setProcesando(false)
            setConfirmandoSalir(false)
        }
    }

    const esAdmin = user?.id === grupo?.admin_id

    if (loading) return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <LoadingSpinner />
        </div>
    )

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">

                {/* Header del Grupo */}
                <div className="bg-[#10b981] text-white pt-10 pb-20 px-6 rounded-b-[40px] shadow-lg">
                    <div className="max-w-4xl mx-auto flex justify-between items-start">
                        <button onClick={() => router.push('/grupos')} className="bg-white/20 p-2 rounded-full backdrop-blur-md">←</button>
                        <div className="text-center flex-1">
                            <h1 className="text-3xl font-black">{grupo?.nombre}</h1>
                            <p className="opacity-80 text-sm mt-1">
                                {miembros.length} miembro{miembros.length !== 1 ? 's' : ''} • Ranking de Amigos
                            </p>
                        </div>
                        <button onClick={copiarCodigo} className="bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md font-mono text-sm">
                            #{grupo?.codigo_invitacion}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-4xl mx-auto px-6 -mt-5 mb-4">
                    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-1 flex shadow-lg">
                        <button
                            onClick={() => setActiveTab('ranking')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'ranking'
                                ? 'bg-[#10b981] text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            🏆 Ranking Pronósticos
                        </button>
                        <button
                            onClick={() => setActiveTab('partidos')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'partidos'
                                ? 'bg-[#10b981] text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            ⚽ Partidos
                        </button>
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'chat'
                                ? 'bg-[#10b981] text-white shadow-md'
                                : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
                                }`}
                        >
                            💬 Chat
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="max-w-4xl mx-auto px-6">
                    {activeTab === 'ranking' ? (
                        <>
                            {/* Lista de Miembros */}
                            <div className="bg-[var(--card-bg)] rounded-3xl shadow-xl border border-[var(--card-border)] overflow-hidden">
                                {miembros.map((miembro, index) => (
                                    <motion.div
                                        key={miembro.user_id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex items-center gap-4 p-5 border-b border-[var(--card-border)] last:border-0
                                   ${index === 0 ? 'bg-[#ffd700]/5' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                        ${index === 0 ? 'bg-[#ffd700] text-black' :
                                                index === 1 ? 'bg-[#c0c0c0] text-black' :
                                                    index === 2 ? 'bg-[#cd7f32] text-black' : 'bg-[var(--background)] text-[var(--text-muted)]'}`}>
                                            {index + 1}
                                        </div>

                                        <div className="w-10 h-10 bg-[var(--background)] rounded-full border border-[var(--card-border)] overflow-hidden flex items-center justify-center text-lg shadow-sm">
                                            {miembro.profile?.avatar_url || '👤'}
                                        </div>

                                        <div className="flex-1">
                                            <div className="font-bold flex items-center gap-2">
                                                {miembro.profile?.username || 'Usuario'}
                                                {miembro.user_id === grupo?.admin_id && (
                                                    <span className="text-[9px] bg-[#ffd700]/20 text-[#ffd700] px-2 py-0.5 rounded-full">ADMIN</span>
                                                )}
                                                {miembro.user_id === user?.id && (
                                                    <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-full">VOS</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-[var(--text-muted)] uppercase">{miembro.profile?.equipo || 'Hincha'}</div>
                                        </div>

                                        <div className="text-right">
                                            <div className={`text-xl font-black ${index === 0 ? 'text-[#ffd700]' : 'text-[#10b981]'}`}>{miembro.puntos_mostrados}</div>
                                            <div className="text-[9px] text-[var(--text-muted)] uppercase">Pts</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Acciones */}
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Invitar */}
                                <div className="p-6 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
                                    <h4 className="font-bold mb-2">¿Falta alguien?</h4>
                                    <p className="text-xs text-[var(--text-muted)] mb-4">Invitá amigos a sumarse</p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={compartirWhatsApp}
                                            className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                                        >
                                            <span>📱</span> WhatsApp
                                        </button>
                                        <button
                                            onClick={copiarCodigo}
                                            className="px-4 py-3 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-sm"
                                        >
                                            📋 Copiar
                                        </button>
                                    </div>
                                </div>

                                {/* Salir del grupo */}
                                {!esAdmin && (
                                    <div className="p-6 bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)]">
                                        <h4 className="font-bold mb-2 text-[#ef4444]">⚠️ Zona peligrosa</h4>
                                        <p className="text-xs text-[var(--text-muted)] mb-4">Si salís, perdés tu posición en este grupo</p>

                                        {confirmandoSalir ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSalirGrupo}
                                                    disabled={procesando}
                                                    className="flex-1 bg-[#ef4444] text-white py-3 rounded-xl font-bold disabled:opacity-50"
                                                >
                                                    {procesando ? 'Saliendo...' : 'Sí, salir'}
                                                </button>
                                                <button
                                                    onClick={() => setConfirmandoSalir(false)}
                                                    className="px-6 py-3 text-[var(--text-muted)]"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmandoSalir(true)}
                                                className="w-full py-3 border-2 border-[#ef4444] text-[#ef4444] rounded-xl font-bold hover:bg-[#ef4444]/10 transition-all"
                                            >
                                                Salir del grupo
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : activeTab === 'partidos' ? (
                        /* Partidos Amigos Tab */
                        grupo && <PartidosAmigosTab grupo={grupo} />
                    ) : (
                        /* Chat Tab */
                        grupo && (
                            <div className="mt-2">
                                <CommentSection partidoId={`grupo-${grupo.id}`} />
                            </div>
                        )
                    )}
                </div>

            </main>
            <NavBar />
        </>
    )
}

