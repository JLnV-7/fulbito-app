// src/hooks/usePronosticos.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Pronostico, Partido } from '@/types'

export function usePronosticos(partidoId?: string) {
    const [pronosticos, setPronosticos] = useState<Pronostico[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    useEffect(() => {
        if (!user) {
            setLoading(false)
            return
        }

        fetchPronosticos()

        // Suscripción en tiempo real
        const channel = supabase
            .channel('pronosticos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'pronosticos',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    fetchPronosticos()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, partidoId])

    const fetchPronosticos = async () => {
        if (!user) return

        try {
            let query = supabase
                .from('pronosticos')
                .select('*, partido:partidos(*)')
                .eq('user_id', user.id)

            if (partidoId) {
                query = query.eq('partido_id', partidoId)
            }

            const { data, error } = await query

            if (error) throw error

            setPronosticos(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const guardarPronostico = async (partidoId: string, golesLocal: number, golesVisitante: number) => {
        if (!user) throw new Error('Usuario no autenticado')

        // Validación
        if (golesLocal < 0 || golesLocal > 20 || golesVisitante < 0 || golesVisitante > 20) {
            throw new Error('Los goles deben estar entre 0 y 20')
        }

        const { data, error } = await supabase
            .from('pronosticos')
            .upsert({
                user_id: user.id,
                partido_id: partidoId,
                goles_local_pronostico: golesLocal,
                goles_visitante_pronostico: golesVisitante,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,partido_id'
            })
            .select()
            .single()

        if (error) throw error

        // Actualizar estado local
        await fetchPronosticos()

        return data
    }

    const eliminarPronostico = async (pronosticoId: string) => {
        const { error } = await supabase
            .from('pronosticos')
            .delete()
            .eq('id', pronosticoId)
            .eq('user_id', user?.id)

        if (error) throw error

        // Actualizar estado local
        setPronosticos(prev => prev.filter(p => p.id !== pronosticoId))
    }

    return {
        pronosticos,
        loading,
        error,
        guardarPronostico,
        eliminarPronostico,
        refetch: fetchPronosticos
    }
}

// Hook para obtener pronóstico de un partido específico
export function usePronosticoPartido(partidoId: string) {
    const { pronosticos, loading, error, guardarPronostico } = usePronosticos(partidoId)

    return {
        pronostico: pronosticos[0] || null,
        loading,
        error,
        guardarPronostico
    }
}
