'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback } from '@/lib/helpers'

interface PullToRefreshProps {
    onRefresh: () => Promise<void>
    children: ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [startY, setStartY] = useState(0)
    const [currentY, setCurrentY] = useState(0)
    const [isPulling, setIsPulling] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const threshold = 80

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only detect pull when at the very top of the page
        if (window.scrollY <= 5) {
            setStartY(e.touches[0].clientY)
            setIsPulling(true)
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPulling || isRefreshing) return
        const y = e.touches[0].clientY
        const pullDistance = Math.max(0, y - startY)

        // Add resistance to the pull
        setCurrentY(pullDistance * 0.4)
    }

    const handleTouchEnd = async () => {
        if (!isPulling) return
        setIsPulling(false)

        if (currentY >= threshold) {
            setIsRefreshing(true)
            hapticFeedback([15, 30]) // trigger haptic on release
            await onRefresh()
            setIsRefreshing(false)
            setCurrentY(0)
        } else {
            setCurrentY(0)
        }
    }

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="min-h-screen flex flex-col items-center w-full"
        >
            <AnimatePresence>
                {(isPulling || isRefreshing) && currentY > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: isRefreshing ? 60 : Math.min(currentY, 100), opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="w-full flex justify-center items-end pb-2 overflow-hidden fixed top-0 z-50 pointer-events-none"
                    >
                        <div className="bg-[var(--card-bg)] shadow-md rounded-full w-10 h-10 flex items-center justify-center border border-[var(--card-border)] mb-2">
                            {isRefreshing ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                    ⚽
                                </motion.div>
                            ) : (
                                <span className="text-xl" style={{ transform: `rotate(${currentY * 4}deg)` }}>
                                    ⚽
                                </span>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="flex-1 w-full" style={{ transform: `translateY(${!isRefreshing && isPulling ? currentY : 0}px)`, transition: isPulling ? 'none' : 'transform 0.3s ease-out' }}>
                {children}
            </div>
        </div>
    )
}
