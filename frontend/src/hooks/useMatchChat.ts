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
    created_at: string
    updated_at: string
    profile?: Profile
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
                    profile:profiles!partido_comments_user_id_fkey(*)
                `)
                .eq('partido_id', partidoId)
                .order('created_at', { ascending: true }) // Older first, so new push to bottom

            if (error) throw error
            setMessages(data as ChatMessage[])
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
                    // We need to fetch the profile data as the realtime payload only has the row
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', payload.new.user_id)
                        .single()

                    const newMsg = { ...payload.new, profile } as ChatMessage
                    setMessages(prev => [...prev, newMsg])
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
                // presenceState returns a Record of objects grouped by presence key
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

    const sendMessage = async (content: string) => {
        if (!user || !partidoId || !content.trim()) return false

        try {
            const { error } = await supabase
                .from('partido_comments')
                .insert({
                    partido_id: partidoId,
                    user_id: user.id,
                    content: content.trim()
                })

            if (error) throw error
            // The message will be added via the realtime subscription,
            // but we can also optionally append it optimistically if we want instant feedback.
            return true
        } catch (error) {
            console.error('Error sending message:', error)
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
            // RLS ensures they can only delete their own

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
        deleteMessage
    }
}
