'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGrupos } from '@/hooks/useGrupos'

interface Props {
    onCancel: () => void
    onSuccess?: () => void
}

export function CrearGrupoForm({ onCancel, onSuccess }: Props) {
    const router = useRouter()
    const { crearGrupo } = useGrupos()
    const [nombre, setNombre] = useState('')
    const [procesando, setProcesando] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nombre.trim()) return

        setProcesando(true)
        try {
            const grupo = await crearGrupo(nombre)
            setNombre('')
            if (onSuccess) onSuccess()
            // Navegar directamente al grupo creado
            router.push(`/grupos/${grupo.id}`)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setProcesando(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[#10b981] mb-8">
            <h3 className="font-bold mb-4 text-lg">Nuevo Grupo</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Nombre del Grupo</label>
                    <input
                        type="text"
                        placeholder="Ej: Los Pibes del Fulbito"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 outline-none focus:border-[#10b981] transition-colors"
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={procesando || !nombre.trim()}
                        className="flex-1 bg-[#10b981] text-white py-3 rounded-xl font-bold hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {procesando ? 'Creando...' : 'Crear Grupo'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </form>
    )
}
