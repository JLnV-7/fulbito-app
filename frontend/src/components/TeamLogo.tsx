// src/components/TeamLogo.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'

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

    const initials = getInitials(teamName)
    const bgColor = stringToColor(teamName)

    // Si no hay src o hubo error, mostrar fallback
    if (!src || hasError) {
        return (
            <div
                className={`flex items-center justify-center rounded-full font-bold text-white ${className}`}
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
                src={src}
                alt={teamName}
                fill
                className="object-contain"
                sizes={`${size}px`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setHasError(true)
                    setIsLoading(false)
                }}
            />
        </div>
    )
}
