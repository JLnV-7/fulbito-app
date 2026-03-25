// src/hooks/useMatchChat.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Profile } from '@/types'

export interface ChatMessage {
    id: string
    partido_id: string
    user_id: string
    content: string
    is_edited: boolean
    reply_to_id?: string
    created_at: string
    updated_at: string
    profile?: Profile
    reply_to?: {
        id: string
        content: string
        profile?: { username: string }
    }
    reactions?: {
        id: string
        reaction_type: string
        user_id: string
    }[]
}

export function useMatchChat(partidoId?: string) {
    const { user } = useAuth()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [onlineUsers, setOnlineUsers] = useState(0)

    const fetchMessages = useCallback(async () => {
        if (!partidoId) return

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('partido_comments')
                .select(`
                    *,
                    profile:profiles!partido_comments_user_id_fkey(*),
                    reply_to:partido_comments!partido_comments_reply_to_id_fkey(
                        id, 
                        content, 
                        profile:profiles!partido_comments_user_id_fkey(username)
                    ),
                    reactions:partido_comment_reactions(*)
                `)
                .eq('partido_id', partidoId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data as any[])
        } catch (error) {
            console.error('Error fetching chat messages:', error)
        } finally {
            setLoading(false)
        }
    }, [partidoId])

    useEffect(() => {
        fetchMessages()
    }, [fetchMessages])

    // Setup Supabase Realtime channel
    useEffect(() => {
        if (!partidoId) return

        // Create a custom channel for this specific match ID
        const channelName = `match_chat_${partidoId}`

        const channel = supabase.channel(channelName)
            // Listen for inserts
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'partido_comments', filter: `partido_id=eq.${partidoId}` },
                async (payload) => {
                    const { data: fullMsg } = await supabase
                        .from('partido_comments')
                        .select(`
                            *,
                            profile:profiles!partido_comments_user_id_fkey(*),
                            reply_to:partido_comments!partido_comments_reply_to_id_fkey(
                                id, content, profile:profiles!partido_comments_user_id_fkey(username)
                            ),
                            reactions:partido_comment_reactions(*)
                        `)
                        .eq('id', payload.new.id)
                        .single()

                    if (fullMsg) {
                        setMessages(prev => [...prev, fullMsg as any])
                    }
                }
            )
            // Listen for reactions
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'partido_comment_reactions' },
                async (payload) => {
                    // Update the local message's reactions
                    const reaction = payload.new as any || payload.old as any
                    const commentId = reaction.comment_id

                    if (payload.eventType === 'INSERT') {
                        setMessages(prev => prev.map(m => 
                            m.id === commentId 
                            ? { ...m, reactions: [...(m.reactions || []), reaction] } 
                            : m
                        ))
                    } else if (payload.eventType === 'DELETE') {
                        setMessages(prev => prev.map(m => 
                            m.id === commentId 
                            ? { ...m, reactions: (m.reactions || []).filter(r => r.id !== payload.old.id) } 
                            : m
                        ))
                    }
                }
            )
            // Listen for deletes
            .on('postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'partido_comments', filter: `partido_id=eq.${partidoId}` },
                (payload) => {
                    setMessages(prev => prev.filter(msg => msg.id !== payload.old.id))
                }
            )
            // Presence sync
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState()
                setOnlineUsers(Object.keys(newState).length)
            })
            // Subscribe & track presence
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && user) {
                    await channel.track({ user_id: user.id })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [partidoId, user])

    const sendMessage = async (content: string, replyToId?: string) => {
        if (!user || !partidoId || !content.trim()) return false

        try {
            const { error } = await supabase
                .from('partido_comments')
                .insert({
                    partido_id: partidoId,
                    user_id: user.id,
                    content: content.trim(),
                    reply_to_id: replyToId
                })

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error sending message:', error)
            return false
        }
    }

    const toggleReaction = async (commentId: string, type: string) => {
        if (!user) return false

        try {
            // Check if exists
            const { data: existing } = await supabase
                .from('partido_comment_reactions')
                .select('id')
                .eq('comment_id', commentId)
                .eq('user_id', user.id)
                .eq('reaction_type', type)
                .single()

            if (existing) {
                await supabase.from('partido_comment_reactions').delete().eq('id', existing.id)
            } else {
                await supabase.from('partido_comment_reactions').insert({
                    comment_id: commentId,
                    user_id: user.id,
                    reaction_type: type
                })
            }
            return true
        } catch (error) {
            console.error('Error toggling reaction:', error)
            return false
        }
    }

    const deleteMessage = async (messageId: string) => {
        if (!user) return false
        try {
            const { error } = await supabase
                .from('partido_comments')
                .delete()
                .eq('id', messageId)

            if (error) throw error
            return true
        } catch (error) {
            console.error('Error deleting message:', error)
            return false
        }
    }

    return {
        messages,
        loading,
        onlineUsers,
        sendMessage,
        toggleReaction,
        deleteMessage
    }
}
