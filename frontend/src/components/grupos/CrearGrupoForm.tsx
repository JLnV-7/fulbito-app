'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGrupos } from '@/hooks/useGrupos'
import { motion } from 'framer-motion'

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
            router.push(`/grupos/${grupo.id}`)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setProcesando(false)
        }
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="bg-[var(--card-bg)] p-8 rounded-3xl border border-[var(--card-border)] shadow-xl mb-12"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#10b981]/20 rounded-xl flex items-center justify-center text-xl">👥</div>
                <div>
                    <h3 className="font-black italic text-xl capitalize tracking-tighter">Nuevo Grupo</h3>
                    <p className="text-xs text-[var(--text-muted)] font-medium">Sumá a tus amigos y empezá a votar</p>
                </div>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black capitalize tracking-[0.2em] text-[var(--text-muted)] mb-2">Nombre del Grupo</label>
                    <input
                        type="text"
                        placeholder="Ej: Los Pibes del FutLog"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-[var(--background)] border-2 border-[var(--card-border)] rounded-2xl px-5 py-4 outline-none focus:border-[#10b981] transition-all font-bold text-lg"
                        autoFocus
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={procesando || !nombre.trim()}
                        className="flex-1 bg-[#10b981] text-white py-4 rounded-2xl font-black capitalize tracking-widest text-xs shadow-lg shadow-emerald-500/20 hover:brightness-110 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        {procesando ? 'Creando...' : 'Crear Grupo'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-8 py-4 bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--card-border)] rounded-2xl transition-all font-black capitalize tracking-widest text-xs"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </motion.form>
    )
}
