'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { checkAndAwardBadges } from '@/app/actions/badges'

interface XpPopup {
    id: number
    amount: number
}

interface LevelUpPopup {
    id: number
    level: number
}

export function XPFeedback() {
    const { user } = useAuth()
    const [xpPopups, setXpPopups] = useState<XpPopup[]>([])
    const [levelUpPopups, setLevelUpPopups] = useState<LevelUpPopup[]>([])
    const [awardedBadges, setAwardedBadges] = useState<any[]>([])

    // Refs to keep track of current values without triggering re-renders to listeners
    const xpRef = useRef<number | null>(null)
    const levelRef = useRef<number | null>(null)
    const popupIdCounter = useRef(0)

    // Load initial values
    useEffect(() => {
        if (!user) {
            xpRef.current = null
            levelRef.current = null
            return
        }

        const loadInitialData = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('xp, level')
                .eq('id', user.id)
                .single()

            if (!error && data) {
                xpRef.current = data.xp
                levelRef.current = data.level
            }
        }
        loadInitialData()
    }, [user])

    // Subscribe to realtime changes
    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel('public:profiles:xp')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    const newData = payload.new as { xp?: number, level?: number }

                    // Check XP increase
                    if (newData.xp !== undefined && xpRef.current !== null) {
                        const diff = newData.xp - xpRef.current
                        if (diff > 0) {
                            // Show XP popup
                            const popupId = ++popupIdCounter.current
                            setXpPopups(prev => [...prev, { id: popupId, amount: diff }])

                            // Remove popup after animation
                            setTimeout(() => {
                                setXpPopups(prev => prev.filter(p => p.id !== popupId))
                            }, 3000)

                            checkAndAwardBadges(user.id).then(badges => {
                                if (badges && badges.length > 0) {
                                    setAwardedBadges(prev => [...prev, ...badges])
                                    setTimeout(() => {
                                        setAwardedBadges(prev => prev.filter(b => !badges.find(newB => newB.id === b.id)))
                                    }, 6000)

                                    confetti({
                                        particleCount: 100,
                                        spread: 60,
                                        origin: { y: 0.7 },
                                        colors: ['#16a34a', '#2563eb', '#60a5fa']
                                    })
                                }
                            }).catch(e => console.error(e))
                        }
                    }
                    if (newData.xp !== undefined) xpRef.current = newData.xp

                    // Check Level Up
                    if (newData.level !== undefined && levelRef.current !== null) {
                        if (newData.level > levelRef.current) {
                            // Show Level Up Message
                            const popupId = ++popupIdCounter.current
                            setLevelUpPopups(prev => [...prev, { id: popupId, level: newData.level! }])
                            setTimeout(() => {
                                setLevelUpPopups(prev => prev.filter(p => p.id !== popupId))
                            }, 5000)
                        }
                    }
                    if (newData.level !== undefined) levelRef.current = newData.level
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    // If no popups open, return null
    if (xpPopups.length === 0 && levelUpPopups.length === 0 && awardedBadges.length === 0) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] flex flex-col items-center justify-center">
            {/* Level Up Popups */}
            <AnimatePresence>
                {levelUpPopups.map((popup) => (
                    <motion.div
                        key={`level-${popup.id}`}
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -50 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-50 bg-black/40 backdrop-blur-sm"
                    >
                        <div className="bg-[var(--card-bg)] border-2 border-[var(--accent)] p-8 rounded-3xl shadow-[0_0_50px_rgba(var(--accent-rgb),0.5)] text-center transform shadow-xl pointer-events-auto">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-6xl mb-4"
                            >
                                🏆
                            </motion.div>
                            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffc107] to-[var(--accent)] mb-2">
                                SUBISTE DE NIVEL
                            </h2>
                            <p className="text-[var(--text-muted)] text-lg mb-6">
                                Alcanzaste el <strong className="text-white">Nivel {popup.level}</strong>
                            </p>
                            <button
                                onClick={() => setLevelUpPopups(prev => prev.filter(p => p.id !== popup.id))}
                                className="bg-[var(--accent)] text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg"
                            >
                                Continuar
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Badge Popups */}
            <AnimatePresence>
                {awardedBadges.map((badge, idx) => (
                    <motion.div
                        key={`badge-${badge.id}-${idx}`}
                        initial={{ opacity: 0, scale: 0.5, y: -50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: 'spring', bounce: 0.6 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[var(--card-bg)] border-2 border-purple-500/50 p-4 rounded-2xl shadow-[0_10px_40px_rgba(139,92,246,0.3)] pointer-events-auto"
                        style={{ top: `${96 + (idx * 100)}px` }}
                    >
                        <div className="text-4xl filter drop-shadow-md">
                            {badge.icon}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] items-center text-purple-400 font-bold capitalize tracking-wider mb-0.5">
                                Insignia Desbloqueada
                            </span>
                            <span className="font-black text-lg text-[var(--foreground)] leading-none">
                                {badge.name}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] mt-1">
                                {badge.description}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* XP Popups - Bottom Left */}
            <div className="fixed bottom-24 left-6 flex flex-col-reverse gap-2 pointer-events-none">
                <AnimatePresence>
                    {xpPopups.map((popup) => (
                        <motion.div
                            key={`xp-${popup.id}`}
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.8 }}
                            className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-full font-black text-sm shadow-[0_0_15px_rgba(74,222,128,0.2)] backdrop-blur-md flex items-center gap-2"
                        >
                            <span>+{popup.amount} XP</span>
                            <span className="text-lg">✨</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
