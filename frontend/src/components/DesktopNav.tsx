// src/components/DesktopNav.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export function DesktopNav() {
    const router = useRouter()
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <nav className="hidden md:flex fixed top-0 left-0 right-0 
                    glass
                    border-b px-8 py-4 items-center z-50">

            {/* Left: Logo */}
            <div className="w-48 flex-shrink-0">
                <h1 className="text-xl font-bold text-[var(--foreground)]">Fulbito</h1>
            </div>

            {/* Center: Menu */}
            <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1 bg-[var(--card-bg)]/50 p-1.5 rounded-xl border border-[var(--card-border)] backdrop-blur-sm">
                    <button
                        onClick={() => router.push('/')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/')
                            ? 'bg-[#ff6b6b] text-white shadow-md shadow-[#ff6b6b]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        Partidos
                    </button>

                    <button
                        onClick={() => router.push('/prode')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/prode')
                            ? 'bg-[#10b981] text-white shadow-md shadow-[#10b981]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        🎯 Prode
                    </button>

                    <button
                        onClick={() => router.push('/ranking')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/ranking')
                            ? 'bg-[#ffd700] text-black shadow-md shadow-[#ffd700]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        🏆 Ranking
                    </button>

                    <button
                        onClick={() => router.push('/posiciones')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/posiciones')
                            ? 'bg-[#3b82f6] text-white shadow-md shadow-[#3b82f6]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        📊 Tabla
                    </button>

                    <button
                        onClick={() => router.push('/fixtures')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/fixtures')
                            ? 'bg-[#10b981] text-white shadow-md shadow-[#10b981]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        📆 Fixtures
                    </button>

                    <button
                        onClick={() => router.push('/goleadores')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/goleadores')
                            ? 'bg-[#ffd700] text-black shadow-md shadow-[#ffd700]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        ⚽ Goleadores
                    </button>

                    <button
                        onClick={() => router.push('/grupos')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/grupos')
                            ? 'bg-[#10b981] text-white shadow-md'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        🤝 Grupos
                    </button>

                    <button
                        onClick={() => router.push('/historial')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/historial')
                            ? 'bg-[#6366f1] text-white shadow-md'
                            : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                            }`}
                    >
                        📜 Historial
                    </button>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="w-48 flex justify-end items-center gap-4">
                <button
                    onClick={() => router.push('/perfil')}
                    className={`p-2 rounded-full transition-all ${isActive('/perfil')
                        ? 'bg-[#ff6b6b] text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg)]'
                        }`}
                    title="Mi Perfil"
                >
                    <span className="text-xl">👤</span>
                </button>
                <div className="h-6 w-px bg-[var(--card-border)]"></div>
                <ThemeToggle compact />
            </div>
        </nav>
    )
}
