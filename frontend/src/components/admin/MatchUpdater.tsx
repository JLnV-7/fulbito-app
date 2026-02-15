'use client'

import { useState, useEffect } from 'react'
import { fetchFixturesAction, updateMatchScoreAction } from '@/app/actions/football'
import type { Partido } from '@/types'
import { LIGAS } from '@/lib/constants'

export function MatchUpdater() {
    const [matches, setMatches] = useState<Partido[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedLiga, setSelectedLiga] = useState('Liga Profesional')

    useEffect(() => {
        loadMatches()
    }, [selectedLiga])

    const loadMatches = async () => {
        setLoading(true)
        try {
            const data = await fetchFixturesAction(selectedLiga)
            // Filtrar partidos de hoy/ayer/mañana para no cargar todo el calendario
            const recent = data.filter(m => {
                const date = new Date(m.fecha_inicio)
                const now = new Date()
                const diffTime = Math.abs(now.getTime() - date.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                return diffDays <= 3 // +/- 3 días
            })
            setMatches(recent)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Cargar Resultados</h2>
                <select
                    value={selectedLiga}
                    onChange={(e) => setSelectedLiga(e.target.value)}
                    className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg px-3 py-1 text-sm"
                >
                    {LIGAS.map(liga => (
                        <option key={liga} value={liga}>{liga}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="text-center py-4">Cargando partidos...</div>
            ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {matches.map(match => (
                        <MatchEditor key={match.id} match={match} />
                    ))}
                    {matches.length === 0 && (
                        <p className="text-center text-[var(--text-muted)]">No hay partidos recientes</p>
                    )}
                </div>
            )}
        </div>
    )
}

function MatchEditor({ match }: { match: Partido }) {
    const [local, setLocal] = useState(match.goles_local?.toString() || '')
    const [visitante, setVisitante] = useState(match.goles_visitante?.toString() || '')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        if (local === '' || visitante === '') return alert('Ingresá los goles')

        setSaving(true)
        try {
            await updateMatchScoreAction(Number(match.id), Number(local), Number(visitante))
            alert('✅ Resultado actualizado! Los puntos se recalcularán automáticamente.')
        } catch (error) {
            console.error(error)
            alert('❌ Error al actualizar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl border border-[var(--card-border)]">
            <div className="flex-1 text-right pr-2">
                <span className="font-bold block text-sm">{match.equipo_local}</span>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    className="w-10 h-10 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg font-bold"
                    placeholder="-"
                />
                <span className="text-[var(--text-muted)]">-</span>
                <input
                    type="number"
                    value={visitante}
                    onChange={(e) => setVisitante(e.target.value)}
                    className="w-10 h-10 text-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg font-bold"
                    placeholder="-"
                />
            </div>

            <div className="flex-1 text-left pl-2">
                <span className="font-bold block text-sm">{match.equipo_visitante}</span>
            </div>

            <button
                onClick={handleSave}
                disabled={saving || (match.estado === 'FINALIZADO' && match.goles_local === Number(local) && match.goles_visitante === Number(visitante))}
                className="ml-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg disabled:opacity-50 disabled:bg-gray-600"
            >
                {saving ? '...' : '💾'}
            </button>
        </div>
    )
}
