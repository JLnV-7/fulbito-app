// src/components/OnboardingModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ChevronRight, Film, Star, Users, Trophy, QrCode, UserPlus, Layout, Sparkles } from 'lucide-react'
import { Button } from './ui/Button'
import { checkAndAwardBadges } from '@/app/actions/badges'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'

const ONBOARDING_KEY = 'FutLog_onboarding_done'

const slides = [
    {
        emoji: '🏟️',
        title: '¡Bienvenido a FutLog!',
        description: 'Tu Letterboxd del fútbol. Rateá partidos enteros, armá tu prode y competí con la comunidad.',
        color: 'var(--accent)',
        icon: Star,
        visual: null
    },
    {
        emoji: '⭐',
        title: 'Rateá tu primer partido',
        description: 'Puntuá el juego, elegí figura, villano y criticá al árbitro. Que quede guardado para la historia.',
        color: 'var(--accent-yellow)',
        icon: Film,
        visual: (
            <div className="flex justify-center gap-1 my-4 bg-[var(--background)] py-2 px-4 rounded-full border border-[var(--card-border)] w-fit mx-auto">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={24} fill="currentColor" className="text-[var(--accent-yellow)]" />)}
            </div>
        )
    },
    {
        emoji: '🎯',
        title: 'Prode y Competencia',
        description: 'Pronosticá resultados exactos, sumá puntos fecha a fecha y demostrá quién sabe de verdad.',
        color: 'var(--accent-green)',
        icon: Trophy,
        visual: null
    },
    {
        emoji: '🚀',
        title: '¡Ya estás listo!',
        description: 'Completá tu perfil para desbloquear tu medalla de "Beta Explorer" y empezar a sumar XP.',
        color: 'var(--accent-blue)',
        icon: Sparkles,
        visual: null
    },
]

export function OnboardingModal() {
    const { user } = useAuth()
    const { showToast } = useToast()
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

    const handleNext = async () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        } else {
            if (user) {
                try {
                    await checkAndAwardBadges(user.id)
                } catch (e) {
                    console.error("Error awarding beta badge:", e)
                }
            }
            handleClose()
        }
    }

    const handleClose = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true')
        setIsOpen(false)
    }

    if (!isOpen) return null

    const slide = slides[currentSlide]

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
                    {/* Skip button - Hidden on last slide */}
                    <div className="flex justify-end mb-2 h-4">
                        {currentSlide < slides.length - 1 && (
                            <button
                                onClick={handleClose}
                                className="text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                Saltar
                            </button>
                        )}
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
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-4 max-w-xs mx-auto">
                        {slide.description}
                    </p>

                    {/* Visual Extra & CTAs on last slide */}
                    {currentSlide === slides.length - 1 ? (
                        <div className="space-y-2 mb-6 text-left">
                            <Button
                                variant="glass"
                                size="sm"
                                fullWidth
                                onClick={() => { handleClose(); router.push('/perfil'); }}
                                icon={QrCode}
                                className="justify-start px-4 py-3"
                            >
                                Generar mi QR
                            </Button>
                            <Button
                                variant="glass"
                                size="sm"
                                fullWidth
                                onClick={() => { handleClose(); router.push('/grupos'); }}
                                icon={UserPlus}
                                className="justify-start px-4 py-3"
                            >
                                Crear mi primer grupo
                            </Button>
                            <Button
                                variant="glass"
                                size="sm"
                                fullWidth
                                onClick={() => { handleClose(); router.push('/build-xi'); }}
                                icon={Layout}
                                className="justify-start px-4 py-3"
                            >
                                Armar mi XI
                            </Button>
                        </div>
                    ) : (
                        slide.visual && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="mb-4"
                            >
                                {slide.visual}
                            </motion.div>
                        )
                    )}

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

                    {/* Main CTA */}
                    <Button
                        onClick={handleNext}
                        variant={currentSlide === slides.length - 1 ? "primary" : "secondary"}
                        fullWidth
                        size="lg"
                        icon={ChevronRight}
                    >
                        {currentSlide === slides.length - 1 ? '¡Empezar ahora!' : 'Siguiente'}
                    </Button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
