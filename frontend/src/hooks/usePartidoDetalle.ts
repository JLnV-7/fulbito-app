// src/hooks/usePartidoDetalle.ts
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { JugadorPartidoAmigo, FacetVote, FacetType } from '@/types'

export interface PartidoDetalleData {
    jugadores: JugadorPartidoAmigo[]
    facetVotes: FacetVote[]
}

export function usePartidoDetalle(partidoId: string, grupoId: string) {
    const { user } = useAuth()
    const [data, setData] = useState<PartidoDetalleData>({ jugadores: [], facetVotes: [] })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetch = async () => {
        if (!user) return
        setLoading(true)
        setError(null)
        try {
            const [
                { data: jugs, error: errJ },
                { data: votos, error: errV },
                { data: fVotes, error: errF }
            ] = await Promise.all([
                supabase
                    .from('jugadores_partido_amigo')
                    .select('*')
                    .eq('partido_amigo_id', partidoId)
                    .order('equipo').order('orden'),
                supabase
                    .from('votos_partido_amigo')
                    .select('*')
                    .eq('partido_amigo_id', partidoId),
                supabase
                    .from('facet_votes')
                    .select('*')
                    .eq('partido_amigo_id', partidoId)
            ])

            if (errJ) throw errJ
            if (errV) throw errV
            if (errF) throw errF

            // Traer avatares de los jugadores vinculados a perfiles reales
            const userIds = (jugs || [])
                .map((j: any) => j.user_id)
                .filter(Boolean) as string[]

            let profileAvatars: Record<string, string> = {}
            if (userIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, avatar_url')
                    .in('id', userIds)
                profileAvatars = Object.fromEntries(
                    (profiles || []).map((p: any) => [p.id, p.avatar_url])
                )
            }

            // Calcular promedio y total_votos por jugador
            const jugadoresConStats: JugadorPartidoAmigo[] = (jugs || []).map((j: any) => {
                const votosDeEsteJugador = (votos || []).filter((v: any) => v.jugador_id === j.id)
                const miVoto = votosDeEsteJugador.find((v: any) => v.user_id === user.id) ?? null
                const totalVotos = votosDeEsteJugador.length
                const promedio = totalVotos > 0
                    ? Math.round(votosDeEsteJugador.reduce((s: number, v: any) => s + v.nota, 0) / totalVotos * 10) / 10
                    : 0
                const avatarUrl = j.user_id ? profileAvatars[j.user_id] || null : null

                return { ...j, promedio, total_votos: totalVotos, mi_voto: miVoto, avatar_url: avatarUrl }
            })

            setData({
                jugadores: jugadoresConStats,
                facetVotes: (fVotes || []) as FacetVote[]
            })
        } catch (err: any) {
            setError(err?.message ?? 'Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    const votar = async (jugadorId: string, nota: number, comentario?: string) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase
            .from('votos_partido_amigo')
            .upsert({
                partido_amigo_id: partidoId,
                jugador_id: jugadorId,
                user_id: user.id,
                nota,
                comentario: comentario ?? null
            }, { onConflict: 'partido_amigo_id,jugador_id,user_id' })
        if (error) throw error
        await fetch()
    }

    const eliminarVoto = async (jugadorId: string) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase
            .from('votos_partido_amigo')
            .delete()
            .eq('partido_amigo_id', partidoId)
            .eq('jugador_id', jugadorId)
            .eq('user_id', user.id)
        if (error) throw error
        await fetch()
    }

    const votarFaceta = async (playerId: string, facet: FacetType) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase
            .from('facet_votes')
            .upsert({
                partido_amigo_id: partidoId,
                voter_id: user.id,
                player_id: playerId,
                facet
            }, { onConflict: 'partido_amigo_id,voter_id,facet' })
        if (error) throw error
        await fetch()
    }

    const eliminarFaceta = async (facet: FacetType) => {
        if (!user) throw new Error('No autenticado')
        const { error } = await supabase
            .from('facet_votes')
            .delete()
            .eq('partido_amigo_id', partidoId)
            .eq('voter_id', user.id)
            .eq('facet', facet)
        if (error) throw error
        await fetch()
    }

    const agregarJugador = async (nombre: string, equipo: 'azul' | 'rojo', userId?: string) => {
        const { error } = await supabase
            .from('jugadores_partido_amigo')
            .insert({ partido_amigo_id: partidoId, nombre, equipo, user_id: userId ?? null })
        if (error) throw error
        await fetch()
    }

    const eliminarJugador = async (jugadorId: string) => {
        const { error } = await supabase
            .from('jugadores_partido_amigo')
            .delete()
            .eq('id', jugadorId)
        if (error) throw error
        await fetch()
    }

    const guardarStats = async (
        statsJugadores: { id: string; goles: number; asistencias: number }[],
        resultadoAzul: number,
        resultadoRojo: number
    ) => {
        for (const j of statsJugadores) {
            const { error } = await supabase
                .from('jugadores_partido_amigo')
                .update({ goles: j.goles, asistencias: j.asistencias })
                .eq('id', j.id)
            if (error) throw error
        }
        const { error } = await supabase
            .from('partidos_amigos')
            .update({
                resultado_azul: resultadoAzul,
                resultado_rojo: resultadoRojo,
                stats_completed: true,
                updated_at: new Date().toISOString()
            })
            .eq('id', partidoId)
        if (error) throw error
        await fetch()
    }

    const reabrirStats = async () => {
        const { error } = await supabase
            .from('partidos_amigos')
            .update({ stats_completed: false })
            .eq('id', partidoId)
        if (error) throw error
        await fetch()
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
            .select('id, username, avatar_url')
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

        return { votos: votosConProfile, distribucion, promedio, totalVotos: votosConProfile.length }
    }

    return {
        jugadores: data.jugadores,
        facetVotes: data.facetVotes,
        loading,
        error,
        fetch,
        votar,
        eliminarVoto,
        votarFaceta,
        eliminarFaceta,
        agregarJugador,
        eliminarJugador,
        guardarStats,
        reabrirStats,
        fetchDetalleJugador,
    }
}
