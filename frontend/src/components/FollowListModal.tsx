// src/components/FollowListModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, UserCheck, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { LoadingSpinner } from './LoadingSpinner'
import confetti from 'canvas-confetti'
import type { Profile } from '@/types'
import { FollowRecommendations } from './FollowRecommendations'

export type FollowListType = 'followers' | 'following'

interface FollowListModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    type: FollowListType
    title: string
}

interface FollowListUser extends Profile {
    is_following?: boolean
}

export function FollowListModal({ isOpen, onClose, userId, type, title }: FollowListModalProps) {
    const { user: currentUser } = useAuth()
    const router = useRouter()
    const [users, setUsers] = useState<FollowListUser[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (!isOpen || !userId) return

        const fetchUsers = async () => {
            setLoading(true)
            try {
                let dataToMap = []

                if (type === 'followers') {
                    // People following the user
                    const { data, error } = await supabase
                        .from('user_follows')
                        .select('follower:profiles!user_follows_follower_id_fkey(*)')
                        .eq('following_id', userId)

                    if (error) throw error
                    dataToMap = data?.map(d => d.follower) || []
                } else {
                    // People the user is following
                    const { data, error } = await supabase
                        .from('user_follows')
                        .select('following:profiles!user_follows_following_id_fkey(*)')
                        .eq('follower_id', userId)

                    if (error) throw error
                    // Ensure the 'following' object is singular, if joining returns an array or object
                    dataToMap = data?.map(d => Array.isArray(d.following) ? d.following[0] : d.following) || []
                }

                // If logged in, fetch who the current logged-in user is following to show "Follow/Following" buttons
                if (currentUser && dataToMap.length > 0) {
                    const { data: myFollows } = await supabase
                        .from('user_follows')
                        .select('following_id')
                        .eq('follower_id', currentUser.id)

                    const myFollowSet = new Set(myFollows?.map(f => f.following_id) || [])

                    dataToMap = dataToMap.map((u: any) => ({
                        ...u,
                        is_following: myFollowSet.has(u.id)
                    }))
                }

                setUsers(dataToMap.filter(u => u)) // Filter out nulls
            } catch (err) {
                console.error(`Error fetching ${type}:`, err)
            } finally {
                setLoading(false)
            }
        }

        fetchUsers()
    }, [isOpen, userId, type, currentUser])

    const handleToggleFollow = async (e: React.MouseEvent, targetId: string) => {
        e.stopPropagation()
        if (!currentUser) {
            router.push('/login')
            return
        }

        const targetUser = users.find(u => u.id === targetId)
        if (!targetUser) return

        const wasFollowing = targetUser.is_following

        // Optimistic update
        setUsers(prev => prev.map(u =>
            u.id === targetId ? { ...u, is_following: !wasFollowing } : u
        ))

        try {
            if (wasFollowing) {
                await supabase
                    .from('user_follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', targetId)
            } else {
                await supabase
                    .from('user_follows')
                    .insert({ follower_id: currentUser.id, following_id: targetId })
            }
        } catch (err) {
            // Revert
            console.error('Error toggling follow:', err)
            setUsers(prev => prev.map(u =>
                u.id === targetId ? { ...u, is_following: wasFollowing } : u
            ))
        }
    }

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.equipo?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: '100%', opacity: 0.5 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-md bg-[var(--background)] sm:rounded-3xl rounded-t-3xl border border-[var(--card-border)] overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[80vh] shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                        <h2 className="text-lg font-black">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="p-4 border-b border-[var(--card-border)] bg-[var(--background)]">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar usuario..."
                                className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#10b981] transition-colors"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-12 text-[var(--text-muted)] px-6">
                                <p className="text-4xl mb-3">👻</p>
                                <p className="text-sm">
                                    {searchQuery ? 'No se encontraron usuarios.' : `No hay nada que mostrar acá.`}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[var(--card-border)]">
                                {filteredUsers.map(userItem => (
                                    <div
                                        key={userItem.id}
                                        className="flex items-center justify-between p-4 hover:bg-[var(--hover-bg)] transition-colors cursor-pointer group"
                                        onClick={() => {
                                            onClose()
                                            router.push(`/perfil/${userItem.id}`)
                                        }}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#10b981] to-[#3b82f6] shrink-0 border border-[var(--card-border)] flex items-center justify-center text-white text-sm font-bold overflow-hidden shadow-sm group-hover:ring-2 group-hover:ring-[#10b981]/50 transition-all">
                                                {userItem.avatar_url ? (
                                                    <img src={userItem.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    userItem.username?.charAt(0)?.toUpperCase() || '?'
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[#10b981] transition-colors">
                                                    {userItem.username || 'Usuario'}
                                                </span>
                                                {userItem.equipo && (
                                                    <span className="text-[10px] text-[var(--text-muted)] truncate flex items-center gap-1">
                                                        <span>🛡️</span> {userItem.equipo}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        {currentUser && currentUser.id !== userItem.id && (
                                            <button
                                                onClick={(e) => handleToggleFollow(e, userItem.id)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 min-w-[100px]
                                                    ${userItem.is_following
                                                        ? 'bg-[var(--hover-bg)] text-[var(--text-muted)] border border-[var(--card-border)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30'
                                                        : 'bg-[#10b981] text-white hover:bg-[#059669] shadow-sm'
                                                    }`}
                                            >
                                                {userItem.is_following ? (
                                                    <>
                                                        <UserCheck size={14} className="group-hover:hidden" />
                                                        <span className="group-hover:hidden">Siguiendo</span>
                                                        <span className="hidden group-hover:inline">Dejar de seguir</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={14} />
                                                        Seguir
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recommendations - Only show when viewing 'following' to encourage more follows */}
                    {type === 'following' && (
                        <div className="border-t border-[var(--card-border)] bg-[var(--background)] px-4">
                            <FollowRecommendations />
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
