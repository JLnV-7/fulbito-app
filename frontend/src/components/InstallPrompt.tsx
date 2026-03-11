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
            // Delay showing on iOS gracefully
            setTimeout(() => setShowPrompt(true), 1500)
        }

        // Detect Android/PC (Chrome/Edge)
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show prompt almost instantly when the browser signals it's ready
            setTimeout(() => setShowPrompt(true), 1000)
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
                    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2.5 right-2.5 w-6 h-6 border border-[var(--card-border)]
                                       bg-[var(--background)] flex items-center justify-center
                                       text-[var(--text-muted)] hover:text-[var(--foreground)]
                                       transition-colors z-10"
                            aria-label="Cerrar"
                        >
                            <X size={10} />
                        </button>

                        <div className="p-4">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="w-10 h-10 bg-[var(--background)] border border-[var(--card-border)]
                                                flex items-center justify-center flex-shrink-0" style={{ borderRadius: 'var(--radius)' }}>
                                    <span className="text-lg">⚽</span>
                                </div>

                                <div className="flex-1 min-w-0 pr-4">
                                    <h3 className="font-black text-[10px] capitalize tracking-widest text-[var(--foreground)] leading-tight">
                                        Instalá FutLog
                                    </h3>
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] capitalize mt-0.5 leading-snug">
                                        {isIOS
                                            ? 'Acceso rápido desde tu inicio'
                                            : 'Accedé más rápido como app'}
                                    </p>
                                </div>
                            </div>

                            {/* Action area */}
                            <div className="mt-3">
                                {isIOS ? (
                                    <p className="text-[9px] font-bold capitalize text-[var(--text-muted)] bg-[var(--background)] border border-[var(--card-border)] px-3 py-2 flex items-center gap-2">
                                        <Share size={12} className="text-[var(--foreground)] flex-shrink-0" />
                                        <span>
                                            Tocá <span className="font-black text-[var(--foreground)]">Compartir</span> y luego{' '}
                                            <span className="font-black text-[var(--foreground)]">"Agregar a Inicio"</span>
                                        </span>
                                    </p>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleDismiss}
                                            className="flex-1 py-2 border border-[var(--card-border)] text-[9px] font-black capitalize
                                                       text-[var(--text-muted)] hover:text-[var(--foreground)]
                                                       hover:bg-[var(--hover-bg)] transition-all"
                                        >
                                            AHORA NO
                                        </button>
                                        <button
                                            onClick={handleInstallClick}
                                            className="flex-1 py-2 border border-[var(--foreground)] text-[9px] font-black capitalize
                                                       bg-[var(--foreground)] text-[var(--background)]
                                                       transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <Download size={11} />
                                            INSTALAR
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
