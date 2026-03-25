'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function HeroHeader() {
    const { user } = useAuth()

    return (
        <section className="relative w-full h-[320px] md:h-[400px] rounded-b-[2rem] md:rounded-3xl overflow-hidden mb-8 shadow-2xl">
            {/* Background Image with Gradient Overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('/images/hero_home.png')` }}
            />
            {/* Dark gradient to make text pop and give that green/yellow mood */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[#16a34a]/30 to-black/60" />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-end text-center p-6 pb-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <span className="inline-block px-3 py-1 mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--background)] bg-[#fde047] rounded-full shadow-[0_0_15px_rgba(253,224,71,0.4)]">
                        Nueva Versión Beta
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-xl mb-2">
                        FutLog
                    </h1>
                    <p className="text-sm md:text-base font-bold text-gray-200 uppercase tracking-widest max-w-sm md:max-w-md mx-auto mb-6 drop-shadow-md">
                        Tu Letterboxd del Fútbol Argentino y Latino
                    </p>

                    {!user ? (
                        <Link href="/login">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group flex items-center gap-2 bg-[#16a34a] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:bg-[#15803d] transition-colors mx-auto"
                            >
                                <Users size={18} />
                                Entrar a la Tribuna
                            </motion.button>
                        </Link>
                    ) : (
                        <Link href="/comunidad">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group flex items-center gap-2 bg-[var(--card-bg)]/80 backdrop-blur-md border border-[var(--card-border)] text-[var(--foreground)] px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-xl hover:border-[var(--accent)] transition-all mx-auto"
                            >
                                <Users size={18} className="text-[var(--accent)]" />
                                Ver qué dice la gente
                            </motion.button>
                        </Link>
                    )}
                </motion.div>
            </div>
        </section>
    )
}
