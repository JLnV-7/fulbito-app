// src/components/DesktopNav.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { Trophy, Target, BarChart3, Calendar, User } from 'lucide-react'

interface NavItem {
    label: string
    path: string
    icon?: React.ReactNode
}

export function DesktopNav() {
    const router = useRouter()
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    const mainItems: NavItem[] = [
        { label: 'Partidos', path: '/' },
        { label: 'Prode', path: '/prode', icon: <Target size={14} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={14} /> },
        { label: 'Tabla', path: '/posiciones', icon: <BarChart3 size={14} /> },
        { label: 'Fixtures', path: '/fixtures', icon: <Calendar size={14} /> },
    ]

    const secondaryItems: NavItem[] = [
        { label: 'Goleadores', path: '/goleadores' },
        { label: 'Grupos', path: '/grupos' },
        { label: 'Historial', path: '/historial' },
    ]

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 
                    bg-[var(--background)]/80 backdrop-blur-xl
                    border-b border-[var(--card-border)] px-6 py-2.5 items-center z-50">

            {/* Left: Logo */}
            <div className="w-36 flex-shrink-0">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 group">
                    <span className="text-lg font-black text-[var(--foreground)] tracking-tight group-hover:text-[#10b981] transition-colors">
                        Fulbito
                    </span>
                </button>
            </div>

            {/* Center: Primary Nav */}
            <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-0.5">
                    {mainItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5
                                ${isActive(item.path)
                                    ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm border border-[var(--card-border)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]/50'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}

                    {/* Separator */}
                    <div className="h-4 w-px bg-[var(--card-border)] mx-1.5" />

                    {secondaryItems.map(item => (
                        <button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            className={`px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all
                                ${isActive(item.path)
                                    ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm border border-[var(--card-border)]'
                                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]/50'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="w-36 flex justify-end items-center gap-2">
                <button
                    onClick={() => router.push('/perfil')}
                    className={`p-2 rounded-lg transition-all ${isActive('/perfil')
                        ? 'bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
                        }`}
                    title="Mi Perfil"
                >
                    <User size={18} />
                </button>
                <ThemeToggle compact />
            </div>
        </nav>
    )
}
