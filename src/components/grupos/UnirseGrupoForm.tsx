'use client'

import { useState } from 'react'
import { useGrupos } from '@/hooks/useGrupos'

interface Props {
    onCancel: () => void
    onSuccess?: () => void
}

export function UnirseGrupoForm({ onCancel, onSuccess }: Props) {
    const { unirseAGrupo } = useGrupos()
    const [codigo, setCodigo] = useState('')
    const [procesando, setProcesando] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!codigo.trim() || codigo.length < 6) return

        setProcesando(true)
        try {
            await unirseAGrupo(codigo)
            setCodigo('')
            if (onSuccess) onSuccess()
            onCancel() // Close form
        } catch (error: any) {
            alert(error.message)
        } finally {
            setProcesando(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="bg-[var(--card-bg)] p-6 rounded-2xl border border-[#ffd700] mb-8">
            <h3 className="font-bold mb-4 text-lg">Unirse a Grupo</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">Código de Invitación</label>
                    <input
                        type="text"
                        placeholder="Ej: FULBO-123"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 outline-none focus:border-[#ffd700] text-center font-mono text-xl tracking-widest uppercase transition-colors"
                        maxLength={8}
                        autoFocus
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
                        Pedile el código al administrador del grupo
                    </p>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={procesando || codigo.length < 6}
                        className="flex-1 bg-[#ffd700] text-black py-3 rounded-xl font-bold hover:bg-[#e6c200] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {procesando ? 'Verificando...' : 'Unirme'}
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
