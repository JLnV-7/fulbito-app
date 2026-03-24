// src/components/UserBadgesGallery.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Lock, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export interface Badge {
    id: string
    name: string
    description: string
    icon: string
    xp_reward: number
}

export interface UserBadge {
    awarded_at: string
    badge: Badge
}

interface UserBadgesGalleryProps {
    userId: string
    isOwnProfile?: boolean
}

export function UserBadgesGallery({ userId, isOwnProfile = false }: UserBadgesGalleryProps) {
    const [unlockedBadges, setUnlockedBadges] = useState<UserBadge[]>([])
    const [allBadges, setAllBadges] = useState<Badge[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                setLoading(true)

                // Fetch all catalogue badges
                const { data: catData, error: catError } = await supabase
                    .from('badges')
                    .select('*')
                    .order('xp_reward', { ascending: true })

                if (catError) throw catError
                setAllBadges(catData || [])

                // Fetch user unlocked badges
                const { data: userData, error: userError } = await supabase
                    .from('user_badges')
                    .select(`
            awarded_at,
            badge:badges(*)
          `)
                    .eq('user_id', userId)

                if (userError) throw userError

                // Supabase join syntax wraps joined items in array sometimes or single objects. 
                // Force map it correctly.
                const parsed = (userData || []).map(u => ({
                    awarded_at: u.awarded_at,
                    badge: Array.isArray(u.badge) ? u.badge[0] : u.badge
                })) as UserBadge[]

                setUnlockedBadges(parsed)
            } catch (err) {
                console.error('Error fetching badges: ', err)
            } finally {
                setLoading(false)
            }
        }

        fetchBadges()
    }, [userId])

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)]/50 rounded-[2rem] p-6 mb-4 flex justify-center py-12 shadow-sm">
                <Loader2 className="animate-spin text-[var(--accent)]" />
            </div>
        )
    }

    const unpackedBadgesIds = new Set(unlockedBadges.map(ub => ub.badge.id))
    const unlockedIds = unpackedBadgesIds

    return (
        <div className="bg-[var(--card-bg)]/80 backdrop-blur-xl border border-[var(--card-border)]/50 rounded-[2rem] p-6 shadow-sm mb-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-[11px] font-black text-[var(--accent)] uppercase tracking-widest flex items-center gap-2">
                    <span className="text-sm">🏅</span>
                    Mis Insignias
                </h2>
                <span className="text-[10px] font-black bg-[var(--background)] px-3 py-1 rounded-full border border-[var(--card-border)] text-[var(--text-muted)]">
                    {unlockedBadges.length} / {allBadges.length}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {allBadges.map((badge, index) => {
                    const isUnlocked = unlockedIds.has(badge.id)

                    return (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            key={badge.id}
                            className={`
                relative p-4 rounded-[1.5rem] flex flex-col items-center text-center transition-all hover:scale-[1.02] duration-300
                ${isUnlocked
                                    ? 'bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30'
                                    : 'bg-[var(--card-bg)] border border-[var(--card-border)] opacity-60 grayscale'
                                }
              `}
                        >
                            <div className="text-4xl mb-3 drop-shadow-md">{badge.icon}</div>
                            <h3 className={`text-[11px] font-black leading-tight mb-2 uppercase tracking-wide ${isUnlocked ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                                {badge.name}
                            </h3>

                            {isUnlocked && (
                                <p className="text-[9px] text-[var(--text-muted)] leading-relaxed mb-3 font-medium">
                                    {badge.description}
                                </p>
                            )}

                            <div className="mt-auto">
                                {isUnlocked ? (
                                    <span className="text-[10px] font-black bg-amber-500 text-[var(--background)] px-3 py-1 rounded-full shadow-sm">
                                        +{badge.xp_reward} XP
                                    </span>
                                ) : (
                                    <div className="bg-[var(--background)] p-2 rounded-full text-[var(--text-muted)] border border-[var(--card-border)] opacity-50">
                                        <Lock size={12} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
