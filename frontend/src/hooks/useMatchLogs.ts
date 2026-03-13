// src/hooks/useMatchLogs.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import type { MatchLog, MatchLogPlayerRating } from '@/types'

export interface MatchLogFilters {
    liga?: string
    equipo?: string
    matchType?: string
    userId?: string
    feedType?: 'recent' | 'popular' | 'following'
    limit?: number
    offset?: number
}

export interface CreateMatchLogData {
    partido_id?: string | number
    match_type: string
    equipo_local: string
    equipo_visitante: string
    logo_local?: string
    logo_visitante?: string
    liga?: string
    fecha_partido: string
    goles_local?: number
    goles_visitante?: number
    rating_partido: number
    rating_arbitro?: number
    rating_atmosfera?: number
    rating_garra?: number
    review_title?: string
    review_text?: string
    is_spoiler?: boolean
    is_private?: boolean
    watched_at?: string
    player_ratings?: Omit<MatchLogPlayerRating, 'id' | 'match_log_id'>[]
    tags?: string[]
    is_neutral?: boolean
    rating_dt?: number
    jugador_estrella?: string
    jugador_villano?: string
    foto_url?: string
    mood?: string
}

export function useMatchLogs(filters?: MatchLogFilters) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [logs, setLogs] = useState<MatchLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasMore, setHasMore] = useState(true)



    const fetchLogs = useCallback(async (reset = false) => {
        try {
            setLoading(true)
            setError(null)

            const limit = filters?.limit || 20
            const offset = reset ? 0 : (filters?.offset || 0)

            let query = supabase
                .from('match_logs')
                .select(`
          *,
          profile:profiles!match_logs_user_id_fkey(id, username, avatar_url),
          player_ratings:match_log_player_ratings(*),
          tags:match_log_tags(tag),
          likes_count:match_log_likes(count)
        `)

            // Feed Type logic
            if (filters?.feedType === 'popular') {
                query = query.order('likes_count(count)', { ascending: false })
            } else if (filters?.feedType === 'following' && user) {
                // Get followed user IDs
                const { data: followed } = await supabase
                    .from('user_follows')
                    .select('following_id')
                    .eq('follower_id', user.id)

                const followedIds = (followed || []).map(f => f.following_id)
                if (followedIds.length > 0) {
                    query = query.in('user_id', followedIds)
                } else {
                    // If not following anyone, return empty (or we could return empty data later)
                    setLogs([])
                    setHasMore(false)
                    setLoading(false)
                    return
                }
                query = query.order('created_at', { ascending: false })
            } else {
                query = query.order('created_at', { ascending: false })
            }

            query = query.range(offset, offset + limit - 1)

            // Apply filters
            if (filters?.liga) {
                query = query.eq('liga', filters.liga)
            }
            if (filters?.equipo) {
                query = query.or(`equipo_local.ilike.%${filters.equipo}%,equipo_visitante.ilike.%${filters.equipo}%`)
            }
            if (filters?.matchType) {
                query = query.eq('match_type', filters.matchType)
            }
            if (filters?.userId) {
                query = query.eq('user_id', filters.userId)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            // Fetch my reactions if user logged in
            let myReactions: Record<string, string> = {}
            if (user && data && data.length > 0) {
                const { data: likes } = await supabase
                    .from('match_log_likes')
                    .select('match_log_id, reaction_type')
                    .in('match_log_id', data.map(d => d.id))
                    .eq('user_id', user.id)

                if (likes) {
                    likes.forEach(l => {
                        myReactions[l.match_log_id] = l.reaction_type || 'like'
                    })
                }
            }

            // Process data: flatten tags, check if liked
            const processedLogs: MatchLog[] = (data || []).map((log: any) => ({
                ...log,
                tags: (log.tags || []).map((t: any) => t.tag),
                likes_count: log.likes_count[0]?.count || 0,
                profile: log.profile,
                player_ratings: log.player_ratings,
                is_liked: !!myReactions[log.id],
                my_reaction: myReactions[log.id]
            }))

            if (reset) {
                setLogs(processedLogs)
            } else {
                setLogs(prev => [...prev, ...processedLogs])
            }
            setHasMore(processedLogs.length === limit)
        } catch (err: any) {
            console.error('Error fetching match logs:', err)
            setError('Error al cargar las reseñas')
        } finally {
            setLoading(false)
        }
    }, [filters?.liga, filters?.equipo, filters?.matchType, filters?.userId, filters?.limit, filters?.offset, filters?.feedType, user])

    useEffect(() => {
        fetchLogs(true)
    }, [fetchLogs])

    // Offline Syncing
    const syncOfflineLogs = useCallback(async () => {
        if (!user || typeof window === 'undefined' || !navigator.onLine) return

        try {
            const queueStr = localStorage.getItem('futlog_offline_queue')
            if (!queueStr) return

            const queue: (CreateMatchLogData & { _queuedAt: string })[] = JSON.parse(queueStr)
            if (queue.length === 0) return

            const successfulIndices: number[] = []

            for (let i = 0; i < queue.length; i++) {
                const item = queue[i]
                const { _queuedAt, ...data } = item
                try {
                    const { player_ratings, tags, ...logData } = data
                    const { data: newLog, error: insertError } = await supabase
                        .from('match_logs')
                        .insert({
                            ...logData,
                            user_id: user.id,
                            watched_at: logData.watched_at || new Date().toISOString(),
                        })
                        .select()
                        .single()

                    if (insertError) throw insertError

                    if (player_ratings && player_ratings.length > 0) {
                        const { error: prError } = await supabase
                            .from('match_log_player_ratings')
                            .insert(player_ratings.map(pr => ({ ...pr, match_log_id: newLog.id })))
                        if (prError) console.error('Error syncing player ratings:', prError)
                    }

                    if (tags && tags.length > 0) {
                        const { error: tagError } = await supabase
                            .from('match_log_tags')
                            .insert(tags.map(tag => ({ match_log_id: newLog.id, tag })))
                        if (tagError) console.error('Error syncing tags:', tagError)
                    }
                    successfulIndices.push(i)
                } catch (e) {
                    console.error('Error syncing individual offline log:', e)
                }
            }

            // Remove only successful items from queue
            if (successfulIndices.length > 0) {
                const newQueue = queue.filter((_, idx) => !successfulIndices.includes(idx))
                if (newQueue.length > 0) {
                    localStorage.setItem('futlog_offline_queue', JSON.stringify(newQueue))
                } else {
                    localStorage.removeItem('futlog_offline_queue')
                }

                showToast(`Se sincronizaron ${successfulIndices.length} reseña(s) guardada(s).`, 'success')
                fetchLogs(true)
            }
        } catch (e) {
            console.error('Error in syncOfflineLogs:', e)
        }
    }, [user, fetchLogs])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', syncOfflineLogs)
            // Trigger sync on mount in case they are online and there's queue
            if (navigator.onLine) {
                syncOfflineLogs()
            }
            return () => window.removeEventListener('online', syncOfflineLogs)
        }
    }, [syncOfflineLogs])

    const createMatchLog = async (data: CreateMatchLogData): Promise<MatchLog | null> => {
        if (!user) return null

        if (typeof window !== 'undefined' && !navigator.onLine) {
            const queue = JSON.parse(localStorage.getItem('futlog_offline_queue') || '[]')
            const trimmedQueue = queue.slice(-49) // mantener solo los últimos 49
            trimmedQueue.push({ ...data, _queuedAt: new Date().toISOString() })
            localStorage.setItem('futlog_offline_queue', JSON.stringify(trimmedQueue))
            showToast('Estás sin conexión. La reseña se guardó y se subirá al conectar.', 'info')
            return { id: `offline-${Date.now()}`, ...data } as unknown as MatchLog
        }

        try {
            const { player_ratings, tags, ...logData } = data

            // Insert the main log
            const { data: newLog, error: insertError } = await supabase
                .from('match_logs')
                .insert({
                    ...logData,
                    user_id: user.id,
                    watched_at: logData.watched_at || new Date().toISOString(),
                })
                .select()
                .single()

            if (insertError) throw insertError

            // Insert player ratings if any
            if (player_ratings && player_ratings.length > 0) {
                const { error: ratingsError } = await supabase
                    .from('match_log_player_ratings')
                    .insert(
                        player_ratings.map(pr => ({
                            ...pr,
                            match_log_id: newLog.id,
                        }))
                    )
                if (ratingsError) console.error('Error inserting player ratings:', ratingsError)
            }

            // Insert tags if any
            if (tags && tags.length > 0) {
                const { error: tagsError } = await supabase
                    .from('match_log_tags')
                    .insert(
                        tags.map(tag => ({
                            match_log_id: newLog.id,
                            tag,
                        }))
                    )
                if (tagsError) console.error('Error inserting tags:', tagsError)
            }

            // Refresh the list
            fetchLogs(true)
            return newLog as MatchLog
        } catch (err: any) {
            console.error('Error creating match log:', err)
            throw err
        }
    }

    const toggleLike = async (logId: string, reactionType: string = 'like') => {
        if (!user) return

        const log = logs.find(l => l.id === logId)
        if (!log) return

        const wasLiked = log.is_liked
        const previousReaction = log.my_reaction

        // Optimistic update
        setLogs(prev => prev.map(l => {
            if (l.id !== logId) return l
            
            let newLikesCount = l.likes_count || 0
            if (wasLiked) {
                if (previousReaction === reactionType) {
                    // Remove reaction
                    newLikesCount--
                    return { ...l, is_liked: false, my_reaction: undefined, likes_count: newLikesCount }
                } else {
                    // Change reaction (count stays same)
                    return { ...l, is_liked: true, my_reaction: reactionType }
                }
            } else {
                // Add new reaction
                newLikesCount++
                return { ...l, is_liked: true, my_reaction: reactionType, likes_count: newLikesCount }
            }
        }))

        try {
            if (wasLiked && previousReaction === reactionType) {
                await supabase
                    .from('match_log_likes')
                    .delete()
                    .eq('match_log_id', logId)
                    .eq('user_id', user.id)
            } else {
                // Upsert to handle changing reaction type
                await supabase
                    .from('match_log_likes')
                    .upsert({ 
                        match_log_id: logId, 
                        user_id: user.id, 
                        reaction_type: reactionType 
                    }, { onConflict: 'match_log_id,user_id' })
            }
        } catch (err) {
            console.error('Error toggling reaction:', err)
            // Revert on error
            setLogs(prev => prev.map(l =>
                l.id === logId
                    ? { ...l, is_liked: wasLiked, my_reaction: previousReaction, likes_count: log.likes_count }
                    : l
            ))
        }
    }

    const getMatchLog = async (id: string): Promise<MatchLog | null> => {
        try {
            const { data, error: fetchError } = await supabase
                .from('match_logs')
                .select(`
          *,
          profile:profiles!match_logs_user_id_fkey(id, username, avatar_url),
          player_ratings:match_log_player_ratings(*),
          tags:match_log_tags(tag),
          likes_count:match_log_likes(count)
        `)
                .eq('id', id)
                .single()

            if (fetchError) throw fetchError

            const log = data as Record<string, unknown>
            const processed: MatchLog = {
                ...log,
                tags: ((log.tags as { tag: string }[]) || []).map((t: { tag: string }) => t.tag),
                likes_count: ((log.likes_count as { count: number }[]) || [{ count: 0 }])[0]?.count || 0,
                profile: log.profile as MatchLog['profile'],
                player_ratings: log.player_ratings as MatchLogPlayerRating[],
            } as MatchLog

            // Check if liked
            if (user) {
                const { data: likeData } = await supabase
                    .from('match_log_likes')
                    .select('id')
                    .eq('match_log_id', id)
                    .eq('user_id', user.id)
                    .maybeSingle()

                processed.is_liked = !!likeData
            }

            return processed
        } catch (err: any) {
            console.error('Error fetching match log:', err)
            return null
        }
    }

    return {
        logs,
        loading,
        error,
        hasMore,
        fetchLogs,
        createMatchLog,
        toggleLike,
        getMatchLog,
        refetch: () => fetchLogs(true),
        syncOfflineLogs,
    }
}

// Hook for follow system
export function useFollows() {
    const { user } = useAuth()
    const [following, setFollowing] = useState<string[]>([])
    const [followers, setFollowers] = useState<string[]>([])

    useEffect(() => {
        if (!user) return

        const fetchFollows = async () => {
            const [{ data: followingData }, { data: followersData }] = await Promise.all([
                supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
                supabase.from('user_follows').select('follower_id').eq('following_id', user.id),
            ])

            setFollowing((followingData || []).map((f: { following_id: string }) => f.following_id))
            setFollowers((followersData || []).map((f: { follower_id: string }) => f.follower_id))
        }

        fetchFollows()
    }, [user])

    const toggleFollow = async (targetUserId: string) => {
        if (!user) return

        const isFollowing = following.includes(targetUserId)

        // Optimistic update
        setFollowing(prev =>
            isFollowing ? prev.filter(id => id !== targetUserId) : [...prev, targetUserId]
        )

        try {
            if (isFollowing) {
                await supabase
                    .from('user_follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', targetUserId)
            } else {
                await supabase
                    .from('user_follows')
                    .insert({ follower_id: user.id, following_id: targetUserId })
            }
        } catch {
            // Revert
            setFollowing(prev =>
                isFollowing ? [...prev, targetUserId] : prev.filter(id => id !== targetUserId)
            )
        }
    }

    return {
        following,
        followers,
        followingCount: following.length,
        followersCount: followers.length,
        isFollowing: (userId: string) => following.includes(userId),
        toggleFollow,
    }
}
