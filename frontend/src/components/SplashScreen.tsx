'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function SplashScreen() {
    const [show, setShow] = useState(true)
    const [loadingText, setLoadingText] = useState('Cargando la tribuna...')

    useEffect(() => {
        // Basic fixed time (1.5s min) + wait for document ready state
        const timer1 = setTimeout(() => {
            // Check if document is completely loaded
            if (document.readyState === 'complete') {
                setShow(false)
            } else {
                const handleLoad = () => setShow(false)
                window.addEventListener('load', handleLoad)
                return () => window.removeEventListener('load', handleLoad)
            }
        }, 1500)

        // Fallback text if taking more than 3s
        const timer2 = setTimeout(() => {
            setLoadingText('La tribuna se está llenando...')
        }, 3000)

        // Failsafe to hide splashing after 8s anyway
        const timer3 = setTimeout(() => setShow(false), 8000)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
        }
    }, [])

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#00A651] text-white"
                >
                    {/* Logo Animation */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center gap-4 mb-8"
                    >
                        {/* The Logo (FutLog style) */}
                        <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center transform rotate-3">
                            <span className="text-5xl">⚽</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tight drop-shadow-md">
                            FutLog
                        </h1>
                    </motion.div>

                    {/* Loading Indicator */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                        className="flex flex-col items-center gap-3 absolute bottom-16"
                    >
                        <div className="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                        <motion.p
                            key={loadingText}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm font-medium text-white/90"
                        >
                            {loadingText}
                        </motion.p>
                    </motion.div>

                </motion.div>
            )}
        </AnimatePresence>
    )
}
