// src/app/offline/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function OfflinePage() {
    const [isOnline, setIsOnline] = useState(false)

    useEffect(() => {
        const handleOnline = () => setIsOnline(true)
        window.addEventListener('online', handleOnline)
        return () => window.removeEventListener('online', handleOnline)
    }, [])

    useEffect(() => {
        if (isOnline) {
            window.location.href = '/'
        }
    }, [isOnline])

    return (
        <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
                <div className="text-6xl mb-6">📵</div>
                <h1 className="text-2xl font-bold mb-4">Sin conexión</h1>
                <p className="mb-6 text-[var(--text-muted)]">
                    Parece que no tenés internet. La app intentará reconectar automáticamente.
                </p>

                {/* Connection indicator */}
                <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-600">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="text-sm font-medium">Esperando conexión...</span>
                    </div>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-[#ff6b6b] hover:bg-[#ff8787] text-white rounded-lg font-semibold transition-colors active:scale-95"
                >
                    Reintentar ahora
                </button>
            </div>
        </main>
    )
}
