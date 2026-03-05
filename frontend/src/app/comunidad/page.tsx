// src/app/comunidad/page.tsx
'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, MessageCircle, Clock, ChevronRight } from 'lucide-react'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'

export default function ComunidadPage() {
    const router = useRouter()

    const options = [
        {
            title: 'Grupos',
            description: 'Competí en prodes cerrados con tus amigos y colegas.',
            icon: Users,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            path: '/grupos'
        },
        {
            title: 'Chat Global',
            description: 'Debatí en vivo sobre los partidos de la fecha.',
            icon: MessageCircle,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            path: '/chat'
        },
        {
            title: 'Historial',
            description: 'Repasá todos los resultados y puntos anteriores.',
            icon: Clock,
            color: 'text-[#f59e0b]',
            bg: 'bg-[#f59e0b]/10',
            path: '/historial'
        }
    ]

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header */}
                <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-6 md:hidden">
                    <h1 className="text-2xl font-black mb-1">Comunidad</h1>
                    <p className="text-sm text-[var(--text-muted)]">Interactuá con otros hinchas y amigos.</p>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
                    <div className="hidden md:block mb-8 text-center">
                        <h1 className="text-3xl font-black mb-2">Comunidad</h1>
                        <p className="text-[var(--text-muted)]">Interactuá con otros hinchas y amigos.</p>
                    </div>

                    <div className="space-y-4">
                        {options.map((opt, i) => {
                            const Icon = opt.icon
                            return (
                                <motion.button
                                    key={opt.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    onClick={() => router.push(opt.path)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--card-border)]
                                             hover:border-[var(--accent)]/40 card-hover text-left group"
                                >
                                    <div className={`w-12 h-12 rounded-full ${opt.bg} ${opt.color} flex items-center justify-center shrink-0`}>
                                        <Icon size={24} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold mb-0.5 group-hover:text-[var(--accent)] transition-colors">{opt.title}</h3>
                                        <p className="text-xs text-[var(--text-muted)] line-clamp-2">{opt.description}</p>
                                    </div>
                                    <ChevronRight className="text-[var(--text-muted)] shrink-0" size={20} />
                                </motion.button>
                            )
                        })}
                    </div>
                </div>
            </main>
            <NavBar />
        </>
    )
}
