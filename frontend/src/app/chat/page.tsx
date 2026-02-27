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
            <div className="px-6 py-6 md:py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                        💬 Chat Global
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
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
