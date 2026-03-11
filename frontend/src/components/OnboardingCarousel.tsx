// src/components/OnboardingCarousel.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Star, MessageCircle, Trophy, Sparkles, ChevronRight, X, Search, TrendingUp, QrCode } from 'lucide-react'
import { checkAndAwardBadges } from '@/app/actions/badges'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/Button'

const SLIDES = [
    {
        id: 1,
        icon: <span className="text-6xl drop-shadow-lg">🏟️</span>,
        title: 'Bienvenido a FutLog',
        description: 'Tu Letterboxd del fútbol. Rateá partidos, armá tu prode y competí con la comunidad.',
        bgOffset: 'bg-gradient-to-br from-[var(--card-bg)] to-[var(--background)]'
    },
    {
        id: 2,
        icon: (
            <div className="relative">
                <Star size={56} className="text-[var(--accent-yellow)] drop-shadow-md" fill="currentColor" />
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="absolute -bottom-2 -right-3 bg-[var(--background)] px-2 py-1 rounded-lg shadow-xl border border-[var(--card-border)] text-xs font-bold"
                >
                    ¡Partidazo! 🔥
                </motion.div>
            </div>
        ),
        title: 'Puntuá con Pasión',
        description: 'Calificá desde la táctica hasta la hinchada. Armá tus propias listas de partidos inolvidables.',
        bgOffset: 'bg-gradient-to-br from-[var(--card-bg)] to-[#f59e0b]/5'
    },
    {
        id: 3,
        icon: <MessageCircle size={56} className="text-[#16a34a] drop-shadow-md" />,
        title: 'Viví la Previa',
        description: 'Unite al Chat en Vivo durante los partidos. Debatí minuto a minuto y seguí la acción.',
        bgOffset: 'bg-gradient-to-br from-[var(--card-bg)] to-[#16a34a]/5'
    },
    {
        id: 4,
        icon: <Trophy size={56} className="text-[var(--accent-green)] drop-shadow-md" />,
        title: 'Entrá a la Cancha',
        description: 'Acertá resultados en el Prode, sumá XP, subí de Nivel y desbloqueá medallas exclusivas.',
        bgOffset: 'bg-gradient-to-br from-[var(--card-bg)] to-[var(--accent-green)]/5'
    },
    {
        id: 5,
        icon: <Sparkles size={56} className="text-[#3b82f6] drop-shadow-md" />,
        title: '¡Ya estás listo!',
        description: 'Empezá a usar FutLog para desbloquear tu medalla de Beta Explorer.',
        bgOffset: 'bg-gradient-to-br from-[var(--card-bg)] to-[#3b82f6]/5'
    }
]

export function OnboardingCarousel() {
    const router = useRouter()
    const { user } = useAuth()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true) // Default to true to prevent flash

    useEffect(() => {
        const seen = localStorage.getItem('FutLog-Onboarding-Seen')
        if (!seen) {
            setHasSeenOnboarding(false)
        }
    }, [])

    const handleNext = () => {
        if (currentSlide < SLIDES.length - 1) {
            setCurrentSlide(prev => prev + 1)
        } else {
            finishOnboarding()
        }
    }

    const finishOnboarding = async () => {
        localStorage.setItem('FutLog-Onboarding-Seen', 'true')
        setHasSeenOnboarding(true)

        if (user) {
            try {
                await checkAndAwardBadges(user.id)
            } catch (e) {
                console.error("Error awarding beta badge:", e)
            }
        }
    }

    if (hasSeenOnboarding) return null

    const slide = SLIDES[currentSlide]

    return (
        <div className={`mb-6 relative overflow-hidden rounded-[var(--radius)] border border-[var(--card-border)] p-6 shadow-sm min-h-[220px] flex flex-col justify-between ${slide.bgOffset} transition-colors duration-500`}>

            {/* Skip Button - Hidden on last slide */}
            {currentSlide < SLIDES.length - 1 && (
                <button
                    onClick={finishOnboarding}
                    className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors p-1 z-20"
                    title="Saltar"
                >
                    <span className="text-xs font-semibold mr-1">Saltar</span>
                    <X size={14} className="inline" />
                </button>
            )}

            {/* Main Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="flex-1 flex flex-col items-center justify-center text-center mt-2"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = offset.x
                        // Swipe right (prev slide)
                        if (swipe > 50 && currentSlide > 0) {
                            setCurrentSlide(prev => prev - 1)
                        }
                        // Swipe left (next slide)
                        else if (swipe < -50 && currentSlide < SLIDES.length - 1) {
                            setCurrentSlide(prev => prev + 1)
                        }
                    }}
                >
                    <div className="mb-4">
                        {slide.icon}
                    </div>
                    <h2 className="text-xl font-black mb-2 tracking-tight">{slide.title}</h2>
                    <p className="text-sm text-[var(--text-muted)] max-w-[280px] leading-relaxed mx-auto">
                        {slide.description}
                    </p>
                </motion.div>
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between mt-6">

                {/* Progress Dots */}
                <div className="flex gap-1.5">
                    {SLIDES.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-[var(--radius)] transition-all duration-300 ${currentSlide === idx ? 'w-4 bg-[var(--foreground)]' : 'w-1.5 bg-[var(--card-border)]'}`}
                        />
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleNext}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95
                    ${currentSlide === SLIDES.length - 1
                            ? 'bg-[var(--accent-green)] text-white shadow-[var(--accent-green)]/20 hover:bg-[#009040]'
                            : 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-90'}`}
                >
                    {currentSlide === SLIDES.length - 1 ? (
                        <>
                            ¡Entrá Ya! <Sparkles size={14} />
                        </>
                    ) : (
                        <>
                            Siguiente <ChevronRight size={14} />
                        </>
                    )}
                </button>
            </div>

        </div>
    )
}
