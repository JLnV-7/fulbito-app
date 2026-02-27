// src/app/log/page.tsx
'use client'

import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { MatchLogForm } from '@/components/MatchLogForm'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LogPage() {
    const router = useRouter()

    return (
        <>
            <DesktopNav />
            <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24 md:pt-20">
                {/* Header */}
                <div className="px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold">Loguear partido</h1>
                        <p className="text-xs text-[var(--text-muted)]">Registrá tu experiencia y compartila</p>
                    </div>
                </div>

                <div className="px-4">
                    <MatchLogForm />
                </div>
            </main>
            <NavBar />
        </>
    )
}
