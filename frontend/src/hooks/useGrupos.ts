// src/hooks/useGrupos.ts
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { GrupoProde, MiembroGrupo } from '@/types'

export function useGrupos() {
    const [grupos, setGrupos] = useState<GrupoProde[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            fetchMisGrupos()
        } else {
            setLoading(false)
        }
    }, [user])

    const fetchMisGrupos = async () => {
        if (!user) return
        setLoading(true)

        try {
            // Obtener los grupos donde soy miembro
            const { data: miembros, error: errorMiembros } = await supabase
                .from('miembros_grupo')
                .select(`
          grupo_id,
          puntos_grupo,
          posicion,
          grupo:grupos_prode (*)
        `)
                .eq('user_id', user.id)

            if (errorMiembros) throw errorMiembros

            // Obtener count de miembros para cada grupo
            const gruposConCount = await Promise.all(
                (miembros || []).map(async (m) => {
                    const { count } = await supabase
                        .from('miembros_grupo')
                        .select('*', { count: 'exact', head: true })
                        .eq('grupo_id', m.grupo_id)

                    return {
                        ...m.grupo,
                        mi_puntos: m.puntos_grupo,
                        mi_posicion: m.posicion,
                        miembros_count: count || 0
                    }
                })
            )

            setGrupos(gruposConCount as any)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const crearGrupo = async (nombre: string, descripcion?: string) => {
        if (!user) throw new Error('Usuario no autenticado')

        // Generar código aleatorio de 6 caracteres
        const codigo = Math.random().toString(36).substring(2, 8).toUpperCase()

        // 1. Crear el grupo
        const { data: grupo, error: errorGrupo } = await supabase
            .from('grupos_prode')
            .insert({
                nombre,
                descripcion,
                admin_id: user.id,
                codigo_invitacion: codigo,
                es_privado: true
            })
            .select()
            .single()

        if (errorGrupo) throw errorGrupo

        // 2. Auto-unirse como primer miembro
        const { error: errorMiembro } = await supabase
            .from('miembros_grupo')
            .insert({
                grupo_id: grupo.id,
                user_id: user.id,
                puntos_grupo: 0
            })

        if (errorMiembro) throw errorMiembro

        await fetchMisGrupos()
        return grupo
    }

    const unirseAGrupo = async (codigo: string) => {
        if (!user) throw new Error('Usuario no autenticado')

        // 1. Buscar grupo por código
        const { data: grupo, error: errorBusqueda } = await supabase
            .from('grupos_prode')
            .select('id, nombre')
            .eq('codigo_invitacion', codigo.toUpperCase())
            .single()

        if (errorBusqueda || !grupo) throw new Error('Código de invitación inválido')

        // 2. Unirse
        const { error: errorUnion } = await supabase
            .from('miembros_grupo')
            .insert({
                grupo_id: grupo.id,
                user_id: user.id,
                puntos_grupo: 0
            })

        if (errorUnion) {
            if (errorUnion.code === '23505') throw new Error('Ya pertenecés a este grupo')
            throw errorUnion
        }

        await fetchMisGrupos()
        return grupo
    }

    const salirDeGrupo = async (grupoId: string) => {
        if (!user) throw new Error('Usuario no autenticado')

        // Verificar que no sea el admin
        const grupo = grupos.find(g => g.id === grupoId)
        if (grupo?.admin_id === user.id) {
            throw new Error('No podés salir de un grupo que administrás. Eliminá el grupo o transferí la administración.')
        }

        const { error } = await supabase
            .from('miembros_grupo')
            .delete()
            .eq('grupo_id', grupoId)
            .eq('user_id', user.id)

        if (error) throw error

        await fetchMisGrupos()
    }

    return {
        grupos,
        loading,
        error,
        crearGrupo,
        unirseAGrupo,
        salirDeGrupo,
        refetch: fetchMisGrupos
    }
}
