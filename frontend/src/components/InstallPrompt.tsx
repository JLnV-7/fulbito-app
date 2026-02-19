'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share } from 'lucide-react'

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Don't show if already dismissed
        if (localStorage.getItem('pwa-dismissed')) return

        // Don't show if already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        if (isStandalone) return

        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        if (isIosDevice) {
            setIsIOS(true)
            // Delay showing on iOS so user has time to engage first
            setTimeout(() => setShowPrompt(true), 5000)
        }

        // Detect Android/PC (Chrome/Edge)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Delay on desktop/android too — let user browse first
            setTimeout(() => setShowPrompt(true), 4000)
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
            localStorage.setItem('pwa-dismissed', 'true')
        }
        setShowPrompt(false)
        setDeferredPrompt(null)
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed z-50
                        bottom-20 left-4 right-4
                        md:bottom-6 md:left-auto md:right-6 md:max-w-xs"
                >
                    <div className="bg-[var(--card-bg)]/95 backdrop-blur-xl border border-[var(--card-border)]
                                    rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full
                                       bg-[var(--background)]/80 flex items-center justify-center
                                       text-[var(--text-muted)] hover:text-[var(--foreground)]
                                       transition-colors z-10"
                            aria-label="Cerrar"
                        >
                            <X size={12} />
                        </button>

                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#10b981] to-[#047857]
                                                flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                                    <span className="text-xl">⚽</span>
                                </div>

                                <div className="flex-1 min-w-0 pr-4">
                                    <h3 className="font-bold text-sm text-[var(--foreground)] leading-tight">
                                        Instalá Fulbito
                                    </h3>
                                    <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                                        {isIOS
                                            ? 'Acceso rápido desde tu pantalla de inicio'
                                            : 'Accedé más rápido como app nativa'}
                                    </p>
                                </div>
                            </div>

                            {/* Action area */}
                            <div className="mt-3">
                                {isIOS ? (
                                    <p className="text-[11px] text-[var(--text-muted)] bg-[var(--background)]/60 rounded-lg px-3 py-2 flex items-center gap-2">
                                        <Share size={14} className="text-[#10b981] flex-shrink-0" />
                                        <span>
                                            Tocá <span className="font-semibold text-[var(--foreground)]">Compartir</span> y luego{' '}
                                            <span className="font-semibold text-[var(--foreground)]">"Agregar a Inicio"</span>
                                        </span>
                                    </p>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDismiss}
                                            className="flex-1 py-2 rounded-lg text-xs font-semibold
                                                       text-[var(--text-muted)] hover:text-[var(--foreground)]
                                                       hover:bg-[var(--background)]/60 transition-all"
                                        >
                                            Ahora no
                                        </button>
                                        <button
                                            onClick={handleInstallClick}
                                            className="flex-1 py-2 rounded-lg text-xs font-bold
                                                       bg-gradient-to-r from-[#10b981] to-[#059669]
                                                       text-white hover:shadow-lg hover:shadow-emerald-500/25
                                                       transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Download size={13} />
                                            Instalar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
