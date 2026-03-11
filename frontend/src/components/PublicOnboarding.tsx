// src/components/PublicOnboarding.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Smartphone, Globe, Shield } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'

export const PublicOnboarding = () => {
    const [show, setShow] = useState(false)

    useEffect(() => {
        const hasSeen = localStorage.getItem('FutLog-public-onboarding')
        if (!hasSeen) {
            setTimeout(() => setShow(true), 2000)
        }
    }, [])

    const handleClose = () => {
        hapticFeedback(5)
        localStorage.setItem('FutLog-public-onboarding', 'true')
        setShow(false)
    }

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="fixed bottom-24 left-6 right-6 z-50 md:left-auto md:right-10 md:w-80"
                >
                    <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                        <button
                            onClick={handleClose}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-2xl">⚽</span>
                            <h2 className="text-lg font-black italic tracking-tighter capitalize">¡Bienvenido a FutLog!</h2>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex gap-3">
                                <Shield size={20} className="shrink-0 text-[#007BFF]" />
                                <p className="text-[11px] font-bold leading-snug">
                                    Data real-time, tablas y fixtures libres para todos.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Globe size={20} className="shrink-0 text-[#28a745]" />
                                <p className="text-[11px] font-bold leading-snug">
                                    El "Letterboxd del fútbol": rateá jugadores y armá tu prode.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full bg-black text-white py-3 text-xs font-black capitalize tracking-widest hover:bg-gray-800 transition-colors"
                        >
                            Empezar a explorar
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
