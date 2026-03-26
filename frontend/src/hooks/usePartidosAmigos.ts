// src/hooks/usePartidosAmigos.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
    PartidoAmigo,
    JugadorPartidoAmigo,
    TipoPartidoAmigo,
    FacetType,
    FacetVote
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
            // ─── ANTES: 1 + N×3 queries (31 con 10 partidos) ───────────────
            // ─── AHORA: 4 queries totales siempre ──────────────────────────

            // Query 1: partidos del grupo
            const { data: partidosData, error: err } = await supabase
                .from('partidos_amigos')
                .select('*')
                .eq('grupo_id', grupoId)
                .order('fecha', { ascending: false })
            if (err) throw err
            if (!partidosData || partidosData.length === 0) {
                setPartidos([])
                return
            }

            const partidoIds = partidosData.map(p => p.id)

            // Query 2 + 3 + 4 en paralelo — sin importar cuántos partidos haya
            const [jugadoresRes, votosRes, miembrosRes] = await Promise.all([
                // Contar jugadores agrupados por partido
                supabase
                    .from('jugadores_partido_amigo')
                    .select('partido_amigo_id')
                    .in('partido_amigo_id', partidoIds),

                // Traer user_id de votos para contar votantes únicos por partido
                supabase
                    .from('votos_partido_amigo')
                    .select('partido_amigo_id, user_id')
                    .in('partido_amigo_id', partidoIds),

                // Contar miembros del grupo — UNA sola vez
                supabase
                    .from('miembros_grupo')
                    .select('user_id', { count: 'exact', head: true })
                    .eq('grupo_id', grupoId),
            ])

            // Calcular conteos en memoria (O(n) — sin más round-trips)
            const jugadoresRaw = jugadoresRes.data || []
            const votosRaw = votosRes.data || []
            const miembrosCount = miembrosRes.count || 0

            // Agrupar jugadores por partido_amigo_id
            const jugadoresPorPartido = jugadoresRaw.reduce<Record<string, number>>((acc, j) => {
                acc[j.partido_amigo_id] = (acc[j.partido_amigo_id] || 0) + 1
                return acc
            }, {})

            // Agrupar votantes únicos por partido_amigo_id
            const votantesPorPartido = votosRaw.reduce<Record<string, Set<string>>>((acc, v) => {
                if (!acc[v.partido_amigo_id]) acc[v.partido_amigo_id] = new Set()
                acc[v.partido_amigo_id].add(v.user_id)
                return acc
            }, {})

            const enriched = partidosData.map(p => ({
                ...p,
                jugadores_count: jugadoresPorPartido[p.id] || 0,
                votos_usuarios: votantesPorPartido[p.id]?.size || 0,
                total_miembros: miembrosCount,
            }))

            setPartidos(enriched)
        } catch (err: any) {
            setError(err instanceof Error ? err.message : 'Error al cargar partidos')
        } finally {
            setLoading(false)
        }
    }, [grupoId, user])

    useEffect(() => {
        fetchPartidos()
    }, [fetchPartidos])

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

    const agregarJugador = async (partidoId: string, nombre: string, equipo: 'azul' | 'rojo', userId?: string) => {
        const { data, error } = await supabase
            .from('jugadores_partido_amigo')
            .insert({ partido_amigo_id: partidoId, nombre, equipo, user_id: userId || null })
            .select()
            .single()
        if (error) throw error
        return data as JugadorPartidoAmigo
    }

    const eliminarJugador = async (jugadorId: string) => {
        const { error } = await supabase.from('jugadores_partido_amigo').delete().eq('id', jugadorId)
        if (error) throw error
    }

    const abrirVotacion = async (partidoId: string) => {
        const { error } = await supabase
            .from('partidos_amigos')
            .update({ estado: 'votacion_abierta', updated_at: new Date().toISOString() })
            .eq('id', partidoId)
        if (error) throw error
        await fetchPartidos()
    }

    const cerrarVotacion = async (partidoId: string, resultadoAzul?: number, resultadoRojo?: number) => {
        const update: any = { estado: 'finalizado', updated_at: new Date().toISOString() }
        if (resultadoAzul !== undefined) update.resultado_azul = resultadoAzul
        if (resultadoRojo !== undefined) update.resultado_rojo = resultadoRojo
        const { error } = await supabase.from('partidos_amigos').update(update).eq('id', partidoId)
        if (error) throw error
        await fetchPartidos()
    }

    const cerrarPartidoMundial = async (
        partidoId: string,
        resultadoAzul: number,
        resultadoRojo: number,
        jugadoresStats: { id: string, goles: number, asistencias: number }[]
    ) => {
        try {
            for (const j of jugadoresStats) {
                const { error: errorJ } = await supabase
                    .from('jugadores_partido_amigo')
                    .update({ goles: j.goles, asistencias: j.asistencias })
                    .eq('id', j.id)
                if (errorJ) throw errorJ
            }
            const { error: errorRPC } = await supabase.rpc('cerrar_partido_mundial', {
                p_partido_id: partidoId,
                p_resultado_azul: resultadoAzul,
                p_resultado_rojo: resultadoRojo
            })
            if (errorRPC) throw errorRPC
            const { error: errorS } = await supabase
                .from('partidos_amigos')
                .update({ stats_completed: true, updated_at: new Date().toISOString() })
                .eq('id', partidoId)
            if (errorS) throw errorS
            await fetchPartidos()
        } catch (err) { throw err }
    }

    const votarJugador = async (partidoId: string, jugadorId: string, nota: number, comentario?: string) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase.from('votos_partido_amigo').upsert({
            partido_amigo_id: partidoId,
            jugador_id: jugadorId,
            user_id: user.id,
            nota,
            comentario: comentario || null
        }, { onConflict: 'partido_amigo_id,jugador_id,user_id' })
        if (error) throw error
    }

    const fetchJugadoresConVotos = async (partidoId: string): Promise<JugadorPartidoAmigo[]> => {
        if (!user) return []

        // 2 queries en paralelo en vez de secuencial
        const [jugRes, votRes] = await Promise.all([
            supabase
                .from('jugadores_partido_amigo')
                .select('*')
                .eq('partido_amigo_id', partidoId)
                .order('equipo').order('orden'),
            supabase
                .from('votos_partido_amigo')
                .select('*')
                .eq('partido_amigo_id', partidoId)
        ])

        if (jugRes.error) throw jugRes.error
        if (votRes.error) throw votRes.error

        const jugadores = jugRes.data || []
        const votos = votRes.data || []

        return jugadores.map((j: any) => {
            const votosJugador = votos.filter((v: any) => v.jugador_id === j.id)
            const miVoto = votosJugador.find((v: any) => v.user_id === user.id) || null
            const promedio = votosJugador.length > 0
                ? Math.round(votosJugador.reduce((s: number, v: any) => s + v.nota, 0) / votosJugador.length * 10) / 10
                : 0
            return { ...j, promedio, total_votos: votosJugador.length, mi_voto: miVoto }
        })
    }

    const fetchDetalleJugador = async (jugadorId: string) => {
        const { data: votos, error } = await supabase
            .from('votos_partido_amigo')
            .select('*')
            .eq('jugador_id', jugadorId)
            .order('created_at', { ascending: false })
        if (error) throw error

        const userIds = (votos || []).map((v: any) => v.user_id)
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')  // solo columnas necesarias
            .in('id', userIds)

        const votosConProfile = (votos || []).map((v: any) => ({
            ...v,
            profile: profiles?.find((p: any) => p.id === v.user_id)
        }))

        const distribucion: Record<number, number> = {}
        for (let i = 1; i <= 10; i++) distribucion[i] = 0
        votosConProfile.forEach((v: any) => { distribucion[v.nota] = (distribucion[v.nota] || 0) + 1 })

        const promedio = votosConProfile.length > 0
            ? Math.round(votosConProfile.reduce((s: number, v: any) => s + v.nota, 0) / votosConProfile.length * 10) / 10
            : 0

        return { votos: votosConProfile, distribucion, promedio: Math.round(promedio * 10) / 10, totalVotos: votosConProfile.length }
    }

    const eliminarPartido = async (partidoId: string) => {
        const { error } = await supabase.from('partidos_amigos').delete().eq('id', partidoId)
        if (error) throw error
        await fetchPartidos()
    }

    const votarFaceta = async (partidoId: string, player_id: string, facet: FacetType) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase.from('facet_votes').upsert({
            partido_amigo_id: partidoId,
            voter_id: user.id,
            player_id,
            facet
        }, { onConflict: 'partido_amigo_id,voter_id,facet' })
        if (error) throw error
    }

    const fetchFacetVotes = async (partidoId: string): Promise<FacetVote[]> => {
        const { data, error } = await supabase
            .from('facet_votes')
            .select('*')
            .eq('partido_amigo_id', partidoId)
        if (error) throw error
        return (data || []) as FacetVote[]
    }

    const eliminarVotoJugador = async (partidoId: string, jugadorId: string) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase
            .from('votos_partido_amigo')
            .delete()
            .eq('partido_amigo_id', partidoId)
            .eq('jugador_id', jugadorId)
            .eq('user_id', user.id)
        if (error) throw error
    }

    const eliminarVotoFaceta = async (partidoId: string, facet: FacetType) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase
            .from('facet_votes')
            .delete()
            .eq('partido_amigo_id', partidoId)
            .eq('voter_id', user.id)
            .eq('facet', facet)
        if (error) throw error
    }

    const reabrirEstadisticas = async (partidoId: string) => {
        const { error } = await supabase
            .from('partidos_amigos')
            .update({ stats_completed: false })
            .eq('id', partidoId)
        if (error) throw error
        await fetchPartidos()
    }

    return {
        partidos, loading, error,
        crearPartido, agregarJugador, eliminarJugador,
        abrirVotacion, cerrarVotacion, cerrarPartidoMundial,
        votarJugador, votarFaceta,
        eliminarVotoJugador, eliminarVotoFaceta,
        fetchFacetVotes, reabrirEstadisticas,
        fetchJugadoresConVotos, fetchDetalleJugador,
        eliminarPartido,
        refetch: fetchPartidos
    }
}
