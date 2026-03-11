// src/components/TeamLogo.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getShieldForTeam } from '@/lib/shields'

interface TeamLogoProps {
    src?: string
    teamName: string
    size?: number
    className?: string
}

// Generar color basado en nombre del equipo
const stringToColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash % 360)
    return `hsl(${hue}, 70%, 45%)`
}

// Obtener iniciales del equipo
const getInitials = (name: string) => {
    const words = name.split(' ')
    if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
}

export function TeamLogo({ src, teamName, size = 24, className = '' }: TeamLogoProps) {
    const [hasError, setHasError] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Only recalculate on mount or prop change
    const [finalSrc, setFinalSrc] = useState<string | undefined>(undefined)

    useEffect(() => {
        // Evaluate the safe shield URL using our map
        const safeShield = getShieldForTeam(teamName, src)
        setFinalSrc(safeShield)
        setHasError(false)
        setIsLoading(true)
    }, [src, teamName])

    const initials = getInitials(teamName)
    const bgColor = stringToColor(teamName)

    // Si no hay src o hubo error, mostrar fallback
    if (!finalSrc || hasError) {
        return (
            <div
                className={`flex items-center justify-center rounded-full font-bold text-white shadow-inner ${className}`}
                style={{
                    width: size,
                    height: size,
                    backgroundColor: bgColor,
                    fontSize: size * 0.4
                }}
            >
                {initials}
            </div>
        )
    }

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            {isLoading && (
                <div
                    className="absolute inset-0 rounded-full bg-[var(--card-border)] animate-pulse"
                />
            )}
            <Image
                src={finalSrc}
                alt={teamName}
                fill
                className="object-contain"
                sizes={`${size}px`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setHasError(true)
                    setIsLoading(false)
                }}
                unoptimized // External shield API URLs can be slow to optimize
            />
        </div>
    )
}
