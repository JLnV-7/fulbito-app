// src/components/UserListsView.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ListPlus, Loader2 } from 'lucide-react'
import { useUserLists } from '@/hooks/useUserLists'
import { ListCard } from './ListCard'
import { AddToListModal } from './AddToListModal'

interface UserListsViewProps {
    userId: string
    isOwnProfile: boolean
}

export function UserListsView({ userId, isOwnProfile }: UserListsViewProps) {
    const { lists, loading, fetchLists } = useUserLists(userId)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        fetchLists()
    }, [fetchLists])

    if (loading) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
    }

    return (
        <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)]/50 rounded-[2rem] p-6 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[11px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2">
                    <span className="text-sm">📋</span>
                    Mis Listas
                </h2>
                {isOwnProfile && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-8 h-8 flex items-center justify-center bg-[var(--foreground)] text-[var(--background)] rounded-full hover:scale-105 active:scale-95 transition-all shadow-md"
                    >
                        <ListPlus size={16} strokeWidth={3} />
                    </button>
                )}
            </div>

            {lists.length === 0 ? (
                <div className="flex flex-col gap-4">
                    <div className="text-center py-8 bg-[var(--background)] rounded-2xl border border-dashed border-[var(--card-border)]">
                        <p className="text-[var(--text-muted)] text-sm font-medium mb-3">
                            {isOwnProfile ? 'Aún no creaste ninguna lista de partidos.' : 'Este usuario no tiene listas.'}
                        </p>
                        {isOwnProfile && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent)] px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                            >
                                Crear mi primera lista
                            </button>
                        )}
                    </div>
                    {/* Example Mock List */}
                    <div className="opacity-70 border-t border-[var(--card-border)] border-dashed pt-4">
                        <span className="text-[10px] font-black capitalize text-[var(--accent)] tracking-widest mb-4 block">Visualización de Ejemplo</span>
                        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar pointer-events-none">
                            <div className="min-w-[260px] md:min-w-[300px] shrink-0 snap-center">
                                <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-lg">Mis Favoritos de Siempre</h3>
                                        <span className="text-xl">⭐</span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mb-4">Los mejores partidos que vi en mi vida.</p>
                                    <div className="flex gap-1 -space-x-2">
                                        <div className="w-6 h-6 rounded-full bg-[var(--accent)] border-2 border-[var(--card-bg)] flex items-center justify-center text-[10px] font-black text-white">1</div>
                                        <div className="w-6 h-6 rounded-full bg-[var(--accent)] border-2 border-[var(--card-bg)] flex items-center justify-center text-[10px] font-black text-white">2</div>
                                        <div className="w-6 h-6 rounded-full bg-[var(--accent)] border-2 border-[var(--card-bg)] flex items-center justify-center text-[10px] font-black text-white">3</div>
                                    </div>
                                    <div className="mt-3 text-[10px] font-black capitalize text-[var(--text-muted)]">3 Partidos Guardados</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
                    {lists.map(list => (
                        <div key={list.id} className="min-w-[260px] md:min-w-[300px] shrink-0 snap-center transition-transform hover:scale-[1.02]">
                            <ListCard list={list} />
                        </div>
                    ))}
                </div>
            )}

            {/* We reuse the AddToListModal just to create an empty list by passing dummy matchData, but it's better to separate if we want just pure creation. 
                For now, we can pass dummy data or handle pure creation inside the modal logic.
                Actually, let's pass dummy matchData that the user won't use (since we'll only use it to open the modal and create from there). */}
            {isOwnProfile && showCreateModal && (
                <AddToListModal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false)
                        fetchLists()
                    }}
                    matchData={{ partido_id: '', equipo_local: '', equipo_visitante: '' }} // Dummy config
                />
            )}
        </div>
    )
}
