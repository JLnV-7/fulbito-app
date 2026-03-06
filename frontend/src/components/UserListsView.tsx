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
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    Mis Listas
                </h2>
                {isOwnProfile && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[var(--accent)] text-white p-2 rounded-xl hover:brightness-110 transition-colors shadow-sm"
                    >
                        <ListPlus size={18} />
                    </button>
                )}
            </div>

            {lists.length === 0 ? (
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
