// src/hooks/useUserLists.ts
'use client'

import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface UserList {
    id: string
    user_id: string
    title: string
    description?: string
    is_public: boolean
    created_at: string
    updated_at: string
    items?: UserListItem[]
    _count?: number
}

export interface UserListItem {
    id: string
    list_id: string
    partido_id: string
    equipo_local: string
    equipo_visitante: string
    logo_local?: string
    logo_visitante?: string
    order_index: number
    comment?: string
    created_at: string
}

export function useUserLists(targetUserId?: string) {
    const { user } = useAuth()
    const [lists, setLists] = useState<UserList[]>([])
    const [loading, setLoading] = useState(true)

    const fetchLists = useCallback(async () => {
        const queryUserId = targetUserId || user?.id
        if (!queryUserId) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('user_lists')
                .select(`
                    *,
                    items:user_list_items(*)
                `)
                .eq('user_id', queryUserId)
                .order('created_at', { ascending: false })

            if (error) throw error

            const processedLists = (data || []).map(list => ({
                ...list,
                _count: list.items?.length || 0
            }))

            setLists(processedLists as UserList[])
        } catch (error) {
            console.error('Error fetching lists:', error)
        } finally {
            setLoading(false)
        }
    }, [targetUserId, user])

    const fetchListDetails = async (listId: string): Promise<UserList | null> => {
        try {
            const { data, error } = await supabase
                .from('user_lists')
                .select(`
                    *,
                    items:user_list_items(*)
                `)
                .eq('id', listId)
                .single()

            if (error) throw error
            // Order items by order_index ascending
            if (data.items) {
                data.items.sort((a: any, b: any) => a.order_index - b.order_index)
            }
            return data as UserList
        } catch (error) {
            console.error('Error fetching list details:', error)
            return null
        }
    }

    const createList = async (title: string, description?: string, isPublic = true) => {
        if (!user) return null
        try {
            const { data, error } = await supabase
                .from('user_lists')
                .insert({ user_id: user.id, title, description, is_public: isPublic })
                .select()
                .single()

            if (error) throw error
            setLists(prev => [{ ...data, items: [], _count: 0 } as UserList, ...prev])
            return data as UserList
        } catch (error) {
            console.error('Error creating list:', error)
            return null
        }
    }

    const addToList = async (listId: string, matchData: {
        partido_id: string,
        equipo_local: string,
        equipo_visitante: string,
        logo_local?: string,
        logo_visitante?: string,
        comment?: string
    }) => {
        if (!user) return false
        try {
            // Get current max list index
            const list = lists.find(l => l.id === listId)
            const newIndex = list ? (list._count || 0) : 0

            const { error } = await supabase
                .from('user_list_items')
                .insert({
                    list_id: listId,
                    ...matchData,
                    order_index: newIndex
                })

            if (error) throw error
            // Optimistic update for local state
            setLists(prev => prev.map(l =>
                l.id === listId ? { ...l, _count: (l._count || 0) + 1 } : l
            ))
            return true
        } catch (error) {
            console.error('Error adding to list:', error)
            return false
        }
    }

    const removeFromList = async (itemId: string, listId: string) => {
        if (!user) return false
        try {
            const { error } = await supabase
                .from('user_list_items')
                .delete()
                .eq('id', itemId)

            if (error) throw error
            // Optimistic count decrease
            setLists(prev => prev.map(l =>
                l.id === listId ? { ...l, _count: Math.max(0, (l._count || 1) - 1) } : l
            ))
            return true
        } catch (error) {
            console.error('Error removing from list:', error)
            return false
        }
    }

    const deleteList = async (listId: string) => {
        if (!user) return false
        try {
            const { error } = await supabase
                .from('user_lists')
                .delete()
                .eq('id', listId)

            if (error) throw error
            setLists(prev => prev.filter(l => l.id !== listId))
            return true
        } catch (error) {
            console.error('Error deleting list:', error)
            return false
        }
    }

    return {
        lists,
        loading,
        fetchLists,
        fetchListDetails,
        createList,
        addToList,
        removeFromList,
        deleteList
    }
}
