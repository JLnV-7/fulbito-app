'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { UserPlus, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRouter } from 'next/navigation'

interface RecommendedUser {
    id: string
    username: string
    avatar_url: string | null
    level: number
    reason: string
}

export function FollowRecommendations() {
    const { user } = useAuth()
    const { showToast } = useToast()
    const router = useRouter()
    const [recommendations, setRecommendations] = useState<RecommendedUser[]>([])
    const [loading, setLoading] = useState(true)
    const [followingCache, setFollowingCache] = useState<Record<string, boolean>>({})

    useEffect(() => {
        if (user) {
            loadRecommendations()
        }
    }, [user])

    const loadRecommendations = async () => {
        try {
            setLoading(true)

            if (!user) return

            // 1. Get current user's team
            const { data: currentUserProfile } = await supabase
                .from('profiles')
                .select('equipo')
                .eq('id', user.id)
                .single()

            const myTeam = currentUserProfile?.equipo

            // 2. Get users that the current user is already following
            const { data: followingData } = await supabase
                .from('user_follows')
                .select('following_id')
                .eq('follower_id', user.id)

            const followedIds = new Set(followingData?.map(f => f.following_id) || [])
            followedIds.add(user.id) // Exclude self

            // 3. Fetch potential matches
            // We prioritize same team, then high level
            const { data: potentialUsers, error } = await supabase
                .from('profiles')
                .select('id, username, avatar_url, level, equipo')
                .neq('id', user.id)
                .order('xp', { ascending: false })
                .limit(20)

            if (error) throw error

            const validRecommendations = potentialUsers
                .filter(u => !followedIds.has(u.id))
                .map(u => {
                    let reason = 'Usuario popular'
                    let weight = u.level || 0

                    if (myTeam && u.equipo === myTeam) {
                        reason = `También de ${myTeam} ⚪🔴`
                        weight += 100 // Boost same team
                    } else if (u.equipo) {
                        reason = `Hincha de ${u.equipo}`
                    }

                    return { ...u, reason, weight }
                })
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5) // Show max 5 in horizontal scroll

            setRecommendations(validRecommendations)
        } catch (error) {
            console.error('Error loading recommendations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFollow = async (targetId: string, username: string) => {
        if (!user) {
            router.push('/login')
            return
        }

        try {
            // Optimistic update
            setFollowingCache(prev => ({ ...prev, [targetId]: true }))

            const { error } = await supabase
                .from('user_follows')
                .insert({ follower_id: user.id, following_id: targetId })

            if (error) throw error

            showToast(`Ahora sigues a ${username}`, 'success')

            // Remove from list after a short delay
            setTimeout(() => {
                setRecommendations(prev => prev.filter(r => r.id !== targetId))
            }, 1500)

        } catch (error) {
            console.error('Error following:', error)
            setFollowingCache(prev => ({ ...prev, [targetId]: false }))
            showToast('Error al seguir usuario', 'error')
        }
    }

    if (loading) {
        return (
            <div className="py-4 space-y-3">
                <div className="h-4 w-32 bg-[var(--card-border)] rounded animate-pulse" />
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="min-w-[140px] h-36 bg-[var(--card-border)] rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (recommendations.length === 0) return null

    return (
        <div className="py-4">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                Sugerencias para ti
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                {recommendations.map(profile => {
                    const isFollowing = followingCache[profile.id]
                    return (
                        <motion.div
                            key={profile.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 min-w-[150px] flex-shrink-0 snap-start flex flex-col items-center text-center shadow-sm"
                        >
                            <div
                                className="w-14 h-14 rounded-full mb-3 cursor-pointer ring-2 ring-transparent hover:ring-[#10b981] transition-all overflow-hidden bg-[var(--hover-bg)] flex items-center justify-center text-xl"
                                onClick={() => router.push(`/perfil/${profile.id}`)}
                            >
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                ) : '👤'}
                            </div>

                            <h4
                                className="font-bold text-sm text-[var(--foreground)] truncate w-full cursor-pointer hover:underline"
                                onClick={() => router.push(`/perfil/${profile.id}`)}
                            >
                                {profile.username}
                            </h4>
                            <p className="text-[10px] text-[var(--text-muted)] truncate w-full mb-3 h-3">
                                {profile.reason}
                            </p>

                            <button
                                onClick={() => handleFollow(profile.id, profile.username)}
                                disabled={isFollowing}
                                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${isFollowing
                                    ? 'bg-[var(--background)] text-[var(--foreground)] border border-[var(--card-border)]'
                                    : 'bg-[#10b981] text-white hover:bg-[#059669] shadow-md hover:shadow-[#10b981]/20'
                                    }`}
                            >
                                {isFollowing ? (
                                    <><Check size={14} /> Siguiendo</>
                                ) : (
                                    <><UserPlus size={14} /> Seguir</>
                                )}
                            </button>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
