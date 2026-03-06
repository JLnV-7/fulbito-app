'use client'

import { BuildXI } from '@/components/BuildXI'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LineupPage() {
    const router = useRouter()

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header Mobile */}
                <div className="bg-[var(--card-bg)] border-b border-[var(--card-border)] px-4 py-6 md:hidden flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-[var(--hover-bg)] transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black">Armá tu XI</h1>
                        <p className="text-xs text-[var(--text-muted)]">Diseñá tu equipo ideal de la historia.</p>
                    </div>
                </div>

                <div className="max-w-xl mx-auto px-4 py-6">
                    <div className="hidden md:block mb-8">
                        <h1 className="text-3xl font-black mb-2">Armá tu XI Ideal</h1>
                        <p className="text-[var(--text-muted)]">Seleccioná táctica y jugadores para armar tu Dream Team.</p>
                    </div>

                    <BuildXI />
                </div>
            </main>
            <NavBar />
        </>
    )
}
