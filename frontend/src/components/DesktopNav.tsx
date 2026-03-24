// src/components/DesktopNav.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { Trophy, Target, Users, Newspaper, Search, User } from 'lucide-react'
import { Suspense } from 'react'

interface NavItem {
    label: string
    path: string
    tab?: string
    icon?: React.ReactNode
}

function DesktopNavInner() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const currentTab = searchParams.get('tab')

    const isActive = (item: NavItem) => {
        if (item.tab) {
            // Items con tab: activo solo si pathname es / Y el tab coincide
            return pathname === '/' && currentTab === item.tab
        }
        if (item.path === '/') {
            // Partidos: activo solo si estamos en / SIN tab de noticias
            return pathname === '/' && currentTab !== 'noticias'
        }
        return pathname === item.path
    }

    const mainItems: NavItem[] = [
        { label: 'Partidos', path: '/', icon: <Trophy size={14} /> },
        { label: 'Noticias', path: '/?tab=noticias', tab: 'noticias', icon: <Newspaper size={14} /> },
        { label: 'Prode', path: '/prode', icon: <Target size={14} /> },
        { label: 'Comunidad', path: '/comunidad', icon: <Users size={14} /> },
    ]

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 
                    bg-[var(--background)]/80 backdrop-blur-xl
                    border-b border-[var(--card-border)] px-6 py-2.5 items-center z-50">

            {/* Left: Logo */}
            <div className="w-36 flex-shrink-0">
                <button
                    onClick={() => router.push('/')}
                    className="text-lg font-black italic tracking-tighter hover:opacity-80 transition-opacity"
                >
                    FutLog
                </button>
            </div>

            {/* Center: Nav items */}
            <div className="flex-1 flex items-center justify-center gap-1">
                {mainItems.map((item) => {
                    const active = isActive(item)
                    return (
                        <button
                            key={item.label}
                            onClick={() => router.push(item.path)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                active
                                    ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-bold'
                                    : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)]'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    )
                })}
            </div>

            {/* Right: Actions */}
            <div className="w-36 flex-shrink-0 flex items-center justify-end gap-1 md:gap-2">
                <button
                    onClick={() => router.push('/buscar')}
                    className="p-2 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all"
                    title="Buscar"
                >
                    <Search size={18} />
                </button>
                <button
                    onClick={() => router.push('/ranking')}
                    className="p-2 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all"
                    title="Ranking general"
                >
                    <Trophy size={18} />
                </button>
                <button
                    onClick={() => router.push('/perfil')}
                    className="p-2 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-all"
                    title="Mi Perfil"
                >
                    <User size={18} />
                </button>
                <ThemeToggle />
            </div>
        </nav>
    )
}

// Suspense necesario porque useSearchParams requiere boundary
export function DesktopNav() {
    return (
        <Suspense fallback={null}>
            <DesktopNavInner />
        </Suspense>
    )
}
