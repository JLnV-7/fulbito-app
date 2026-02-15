'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Don't show if already dismissed
        if (localStorage.getItem('pwa-dismissed')) return

        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        if (isIosDevice && !isStandalone) {
            setIsIOS(true)
            setTimeout(() => setShowPrompt(true), 3000)
        }

        // Detect Android/PC (Chrome/Edge)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShowPrompt(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        }
    }, [])

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-dismissed', 'true')
    }

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setShowPrompt(false)
        }
        setDeferredPrompt(null)
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 left-4 right-4 z-50 bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl shadow-2xl flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-[#10b981] w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                            ⚽
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--foreground)] text-sm">Instalar Fulbito</h3>
                            <p className="text-xs text-[var(--text-muted)]">Acceso rápido y pantalla completa</p>
                        </div>
                    </div>

                    {isIOS ? (
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={handleDismiss}
                                className="text-[var(--text-muted)] hover:text-[var(--foreground)] mb-1"
                            >
                                ✕
                            </button>
                            <p className="text-xs text-[var(--text-muted)] max-w-[200px] text-right">
                                Tocá el botón <span className="text-[#10b981] font-bold">Compartir</span> y elegí <span className="font-bold text-[var(--foreground)]">"Agregar a Inicio"</span>
                            </p>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleDismiss}
                                className="px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)]"
                            >
                                No
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="px-3 py-1.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-all"
                            >
                                Instalar
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
