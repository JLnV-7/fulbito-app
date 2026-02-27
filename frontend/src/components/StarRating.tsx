// src/components/StarRating.tsx
'use client'

import { useState, useCallback } from 'react'
import { Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface StarRatingProps {
    value: number
    onChange?: (value: number) => void
    max?: number
    size?: 'sm' | 'md' | 'lg'
    readonly?: boolean
    showValue?: boolean
    label?: string
    color?: string
}

const SIZES = {
    sm: 16,
    md: 22,
    lg: 30,
}

export function StarRating({
    value,
    onChange,
    max = 5,
    size = 'md',
    readonly = false,
    showValue = false,
    label,
    color = '#f59e0b',
}: StarRatingProps) {
    const [hoverValue, setHoverValue] = useState<number | null>(null)
    const starSize = SIZES[size]
    const displayValue = hoverValue ?? value

    const handleClick = useCallback((starIndex: number, isLeft: boolean) => {
        if (readonly || !onChange) return
        const newValue = isLeft ? starIndex + 0.5 : starIndex + 1
        // Toggle: if clicking the same value, reset to 0
        onChange(newValue === value ? 0 : newValue)
    }, [readonly, onChange, value])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
        if (readonly) return
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const isLeft = x < rect.width / 2
        setHoverValue(isLeft ? starIndex + 0.5 : starIndex + 1)
    }, [readonly])

    return (
        <div className="flex items-center gap-2">
            {label && (
                <span className="text-xs font-medium text-[var(--text-muted)] min-w-[70px]">
                    {label}
                </span>
            )}
            <div
                className="flex items-center gap-0.5"
                onMouseLeave={() => setHoverValue(null)}
            >
                {Array.from({ length: max }, (_, i) => {
                    const fillPercentage = Math.max(0, Math.min(1, displayValue - i))

                    return (
                        <button
                            key={i}
                            type="button"
                            disabled={readonly}
                            className={`relative ${readonly ? 'cursor-default' : 'cursor-pointer'} 
                         transition-transform duration-150 ${!readonly ? 'hover:scale-110 active:scale-95' : ''}`}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const x = e.clientX - rect.left
                                const isLeft = x < rect.width / 2
                                handleClick(i, isLeft)
                            }}
                            onMouseMove={(e) => handleMouseMove(e, i)}
                        >
                            {/* Background (empty) star */}
                            <Star
                                size={starSize}
                                className="text-[var(--card-border)] transition-colors"
                                fill="var(--card-border)"
                                strokeWidth={0}
                            />
                            {/* Filled star overlay */}
                            <div
                                className="absolute inset-0 overflow-hidden transition-all duration-150"
                                style={{ width: `${fillPercentage * 100}%` }}
                            >
                                <Star
                                    size={starSize}
                                    style={{ color, fill: color }}
                                    strokeWidth={0}
                                />
                            </div>
                        </button>
                    )
                })}
            </div>
            <AnimatePresence>
                {showValue && displayValue > 0 && (
                    <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        className="text-sm font-bold tabular-nums"
                        style={{ color }}
                    >
                        {displayValue.toFixed(1)}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    )
}

// Compact display version for cards
export function StarRatingDisplay({
    value,
    size = 'sm',
    color = '#f59e0b',
}: {
    value: number
    size?: 'sm' | 'md'
    color?: string
}) {
    const starSize = SIZES[size]

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => {
                const fillPercentage = Math.max(0, Math.min(1, value - i))
                return (
                    <span key={i} className="relative inline-block">
                        <Star
                            size={starSize}
                            className="text-[var(--card-border)]"
                            fill="var(--card-border)"
                            strokeWidth={0}
                        />
                        <span
                            className="absolute inset-0 overflow-hidden"
                            style={{ width: `${fillPercentage * 100}%` }}
                        >
                            <Star
                                size={starSize}
                                style={{ color, fill: color }}
                                strokeWidth={0}
                            />
                        </span>
                    </span>
                )
            })}
        </div>
    )
}
