// src/components/ChallengesFAB.tsx
// FAB flotante eliminado — solo queda el modo inline para usar dentro de perfil/secciones
import React, { useState, useEffect } from 'react'
import { Trophy, X, ChevronRight, Zap, Target, Star, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback } from '@/lib/helpers'

interface ChallengesFABProps {
    inline?: boolean
}

export const ChallengesFAB = ({ inline = false }: ChallengesFABProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily')

    const toggleOpen = () => {
        hapticFeedback(isOpen ? 2 : 10)
        setIsOpen(!isOpen)
    }

    useEffect(() => {
        const handleOpen = () => setIsOpen(true)
        document.addEventListener('open-challenges', handleOpen)
        return () => document.removeEventListener('open-challenges', handleOpen)
    }, [])

    // Modo inline — se usa dentro de páginas como perfil
    if (inline) {
        return (
            <>
                <button
                    onClick={toggleOpen}
                    className="w-full text-left py-3 px-1 border-b border-[var(--card-border)] last:border-0 flex items-center justify-between group transition-colors hover:bg-[var(--hover-bg)]"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-yellow)]/10 flex items-center justify-center">
                            <Trophy size={15} className="text-[var(--accent-yellow)]" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Desafíos</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Diarios y semanales</p>
                        </div>
                    </div>
                    <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <ChallengesPanel
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            onClose={() => setIsOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </>
        )
    }

    // Modo flotante eliminado — no renderiza nada
    // Si algún componente lo usa sin prop inline, simplemente no aparece
    return null
}

function ChallengesPanel({
    activeTab,
    setActiveTab,
    onClose
}: {
    activeTab: 'daily' | 'weekly'
    setActiveTab: (t: 'daily' | 'weekly') => void
    onClose: () => void
}) {
    const dailyChallenges = [
        { icon: <Zap size={14} />, title: 'Loguear 1 partido hoy', xp: 10, progress: 0, total: 1 },
        { icon: <Star size={14} />, title: 'Votar 3 jugadores', xp: 15, progress: 0, total: 3 },
        { icon: <Target size={14} />, title: 'Hacer 1 pronóstico', xp: 20, progress: 0, total: 1 },
    ]
    const weeklyChallenges = [
        { icon: <Trophy size={14} />, title: 'Loguear 5 partidos esta semana', xp: 50, progress: 0, total: 5 },
        { icon: <Gift size={14} />, title: 'Comentar en 3 partidos', xp: 30, progress: 0, total: 3 },
        { icon: <Star size={14} />, title: 'Alcanzar racha de 7 días', xp: 100, progress: 0, total: 7 },
    ]
    const challenges = activeTab === 'daily' ? dailyChallenges : weeklyChallenges

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                exit={{ y: 50 }}
                className="bg-[var(--card-bg)] rounded-3xl w-full max-w-sm border border-[var(--card-border)] shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)]">
                    <h3 className="font-black text-lg italic">🏆 Desafíos</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-[var(--hover-bg)] flex items-center justify-center">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex gap-1 p-3 border-b border-[var(--card-border)]">
                    {(['daily', 'weekly'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)]'
                            }`}
                        >
                            {tab === 'daily' ? 'Diarios' : 'Semanales'}
                        </button>
                    ))}
                </div>

                <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                    {challenges.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--background)] border border-[var(--card-border)]">
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-yellow)]/10 flex items-center justify-center text-[var(--accent-yellow)] shrink-0">
                                {c.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{c.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1.5 bg-[var(--card-border)] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--accent-yellow)] rounded-full"
                                            style={{ width: `${(c.progress / c.total) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-[var(--text-muted)] shrink-0">{c.progress}/{c.total}</span>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-[var(--accent-yellow)] shrink-0">+{c.xp}XP</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    )
}
