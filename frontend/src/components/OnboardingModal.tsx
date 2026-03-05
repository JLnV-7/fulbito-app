// src/components/OnboardingModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronRight, Film, Star, Users, Trophy } from 'lucide-react'

const ONBOARDING_KEY = 'FutLog_onboarding_done'

const slides = [
    {
        emoji: '⚽',
        title: '¡Bienvenido a FutLog!',
        description: 'Tu Letterboxd del fútbol. Puntuá partidos, compartí reseñas y competí con amigos.',
        color: '#ff6b6b',
        icon: Star,
    },
    {
        emoji: '🎬',
        title: 'Logueá cada partido',
        description: 'Puntuá el partido, árbitro y jugadores. Elegí cómo lo viste: TV, cancha o con amigos.',
        color: '#f59e0b',
        icon: Film,
    },
    {
        emoji: '🏆',
        title: 'Competí y ganate badges',
        description: 'Desbloqueá logros, subí en el ranking del Prode y uníte a grupos con tus amigos.',
        color: '#10b981',
        icon: Trophy,
    },
]

export function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [currentSlide, setCurrentSlide] = useState(0)
    const router = useRouter()

    useEffect(() => {
        // Only show once
        const done = localStorage.getItem(ONBOARDING_KEY)
        if (!done) {
            // Small delay so the app loads first
            const timer = setTimeout(() => setIsOpen(true), 800)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            handleClose()
        }
    }

    const handleClose = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true')
        setIsOpen(false)
    }

    if (!isOpen) return null

    const slide = slides[currentSlide]
    const SlideIcon = slide.icon

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
                <motion.div
                    key={currentSlide}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: -20 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className="bg-[var(--card-bg)] rounded-3xl p-8 w-full max-w-sm border border-[var(--card-border)] shadow-2xl text-center"
                >
                    {/* Skip button */}
                    <div className="flex justify-end mb-2">
                        <button
                            onClick={handleClose}
                            className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                        >
                            Saltar
                        </button>
                    </div>

                    {/* Icon/Emoji */}
                    <motion.div
                        key={`icon-${currentSlide}`}
                        initial={{ scale: 0.5, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 10, delay: 0.1 }}
                        className="text-6xl mb-6"
                    >
                        {slide.emoji}
                    </motion.div>

                    {/* Title */}
                    <h2 className="text-xl font-black mb-3 text-[var(--foreground)]">{slide.title}</h2>

                    {/* Description */}
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8 max-w-xs mx-auto">
                        {slide.description}
                    </p>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-2 mb-6">
                        {slides.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide
                                        ? 'w-6 bg-[var(--accent)]'
                                        : 'w-1.5 bg-[var(--card-border)]'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleNext}
                        style={{ background: slide.color }}
                        className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2
                     hover:opacity-90 transition-all shadow-lg active:scale-[0.98]"
                    >
                        {currentSlide === slides.length - 1 ? '¡Empezar!' : 'Siguiente'}
                        <ChevronRight size={18} />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
