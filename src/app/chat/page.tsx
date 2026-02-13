'use client'

import { useRouter } from 'next/navigation'
import { CommentSection } from '@/components/CommentSection'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'

export default function ChatPage() {
    const router = useRouter()

    return (
        <main className="min-h-screen bg-[var(--background)] pb-24 md:pt-20">
            <DesktopNav />

            {/* Header */}
            <div className="p-6 bg-[var(--card-bg)] border-b border-[var(--card-border)] flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                    ← Volver
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                        💬 Chat Global
                    </h1>
                    <p className="text-xs text-[var(--text-muted)]">
                        Comentá con toda la comunidad
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Usamos ID 0 para el chat global */}
                <CommentSection partidoId={0} />
            </div>

            <NavBar />
        </main>
    )
}
