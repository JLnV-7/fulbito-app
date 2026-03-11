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

    return (
        <>
            {inline ? (
                <button
                    onClick={toggleOpen}
                    className="w-full text-left py-3 px-1 border-b border-[var(--card-border)] last:border-0 flex items-center justify-between group transition-colors hover:bg-[var(--hover-bg)]"
                >
                    <div className="flex items-center gap-3">
                        <Trophy size={16} className="text-[var(--text-muted)] group-hover:text-[var(--foreground)] transition-colors" />
                        <span className="text-xs font-bold capitalize tracking-tight text-[var(--foreground)]">Desafíos & XP</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium capitalize">Misiones Semanales</span>
                </button>
            ) : (
                <button
                    onClick={toggleOpen}
                    className={`fixed bottom-[88px] right-3 z-40 flex items-center gap-1.5 px-3 py-2 shadow-md border transition-all active:scale-95 text-[10px] font-bold capitalize tracking-tight
                        ${isOpen
                            ? 'bg-red-500 text-white border-red-500/20'
                            : 'bg-[var(--card-bg)]/90 backdrop-blur-md border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]'
                        }`}
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    {isOpen ? <X size={14} /> : <><Trophy size={14} /> Desafíos</>}
                </button>
            )}

            {/* Bottom Sheet for Mobile / Content Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleOpen}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 block"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-[var(--card-bg)] rounded-t-3xl z-[60] max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-t border-white/10"
                        >
                            {/* Handle bar */}
                            <div className="w-12 h-1.5 bg-[var(--card-border)] rounded-full mx-auto my-4 opacity-50" />

                            <div className="px-6 pb-4">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                                            <Trophy className="text-yellow-400 w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold tracking-tight">Desafíos</h2>
                                            <p className="text-[10px] text-[var(--text-muted)] font-medium capitalize tracking-tight">Gana XP y sube de nivel</p>
                                        </div>
                                    </div>
                                    <button onClick={toggleOpen} className="w-8 h-8 rounded-full bg-[var(--card-border)]/30 flex items-center justify-center">
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex p-1 bg-[var(--card-border)]/20 rounded-2xl mb-6">
                                    <button
                                        onClick={() => setActiveTab('daily')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold capitalize transition-all rounded-xl
                                            ${activeTab === 'daily' ? 'bg-[var(--card-bg)] text-[var(--accent-green)] shadow-sm' : 'text-[var(--text-muted)]'}`}
                                    >
                                        <Zap size={14} className={activeTab === 'daily' ? 'text-yellow-400' : ''} />
                                        Diarios
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('weekly')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-black capitalize transition-all rounded-xl
                                            ${activeTab === 'weekly' ? 'bg-[var(--card-bg)] text-[#8b5cf6] shadow-sm' : 'text-[var(--text-muted)]'}`}
                                    >
                                        <Target size={14} className={activeTab === 'weekly' ? 'text-[#8b5cf6]' : ''} />
                                        Semanales
                                    </button>
                                </div>

                                {/* List */}
                                <div className="space-y-4 pb-10 overflow-y-auto max-h-[50vh] pr-2 no-scrollbar">
                                    {activeTab === 'daily' ? (
                                        <div className="space-y-3">
                                            <ChallengeItem
                                                icon={<Star className="text-yellow-400" />}
                                                title="Califica 3 partidos"
                                                subtitle="Evalúa tu experiencia en la cancha"
                                                progress={2}
                                                total={3}
                                                xp={50}
                                                color="#10b981"
                                            />
                                            <ChallengeItem
                                                icon={<Zap className="text-blue-400" />}
                                                title="Vota en 1 encuesta"
                                                subtitle="Danos tu opinión del partido"
                                                progress={0}
                                                total={1}
                                                xp={30}
                                                color="#3b82f6"
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <ChallengeItem
                                                icon={<Target className="text-red-400" />}
                                                title="Sube al Top 10"
                                                subtitle="En el ranking semanal"
                                                progress={15}
                                                total={10}
                                                xp={250}
                                                color="#ef4444"
                                                isGoal
                                            />
                                            <ChallengeItem
                                                icon={<Gift className="text-purple-400" />}
                                                title="Crea un grupo"
                                                subtitle="Invita a tus amigos"
                                                progress={0}
                                                total={1}
                                                xp={100}
                                                color="#a855f7"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

const ChallengeItem = ({ icon, title, subtitle, progress, total, xp, color, isGoal = false }: any) => {
    const percentage = Math.min((progress / total) * 100, 100)
    const isCompleted = progress >= total

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl grayscale-[0.5] bg-opacity-10" style={{ backgroundColor: color + '20' }}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm leading-tight">{title}</h4>
                    <span className="text-[10px] font-bold text-[var(--accent-green)]">+{xp} XP</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-medium mb-3">{subtitle}</p>

                <div className="w-full h-1.5 bg-[var(--card-border)]/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                    />
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[8px] font-bold text-[var(--text-muted)]">{progress}/{total} {isGoal ? 'POS' : 'LISTO'}</span>
                    {isCompleted && <span className="text-[8px] font-bold text-[var(--accent-green)] capitalize">Completado</span>}
                </div>
            </div>
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[var(--card-border)]/20 min-w-[50px] border border-white/5">
                <ChevronRight size={18} className="text-[var(--text-muted)]" />
            </div>
        </div>
    )
}
