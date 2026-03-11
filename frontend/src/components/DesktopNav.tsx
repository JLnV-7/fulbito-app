// src/components/DesktopNav.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'
import { Trophy, Target, User, PenLine, Users, Clock } from 'lucide-react'

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
        { label: 'Partidos', path: '/', icon: <Trophy size={14} /> },
        { label: 'Noticias', path: '/?tab=noticias', icon: <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path></svg> },
        { label: 'Prode', path: '/prode', icon: <Target size={14} /> },
        { label: 'Ranking', path: '/ranking', icon: <Trophy size={14} /> },
        { label: 'Comunidad', path: '/comunidad', icon: <Users size={14} /> },
    ]

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 
                    bg-[var(--background)]/80 backdrop-blur-xl
                    border-b border-[var(--card-border)] px-6 py-2.5 items-center z-50">

            {/* Left: Logo */}
            <div className="w-36 flex-shrink-0">
                <button onClick={() => router.push('/')} className="flex items-center gap-2 group">
                    <span className="text-xl font-black text-[var(--foreground)] tracking-tight hover:opacity-80 transition-opacity">
                        FutLog
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
                </div>
            </div>

            {/* Right: Actions */}
            <div className="w-64 flex justify-end items-center gap-1">
                {/* Restore Feedback & Challenges for Desktop */}
                <button title="Desafíos" onClick={() => document.dispatchEvent(new CustomEvent('open-challenges'))} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-all">
                    <Trophy size={18} />
                </button>
                <button title="Feedback" onClick={() => document.dispatchEvent(new CustomEvent('open-feedback'))} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/10 transition-all mr-2">
                    <PenLine size={18} />
                </button>

                <div className="w-px h-6 bg-[var(--card-border)] mx-1" />

                <button
                    onClick={() => router.push('/buscar')}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)] transition-all"
                    title="Buscar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </button>

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
