// src/hooks/usePartidosAmigos.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
    PartidoAmigo,
    JugadorPartidoAmigo,
    VotoPartidoAmigo,
    TipoPartidoAmigo,
    EstadoPartidoAmigo
} from '@/types'

export function usePartidosAmigos(grupoId?: string) {
    const [partidos, setPartidos] = useState<PartidoAmigo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuth()

    const fetchPartidos = useCallback(async () => {
        if (!grupoId || !user) return
        setLoading(true)
        try {
            // Fetch all partidos for this group
            const { data: partidosData, error: err } = await supabase
                .from('partidos_amigos')
                .select('*')
                .eq('grupo_id', grupoId)
                .order('fecha', { ascending: false })

            if (err) throw err

            // For each partido, get jugadores count and unique voters count
            const enriched = await Promise.all(
                (partidosData || []).map(async (p: PartidoAmigo) => {
                    const { count: jugCount } = await supabase
                        .from('jugadores_partido_amigo')
                        .select('*', { count: 'exact', head: true })
                        .eq('partido_amigo_id', p.id)

                    const { data: votosData } = await supabase
                        .from('votos_partido_amigo')
                        .select('user_id')
                        .eq('partido_amigo_id', p.id)

                    const uniqueVoters = new Set((votosData || []).map((v: any) => v.user_id)).size

                    const { count: miembrosCount } = await supabase
                        .from('miembros_grupo')
                        .select('*', { count: 'exact', head: true })
                        .eq('grupo_id', grupoId)

                    return {
                        ...p,
                        jugadores_count: jugCount || 0,
                        votos_usuarios: uniqueVoters,
                        total_miembros: miembrosCount || 0
                    }
                })
            )

            setPartidos(enriched)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [grupoId, user])

    useEffect(() => {
        fetchPartidos()
    }, [fetchPartidos])

    // ── CREAR PARTIDO ──
    const crearPartido = async (data: {
        tipo_partido: TipoPartidoAmigo
        fecha: string
        hora: string
        cancha?: string
    }) => {
        if (!user || !grupoId) throw new Error('No autenticado')

        const { data: partido, error } = await supabase
            .from('partidos_amigos')
            .insert({
                grupo_id: grupoId,
                creado_por: user.id,
                tipo_partido: data.tipo_partido,
                fecha: data.fecha,
                hora: data.hora,
                cancha: data.cancha || null,
                estado: 'borrador'
            })
            .select()
            .single()

        if (error) throw error
        return partido as PartidoAmigo
    }

    // ── AGREGAR JUGADOR ──
    const agregarJugador = async (partidoId: string, nombre: string, equipo: 'azul' | 'rojo') => {
        const { data, error } = await supabase
            .from('jugadores_partido_amigo')
            .insert({
                partido_amigo_id: partidoId,
                nombre,
                equipo
            })
            .select()
            .single()

        if (error) throw error
        return data as JugadorPartidoAmigo
    }

    // ── ELIMINAR JUGADOR ──
    const eliminarJugador = async (jugadorId: string) => {
        const { error } = await supabase
            .from('jugadores_partido_amigo')
            .delete()
            .eq('id', jugadorId)

        if (error) throw error
    }

    // ── CAMBIAR ESTADO ──
    const abrirVotacion = async (partidoId: string) => {
        const { error } = await supabase
            .from('partidos_amigos')
            .update({ estado: 'votacion_abierta', updated_at: new Date().toISOString() })
            .eq('id', partidoId)

        if (error) throw error
        await fetchPartidos()
    }

    const cerrarVotacion = async (partidoId: string, resultadoAzul?: number, resultadoRojo?: number) => {
        const update: any = {
            estado: 'finalizado',
            updated_at: new Date().toISOString()
        }
        if (resultadoAzul !== undefined) update.resultado_azul = resultadoAzul
        if (resultadoRojo !== undefined) update.resultado_rojo = resultadoRojo

        const { error } = await supabase
            .from('partidos_amigos')
            .update(update)
            .eq('id', partidoId)

        if (error) throw error
        await fetchPartidos()
    }

    // ── VOTAR ──
    const votarJugador = async (partidoId: string, jugadorId: string, nota: number, comentario?: string) => {
        if (!user) throw new Error('No autenticado')

        const { error } = await supabase
            .from('votos_partido_amigo')
            .upsert({
                partido_amigo_id: partidoId,
                jugador_id: jugadorId,
                user_id: user.id,
                nota,
                comentario: comentario || null
            }, {
                onConflict: 'partido_amigo_id,jugador_id,user_id'
            })

        if (error) throw error
    }

    // ── FETCH JUGADORES CON VOTOS (para votar o ver resultados) ──
    const fetchJugadoresConVotos = async (partidoId: string): Promise<JugadorPartidoAmigo[]> => {
        if (!user) return []

        const { data: jugadores, error: errJ } = await supabase
            .from('jugadores_partido_amigo')
            .select('*')
            .eq('partido_amigo_id', partidoId)
            .order('equipo')
            .order('orden')

        if (errJ) throw errJ

        const { data: votos, error: errV } = await supabase
            .from('votos_partido_amigo')
            .select('*')
            .eq('partido_amigo_id', partidoId)

        if (errV) throw errV

        return (jugadores || []).map((j: any) => {
            const votosJugador = (votos || []).filter((v: any) => v.jugador_id === j.id)
            const miVoto = votosJugador.find((v: any) => v.user_id === user.id) || null
            const promedio = votosJugador.length > 0
                ? votosJugador.reduce((sum: number, v: any) => sum + v.nota, 0) / votosJugador.length
                : 0

            return {
                ...j,
                promedio: Math.round(promedio * 10) / 10,
                total_votos: votosJugador.length,
                mi_voto: miVoto
            }
        })
    }

    // ── FETCH DETALLE JUGADOR (distribución de votos + comentarios) ──
    const fetchDetalleJugador = async (jugadorId: string) => {
        const { data: votos, error } = await supabase
            .from('votos_partido_amigo')
            .select('*')
            .eq('jugador_id', jugadorId)
            .order('created_at', { ascending: false })

        if (error) throw error

        // Get profiles for voters
        const userIds = (votos || []).map((v: any) => v.user_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds)

        const votosConProfile = (votos || []).map((v: any) => ({
            ...v,
            profile: profiles?.find((p: any) => p.id === v.user_id)
        }))

        // Distribution
        const distribucion: Record<number, number> = {}
        for (let i = 1; i <= 10; i++) distribucion[i] = 0
        votosConProfile.forEach((v: any) => {
            distribucion[v.nota] = (distribucion[v.nota] || 0) + 1
        })

        const promedio = votosConProfile.length > 0
            ? votosConProfile.reduce((sum: number, v: any) => sum + v.nota, 0) / votosConProfile.length
            : 0

        return {
            votos: votosConProfile,
            distribucion,
            promedio: Math.round(promedio * 10) / 10,
            totalVotos: votosConProfile.length
        }
    }

    // ── ELIMINAR PARTIDO ──
    const eliminarPartido = async (partidoId: string) => {
        const { error } = await supabase
            .from('partidos_amigos')
            .delete()
            .eq('id', partidoId)

        if (error) throw error
        await fetchPartidos()
    }

    return {
        partidos,
        loading,
        error,
        crearPartido,
        agregarJugador,
        eliminarJugador,
        abrirVotacion,
        cerrarVotacion,
        votarJugador,
        fetchJugadoresConVotos,
        fetchDetalleJugador,
        eliminarPartido,
        refetch: fetchPartidos
    }
}
