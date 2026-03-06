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
        const savedTheme = localStorage.getItem('FutLog-theme') as Theme | null
        if (savedTheme === 'light' || savedTheme === 'dark') {
            setTheme(savedTheme)
        } else {
            // Check system preference
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            setTheme(prefersDark ? 'dark' : 'dark') // Forzamos dark por default como base
        }

        // Force server-side matching by immediately setting attribute
        document.documentElement.setAttribute('data-theme', 'dark')
        setMounted(true)
    }, [])

    // Aplicar tema al documento
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem('FutLog-theme', theme)
        }
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark')
    }

    // Evitar flash dando un render inicial seguro
    if (!mounted) {
        // En SSR o primer render, asume dark
        return (
            <ThemeContext.Provider value={{ theme: 'dark', toggleTheme }}>
                {children}
            </ThemeContext.Provider>
        )
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
