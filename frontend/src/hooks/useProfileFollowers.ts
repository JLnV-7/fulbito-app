// src/hooks/useProfileFollowers.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useProfileFollowers(profileId: string) {
    const [followersCount, setFollowersCount] = useState(0)
    const [followingCount, setFollowingCount] = useState(0)

    useEffect(() => {
        if (!profileId) return

        const fetchCounts = async () => {
            // Get followers count (people following this profile)
            const { count: followers } = await supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', profileId)

            // Get following count (people this profile follows)
            const { count: following } = await supabase
                .from('user_follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', profileId)

            setFollowersCount(followers || 0)
            setFollowingCount(following || 0)
        }

        fetchCounts()

        // Subscription for real-time updates (optional but good for a live feel)
        const channel = supabase.channel(`follows_${profileId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_follows', filter: `following_id=eq.${profileId}` }, fetchCounts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_follows', filter: `follower_id=eq.${profileId}` }, fetchCounts)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [profileId])

    return {
        followersCount,
        followingCount
    }
}
