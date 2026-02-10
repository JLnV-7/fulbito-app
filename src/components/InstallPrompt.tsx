'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
        if (isIosDevice && !isStandalone) {
            setIsIOS(true)
            // Show iOS prompt after a delay if not installed
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
                    className="fixed bottom-20 left-4 right-4 z-50 bg-[#1c1c1c] border border-gray-800 p-4 rounded-xl shadow-2xl flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center text-xl">
                            ⚽
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Instalar Fulbito</h3>
                            <p className="text-xs text-gray-400">Acceso rápido y pantalla completa</p>
                        </div>
                    </div>

                    {isIOS ? (
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPrompt(false)}
                                className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-white"
                            >
                                No
                            </button>
                            <button
                                onClick={handleInstallClick}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
                            >
                                Instalar
                            </button>
                        </div>
                    )}

                    {isIOS && (
                        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#1c1c1c] border-r border-b border-gray-800 transform rotate-45"></div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
