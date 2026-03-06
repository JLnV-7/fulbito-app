'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { UserPlus, Check } from 'lucide-react'

interface FollowButtonProps {
    targetUserId: string
    targetUsername: string
    className?: string
}

export function FollowButton({ targetUserId, targetUsername, className = '' }: FollowButtonProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [isFollowing, setIsFollowing] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || user.id === targetUserId) {
            setLoading(false)
            return
        }

        const checkFollowStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('user_follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId)
                    .maybeSingle()

                if (error) throw error
                setIsFollowing(!!data)
            } catch (err) {
                console.error('Error checking follow status:', err)
            } finally {
                setLoading(false)
            }
        }

        checkFollowStatus()
    }, [user, targetUserId])

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevenir que el click se propague al contenedor (ej. ir al perfil)

        if (!user) {
            showToast('Debes iniciar sesión para seguir usuarios', 'error')
            return
        }

        try {
            // Optimistic update
            setIsFollowing(!isFollowing)

            if (isFollowing) {
                const { error } = await supabase
                    .from('user_follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId)

                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('user_follows')
                    .insert({ follower_id: user.id, following_id: targetUserId })

                if (error) throw error
                showToast(`Ahora sigues a ${targetUsername}`, 'success')
            }
        } catch (error) {
            console.error('Error toggling follow:', error)
            setIsFollowing(prev => !prev) // Revert
            showToast('Hubo un error al actualizar', 'error')
        }
    }

    if (!user || user.id === targetUserId) return null

    if (loading) {
        return <div className="w-20 h-8 bg-[var(--card-border)] animate-pulse rounded-lg" />
    }

    return (
        <button
            onClick={handleFollowToggle}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1 ${isFollowing
                ? 'bg-[var(--background)] text-[var(--foreground)] border border-[var(--card-border)]'
                : 'bg-[var(--accent-green)] text-white hover:brightness-110 shadow-sm'
                } ${className}`}
        >
            {isFollowing ? (
                <><Check size={14} /> Siguiendo</>
            ) : (
                <><UserPlus size={14} /> Seguir</>
            )}
        </button>
    )
}
