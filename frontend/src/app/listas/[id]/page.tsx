// src/app/listas/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, Share2, Lock, Trash2, Hash, GripVertical, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserLists, type UserList } from '@/hooks/useUserLists'
import { useToast } from '@/contexts/ToastContext'
import { TeamLogo } from '@/components/TeamLogo'

export default function ListDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { fetchListDetails, deleteList, removeFromList } = useUserLists()
    const { showToast } = useToast()

    const [list, setList] = useState<UserList | null>(null)
    const [loading, setLoading] = useState(true)

    const listId = params.id as string
    const isOwner = user && list && user.id === list.user_id

    useEffect(() => {
        if (!listId) return

        const load = async () => {
            const data = await fetchListDetails(listId)
            setList(data)
            setLoading(false)
        }
        load()
    }, [listId, fetchListDetails])

    const handleDeleteList = async () => {
        if (!confirm('¿Seguro que querés eliminar esta lista? Esta acción no se puede deshacer.')) return

        const success = await deleteList(listId)
        if (success) {
            showToast('Lista eliminada', 'success')
            router.push('/perfil')
        } else {
            showToast('Error al eliminar', 'error')
        }
    }

    const handleRemoveItem = async (itemId: string) => {
        const success = await removeFromList(itemId, listId)
        if (success && list) {
            setList({
                ...list,
                items: list.items?.filter(i => i.id !== itemId)
            })
            showToast('Partido removido', 'success')
        }
    }

    const handleShare = async () => {
        if (!list) return
        const url = `${window.location.origin}/listas/${list.id}`
        if (navigator.share) {
            try {
                await navigator.share({
                    title: list.title,
                    text: list.description || `Mirá esta lista de partidos en FutLog: ${list.title}`,
                    url
                })
            } catch { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(url)
            showToast('Link copiado al portapapeles', 'success')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    if (!list) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6">
                <h1 className="text-2xl font-bold mb-2 text-center text-[var(--foreground)]">Lista no encontrada</h1>
                <p className="text-[var(--text-muted)] text-center mb-6">Puede que haya sido eliminada o sea privada.</p>
                <button onClick={() => router.back()} className="px-6 py-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full hover:bg-[var(--hover-bg)] transition-colors">
                    Volver
                </button>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--card-border)]">
                <div className="flex items-center justify-between p-4 max-w-3xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-[var(--hover-bg)] rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>

                    <div className="flex items-center gap-2">
                        {list.is_public && (
                            <button onClick={handleShare} className="p-2 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] rounded-full transition-colors">
                                <Share2 size={20} />
                            </button>
                        )}
                        {isOwner && (
                            <button onClick={handleDeleteList} className="p-2 hover:bg-red-500/10 text-red-500 rounded-full transition-colors">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto p-6 md:p-8">
                {/* List Info */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        {!list.is_public && <Lock size={16} className="text-[var(--text-muted)]" />}
                        <h1 className="text-3xl sm:text-4xl font-black leading-tight">{list.title}</h1>
                    </div>
                    {list.description && (
                        <p className="text-[var(--text-muted)] whitespace-pre-wrap leading-relaxed mb-4">
                            {list.description}
                        </p>
                    )}
                    <div className="flex items-center gap-4 text-xs font-semibold text-[var(--text-muted)]">
                        <span className="bg-[var(--card-bg)] border border-[var(--card-border)] px-3 py-1.5 rounded-full">
                            {list.items?.length || 0} partidos
                        </span>
                        <span>Actualizada {new Date(list.updated_at).toLocaleDateString()}</span>
                    </div>
                </motion.div>

                {/* List Items */}
                <div className="space-y-4">
                    {(!list.items || list.items.length === 0) ? (
                        <div className="text-center py-12 border-2 border-dashed border-[var(--card-border)] rounded-3xl">
                            <span className="text-4xl mb-4 block opacity-50">🏟️</span>
                            <p className="text-[var(--text-muted)] font-medium">Esta lista está vacía.</p>
                        </div>
                    ) : (
                        list.items.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group flex gap-4 bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-2xl hover:border-[var(--accent)] hover:shadow-lg hover:shadow-[var(--accent)]/5 transition-all"
                            >
                                {/* Index Column */}
                                <div className="flex flex-col items-center justify-center shrink-0 w-8 text-[var(--text-muted)]">
                                    <span className="font-bold text-lg">{index + 1}</span>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <Link href={`/partido/${item.partido_id}`} className="block">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 min-w-0 pr-4">
                                                <TeamLogo teamName={item.equipo_local} src={item.logo_local} size={28} />
                                                <span className="font-bold text-sm sm:text-base truncate">{item.equipo_local}</span>
                                            </div>
                                            <span className="text-[var(--text-muted)] font-black text-xs px-2">VS</span>
                                            <div className="flex items-center gap-2 min-w-0 pl-4">
                                                <span className="font-bold text-sm sm:text-base truncate">{item.equipo_visitante}</span>
                                                <TeamLogo teamName={item.equipo_visitante} src={item.logo_visitante} size={28} />
                                            </div>
                                        </div>
                                    </Link>

                                    {item.comment && (
                                        <div className="mt-2 text-sm text-[var(--text-muted)] bg-[var(--hover-bg)] p-3 rounded-xl border border-[var(--card-border)]/50">
                                            "{item.comment}"
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {isOwner && (
                                    <div className="flex flex-col justify-center shrink-0 border-l border-[var(--card-border)] pl-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-red-500/50 hover:text-red-500 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                            title="Quitar de la lista"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </main>
    )
}
