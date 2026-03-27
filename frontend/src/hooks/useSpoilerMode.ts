// src/hooks/useSpoilerMode.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'futlog-spoiler-mode'

/**
 * Hook para manejar el modo spoiler-safe.
 * - `spoilerMode`: true = ocultar resultados de partidos finalizados
 * - `revealedIds`: set de IDs de partidos revelados individualmente
 * - `toggleSpoilerMode()`: activa/desactiva globalmente
 * - `revealMatch(id)`: revela un partido puntual
 * - `resetRevealed()`: vuelve a ocultar todos los revelados
 */
export function useSpoilerMode() {
    const [spoilerMode, setSpoilerMode] = useState(false)
    const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'true') setSpoilerMode(true)
    }, [])

    const toggleSpoilerMode = useCallback(() => {
        setSpoilerMode(prev => {
            const next = !prev
            localStorage.setItem(STORAGE_KEY, String(next))
            // Al activar el modo, limpiamos los revelados
            if (next) setRevealedIds(new Set())
            return next
        })
    }, [])

    const revealMatch = useCallback((id: string) => {
        setRevealedIds(prev => {
            const next = new Set(prev)
            next.add(id)
            return next
        })
    }, [])

    const resetRevealed = useCallback(() => {
        setRevealedIds(new Set())
    }, [])

    const isRevealed = useCallback((id: string) => {
        return revealedIds.has(id)
    }, [revealedIds])

    return {
        spoilerMode,
        toggleSpoilerMode,
        revealMatch,
        resetRevealed,
        isRevealed,
    }
}
