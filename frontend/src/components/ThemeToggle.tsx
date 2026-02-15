// src/components/ThemeToggle.tsx
'use client'

import { useTheme } from '@/contexts/ThemeContext'

interface ThemeToggleProps {
    compact?: boolean
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme()

    if (compact) {
        return (
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)]
                           hover:bg-[var(--hover-bg)] transition-all duration-200"
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
                <span className="text-lg">
                    {theme === 'dark' ? '☀️' : '🌙'}
                </span>
            </button>
        )
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-lg 
                       bg-[var(--card-bg)] border border-[var(--card-border)]
                       hover:bg-[var(--hover-bg)] transition-all duration-200
                       text-[var(--foreground)] text-sm font-medium"
        >
            <span className="text-lg">
                {theme === 'dark' ? '☀️' : '🌙'}
            </span>
            <span>
                {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            </span>
        </button>
    )
}
