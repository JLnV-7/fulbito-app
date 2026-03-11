'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Users, Shield, Link as LinkIcon, Share2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from './ui/Button'

interface CreateGroupModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: (groupId: string) => void
}

export function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
    const { user } = useAuth()
    const { showToast } = useToast()
    const router = useRouter()

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [createdGroup, setCreatedGroup] = useState<{ id: string, name: string } | null>(null)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return
        if (!name.trim()) {
            showToast('El nombre del grupo es obligatorio', 'error')
            return
        }

        setIsSubmitting(true)
        try {
            // First create the group
            const { data: groupData, error: groupError } = await supabase
                .from('grupos')
                .insert({
                    name: name.trim(),
                    description: description.trim(),
                    is_private: isPrivate,
                    created_by: user.id
                })
                .select('id, name')
                .single()

            if (groupError) throw groupError

            // Then automatically add creator as admin/member to grupo_members
            const { error: memberError } = await supabase
                .from('grupo_members')
                .insert({
                    grupo_id: groupData.id,
                    user_id: user.id,
                    role: 'admin'
                })

            if (memberError) throw memberError

            setCreatedGroup(groupData)
            showToast('Grupo creado correctamente', 'success')

            if (onSuccess) onSuccess(groupData.id)

        } catch (error) {
            console.error('Error creating group:', error)
            showToast('Hubo un error al crear el grupo', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    const shareUrl = typeof window !== 'undefined' && createdGroup
        ? `${window.location.origin}/grupos/${createdGroup.id}/join`
        : ''

    const handleShare = async () => {
        if (!shareUrl) return
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Sumate a ${createdGroup?.name} en FutLog`,
                    text: `¡Preparate para el prode! Uníte a mi grupo privado en FutLog. 🏆⚽`,
                    url: shareUrl,
                })
            } catch (err) {
                console.error(err)
            }
        } else {
            navigator.clipboard.writeText(shareUrl)
            showToast('Link de invitación copiado', 'success')
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[var(--card-bg)] w-full max-w-sm p-6 border border-[var(--card-border)] relative overflow-hidden"
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-[var(--background)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors z-10 border border-[var(--card-border)]"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        <X size={18} />
                    </button>

                    {!createdGroup ? (
                        <>
                            <div className="w-12 h-12 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20 flex items-center justify-center mb-4" style={{ borderRadius: 'var(--radius)' }}>
                                <Users size={24} />
                            </div>

                            <h2 className="text-xl font-black capitalize italic tracking-tighter">Crear Grupo</h2>
                            <p className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mb-6">
                                Armá tu tribuna virtual para debatir.
                            </p>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] capitalize tracking-widest mb-1.5 block">
                                        Nombre del Grupo
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="EJ: FÚTBOL DE LOS JUEVES"
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] px-4 py-3 text-sm font-black capitalize tracking-tighter focus:outline-none focus:border-[#16a34a] transition-colors"
                                        style={{ borderRadius: 'var(--radius)' }}
                                        maxLength={40}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-[var(--text-muted)] capitalize tracking-widest mb-1.5 block">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="¿DE QUÉ SE TRATA?"
                                        className="w-full bg-[var(--background)] border border-[var(--card-border)] px-4 py-3 text-sm font-black focus:outline-none focus:border-[#16a34a] transition-colors resize-none h-20"
                                        style={{ borderRadius: 'var(--radius)' }}
                                        maxLength={160}
                                    />
                                </div>

                                {/* Private Toggle */}
                                <div
                                    className={`p-4 border flex gap-3 cursor-pointer transition-colors ${isPrivate ? 'bg-[#16a34a]/5 border-[#16a34a]/30' : 'bg-[var(--background)] border-[var(--card-border)]'}`}
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    style={{ borderRadius: 'var(--radius)' }}
                                >
                                    <div className={`mt-0.5 ${isPrivate ? 'text-[#16a34a]' : 'text-[var(--text-muted)]'}`}>
                                        {isPrivate ? <Lock size={20} /> : <Shield size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={`text-[10px] font-black capitalize tracking-widest ${isPrivate ? 'text-[#16a34a]' : ''}`}>
                                                Grupo Privado
                                            </span>
                                            <div className={`w-10 h-6 border p-1 transition-colors ${isPrivate ? 'bg-[#16a34a] border-[#16a34a]' : 'bg-[var(--background)] border-[var(--card-border)]'}`} style={{ borderRadius: 'var(--radius)' }}>
                                                <div className={`w-4 h-4 bg-white transition-transform ${isPrivate ? 'translate-x-4' : 'translate-x-0'}`} style={{ borderRadius: '2px' }} />
                                            </div>
                                        </div>
                                        <p className="text-[9px] font-black capitalize tracking-widest text-[var(--text-muted)] leading-tight italic">
                                            {isPrivate
                                                ? 'Sólo con invitación.'
                                                : 'Público. Cualquiera puede sumarse.'}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    loading={isSubmitting}
                                    disabled={!name.trim()}
                                    fullWidth
                                    className="mt-2"
                                >
                                    Crear grupo
                                </Button>
                            </form>
                        </>
                    ) : (
                        // SUCCESS STATE - INVITE QR
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20 flex items-center justify-center mb-4 text-3xl" style={{ borderRadius: 'var(--radius)' }}>
                                🎉
                            </div>
                            <h2 className="text-xl font-black capitalize italic tracking-tighter">Grupo creado</h2>
                            <p className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)] mb-6">
                                Invitá a tus amigos a "{createdGroup.name}".
                            </p>

                            <div className="bg-white p-3 border border-[var(--card-border)] mb-6 transition-transform hover:scale-105" style={{ borderRadius: 'var(--radius)' }}>
                                <QRCodeSVG
                                    value={shareUrl}
                                    size={160}
                                    level="H"
                                    includeMargin={false}
                                    fgColor="#000000"
                                    bgColor="#ffffff"
                                />
                            </div>

                            <div className="w-full grid grid-cols-2 gap-2">
                                <Button
                                    onClick={handleShare}
                                    icon={Share2}
                                    fullWidth
                                >
                                    Compartir
                                </Button>
                                <Button
                                    onClick={() => {
                                        onClose()
                                        router.push(`/grupos/${createdGroup.id}`)
                                    }}
                                    variant="secondary"
                                    fullWidth
                                >
                                    Ir al grupo
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
