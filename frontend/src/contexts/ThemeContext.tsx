// src/contexts/ThemeContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextType {
    theme: Theme
    classicMode: boolean
    toggleTheme: () => void
    toggleClassicMode: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>('light')
    const [classicMode, setClassicMode] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Cargar tema desde localStorage al montar
    useEffect(() => {
        const savedTheme = localStorage.getItem('FutLog-theme') as Theme | null
        let initialTheme: Theme = 'light'

        if (savedTheme === 'light' || savedTheme === 'dark') {
            initialTheme = savedTheme
        } else {
            // Check system preference
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            initialTheme = prefersDark ? 'dark' : 'light' // Respect system, default light for classic feel
        }

        setTheme(initialTheme)
        document.documentElement.setAttribute('data-theme', initialTheme)

        // Load classic mode preference
        const savedClassic = localStorage.getItem('FutLog-classic-mode')
        if (savedClassic === 'true') {
            setClassicMode(true)
            document.documentElement.classList.add('classic-mode')
        }

        setMounted(true)

        // Setup listener for system theme changes if user hasn't forced a theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('FutLog-theme-forced')) {
                const newTheme = e.matches ? 'dark' : 'light'
                setTheme(newTheme)
                document.documentElement.setAttribute('data-theme', newTheme)
                localStorage.setItem('FutLog-theme', newTheme)
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    // Aplicar tema al documento
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem('FutLog-theme', theme)
        }
    }, [theme, mounted])

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'dark' ? 'light' : 'dark';
            localStorage.setItem('FutLog-theme-forced', 'true');
            return newTheme;
        })
    }

    const toggleClassicMode = () => {
        setClassicMode(prev => {
            const next = !prev
            localStorage.setItem('FutLog-classic-mode', String(next))
            if (next) {
                document.documentElement.classList.add('classic-mode')
            } else {
                document.documentElement.classList.remove('classic-mode')
            }
            return next
        })
    }

    // Evitar flash dando un render inicial seguro
    if (!mounted) {
        // En SSR o primer render, asume dark
        return (
            <ThemeContext.Provider value={{ theme: 'light', classicMode: false, toggleTheme, toggleClassicMode }}>
                {children}
            </ThemeContext.Provider>
        )
    }

    return (
        <ThemeContext.Provider value={{ theme, classicMode, toggleTheme, toggleClassicMode }}>
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
