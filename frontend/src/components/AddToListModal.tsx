// src/components/AddToListModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, ListPlus, Lock, Unlock } from 'lucide-react'
import { useUserLists } from '@/hooks/useUserLists'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

interface AddToListModalProps {
    isOpen: boolean
    onClose: () => void
    matchData: {
        partido_id: string
        equipo_local: string
        equipo_visitante: string
        logo_local?: string
        logo_visitante?: string
    }
}

export function AddToListModal({ isOpen, onClose, matchData }: AddToListModalProps) {
    const { user } = useAuth()
    const { lists, fetchLists, loading, createList, addToList } = useUserLists()
    const { showToast } = useToast()

    const [isCreating, setIsCreating] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newDesc, setNewDesc] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen && user) {
            fetchLists()
        }
    }, [isOpen, user, fetchLists])

    if (!isOpen) return null

    const handleAdd = async (listId: string) => {
        setIsSubmitting(true)
        const success = await addToList(listId, matchData)
        if (success) {
            showToast('Añadido a la lista exitosamente', 'success')
            onClose()
        } else {
            showToast('Error al añadir a la lista', 'error')
        }
        setIsSubmitting(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTitle.trim()) return

        setIsSubmitting(true)
        const newList = await createList(newTitle, newDesc, isPublic)
        if (newList) {
            await handleAdd(newList.id) // Automatically add the current item to the new list
        } else {
            showToast('Error al crear la lista', 'error')
            setIsSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-[var(--background)] border border-[var(--card-border)] rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)] bg-[var(--card-bg)]">
                        <div className="flex items-center gap-2 font-bold text-lg">
                            <ListPlus className="text-[var(--accent)]" />
                            Añadir a lista
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-[var(--hover-bg)] rounded-full transition-colors text-[var(--text-muted)]">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                        {isCreating ? (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-muted)]">Nombre de la lista *</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={50}
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="Ej: Finales de Infarto"
                                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1 text-[var(--text-muted)]">Descripción (opcional)</label>
                                    <textarea
                                        maxLength={200}
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="De qué se trata esta lista..."
                                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-4 py-2 text-sm resize-none h-20 focus:outline-none focus:border-[var(--accent)]"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold flex items-center gap-1">
                                            {isPublic ? <Unlock size={14} className="text-green-500" /> : <Lock size={14} className="text-red-500" />}
                                            {isPublic ? 'Lista Pública' : 'Lista Privada'}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {isPublic ? 'Cualquiera podrá verla en tu perfil' : 'Solo vos podés verla'}
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                                    </label>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-2 rounded-xl text-sm font-semibold bg-[var(--card-bg)] border border-[var(--card-border)] hover:bg-[var(--hover-bg)] transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newTitle.trim() || isSubmitting}
                                        className="flex-1 py-2 rounded-xl text-sm font-bold bg-[var(--accent)] text-white hover:brightness-110 transition-all disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Crear y Añadir'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-[var(--card-border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all font-semibold"
                                >
                                    <Plus size={18} />
                                    Crear nueva lista
                                </button>

                                {loading ? (
                                    <div className="flex justify-center p-6"><Loader2 className="animate-spin text-[var(--accent)]" /></div>
                                ) : lists.length > 0 ? (
                                    <div className="space-y-2 mt-4">
                                        <h4 className="text-xs font-bold text-[var(--text-muted)] capitalize tracking-wider mb-2">Mis Listas</h4>
                                        {lists.map(list => (
                                            <button
                                                key={list.id}
                                                onClick={() => handleAdd(list.id)}
                                                disabled={isSubmitting}
                                                className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--accent)] transition-colors text-left group"
                                            >
                                                <div>
                                                    <div className="font-bold flex items-center gap-1.5 line-clamp-1">
                                                        {!list.is_public && <Lock size={12} className="text-[var(--text-muted)]" />}
                                                        {list.title}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-muted)] font-medium">
                                                        {list._count} {list._count === 1 ? 'partido' : 'partidos'}
                                                    </div>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} className="text-[var(--accent)]" />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-[var(--text-muted)] text-sm">
                                        Aún no tenés ninguna lista creada.<br />Armá tu primera colección.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
