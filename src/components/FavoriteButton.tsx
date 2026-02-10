// src/components/FavoriteButton.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface FavoriteButtonProps {
    equipo: string
    compact?: boolean
}

export function FavoriteButton({ equipo, compact = false }: FavoriteButtonProps) {
    const { user } = useAuth()
    const [isFavorite, setIsFavorite] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        const checkFavorite = async () => {
            const { data } = await supabase
                .from('favoritos')
                .select('id')
                .eq('user_id', user.id)
                .eq('equipo_nombre', equipo)
                .single()

            if (data) setIsFavorite(true)
            setLoading(false)
        }

        checkFavorite()
    }, [user, equipo])

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            alert('Iniciá sesión para guardar tus equipos favoritos ⭐')
            return
        }

        const previousState = isFavorite
        setIsFavorite(!previousState)

        try {
            if (previousState) {
                // Borrar
                const { error } = await supabase
                    .from('favoritos')
                    .delete()
                    .match({ user_id: user.id, equipo_nombre: equipo })

                if (error) throw error
            } else {
                // Agregar
                const { error } = await supabase
                    .from('favoritos')
                    .insert({ user_id: user.id, equipo_nombre: equipo })

                if (error) throw error
            }
        } catch (error) {
            console.error('Error toggling favorite:', error)
            setIsFavorite(previousState)
        }
    }

    if (loading) return <div className="w-6 h-6" />

    return (
        <button
            onClick={toggleFavorite}
            className={`
        transition-all duration-200 hover:scale-110 active:scale-95
        ${isFavorite
                    ? 'text-yellow-400 opacity-100'
                    : 'text-gray-600 hover:text-yellow-400 opacity-50 hover:opacity-100'
                }
        ${compact ? 'text-xl' : 'text-2xl'}
      `}
            title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
            {isFavorite ? '⭐' : '☆'}
        </button>
    )
}
