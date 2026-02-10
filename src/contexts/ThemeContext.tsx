// src/contexts/ThemeContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('dark')
    const [mounted, setMounted] = useState(false)

    // Cargar tema desde localStorage al montar
    useEffect(() => {
        const savedTheme = localStorage.getItem('fulbito-theme') as Theme | null
        if (savedTheme) {
            setTheme(savedTheme)
        } else {
            // Detectar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            setTheme(prefersDark ? 'dark' : 'light')
        }
        setMounted(true)
    }, [])

    // Aplicar tema al documento
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem('fulbito-theme', theme)
        }
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    // Evitar flash de tema incorrecto
    if (!mounted) {
        return null
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}
