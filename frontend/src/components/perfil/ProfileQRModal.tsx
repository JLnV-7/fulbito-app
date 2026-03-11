'use client'

import { X, Share2, Download, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { hapticFeedback } from '@/lib/helpers'

interface ProfileQRModalProps {
    isOpen: boolean
    onClose: () => void
    username: string
    userId: string
}

export function ProfileQRModal({ isOpen, onClose, username, userId }: ProfileQRModalProps) {
    const [copied, setCopied] = useState(false)
    const profileUrl = `${window.location.origin}/perfil/${userId}`

    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl)
        setCopied(true)
        hapticFeedback(200)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Perfil de ${username} en FutLog`,
                    text: `¡Mirá mis estadísticas de fútbol en FutLog!`,
                    url: profileUrl,
                })
            } catch (err) {
                console.error('Error sharing:', err)
            }
        } else {
            handleCopy()
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-[var(--card-bg)] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 pt-12 text-center">
                            <div className="mb-8">
                                <h3 className="text-2xl font-black italic tracking-tighter text-white capitalize mb-2">MI TARJETA</h3>
                                <p className="text-xs text-white/50 font-medium tracking-wide">Escaneá para ver mi perfil</p>
                            </div>

                            <div className="relative mx-auto mb-10 p-6 bg-white rounded-3xl shadow-2xl max-w-[240px]">
                                <QRCodeSVG
                                    value={profileUrl}
                                    size={192}
                                    level="H"
                                    includeMargin={false}
                                    className="w-full h-auto"
                                />
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest capitalize shadow-lg">
                                    @{username}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white rounded-2xl py-4 transition-all active:scale-95 border border-white/5"
                                >
                                    {copied ? <Check size={18} className="text-[#10b981]" /> : <Copy size={18} />}
                                    <span className="text-xs font-bold">{copied ? 'Copiado' : 'Link'}</span>
                                </button>

                                <button
                                    onClick={handleShare}
                                    className="flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-2xl py-4 transition-all active:scale-95 shadow-lg shadow-[var(--accent)]/20"
                                >
                                    <Share2 size={18} />
                                    <span className="text-xs font-bold italic capitalize tracking-wider">COMPARTIR</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
