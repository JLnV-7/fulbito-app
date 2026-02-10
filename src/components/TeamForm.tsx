// src/components/TeamForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TeamFormProps {
    equipo: string
    compact?: boolean
}

type FormResult = 'V' | 'E' | 'D'

export function TeamForm({ equipo, compact = false }: TeamFormProps) {
    const [form, setForm] = useState<FormResult[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchForm()
    }, [equipo])

    const fetchForm = async () => {
        try {
            // Buscar últimos 5 partidos finalizados de este equipo
            const { data, error } = await supabase
                .from('partidos')
                .select('*')
                .or(`equipo_local.eq.${equipo},equipo_visitante.eq.${equipo}`)
                .eq('estado', 'FINALIZADO')
                .order('fecha_inicio', { ascending: false })
                .limit(5)

            if (error) throw error

            const results: FormResult[] = (data || []).map(partido => {
                const esLocal = partido.equipo_local === equipo
                const golesEquipo = esLocal ? partido.goles_local : partido.goles_visitante
                const golesRival = esLocal ? partido.goles_visitante : partido.goles_local

                if (golesEquipo > golesRival) return 'V'
                if (golesEquipo < golesRival) return 'D'
                return 'E'
            })

            // Invertir para mostrar más antiguo primero
            setForm(results.reverse())
        } catch (error) {
            console.error('Error fetching form:', error)
        } finally {
            setLoading(false)
        }
    }

    const getColor = (result: FormResult) => {
        switch (result) {
            case 'V': return 'bg-[#10b981] text-white'
            case 'E': return 'bg-[#6b7280] text-white'
            case 'D': return 'bg-[#ef4444] text-white'
        }
    }

    if (loading || form.length === 0) return null

    return (
        <div className={`flex gap-0.5 ${compact ? '' : 'justify-center'}`}>
            {form.map((result, idx) => (
                <span
                    key={idx}
                    className={`${getColor(result)} ${compact ? 'w-4 h-4 text-[8px]' : 'w-5 h-5 text-[9px]'} 
                               rounded-sm flex items-center justify-center font-black`}
                    title={result === 'V' ? 'Victoria' : result === 'E' ? 'Empate' : 'Derrota'}
                >
                    {result}
                </span>
            ))}
        </div>
    )
}
