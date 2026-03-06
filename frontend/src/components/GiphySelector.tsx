'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

// You should add NEXT_PUBLIC_GIPHY_API_KEY to your .env.local
// Falling back to a public beta key if not provided (might be rate-limited)
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'GlVGYHqc3SyCEGqmeHg5XcGWtwMky1A8'

interface GiphySelectorProps {
    onSelect: (gifUrl: string) => void
    onClose: () => void
}

export function GiphySelector({ onSelect, onClose }: GiphySelectorProps) {
    const [query, setQuery] = useState('')
    const [gifs, setGifs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const fetchGifs = async (searchQuery: string) => {
        setLoading(true)
        setError('')
        try {
            const endpoint = searchQuery.trim()
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=20&rating=g`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`

            const response = await fetch(endpoint)
            const data = await response.json()

            if (data.meta?.status === 200) {
                setGifs(data.data)
            } else {
                setError('Error al cargar GIFs')
            }
        } catch (err) {
            console.error('Giphy API error:', err)
            setError('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGifs('')
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        }
    }, [])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setQuery(val)

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = setTimeout(() => {
            fetchGifs(val)
        }, 500)
    }

    return (
        <div className="absolute bottom-full right-0 mb-2 w-72 h-80 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-xl flex flex-col overflow-hidden z-50">
            {/* Header / Search */}
            <div className="p-3 border-b border-[var(--card-border)] bg-[var(--background)] relative flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar GIFs..."
                        value={query}
                        onChange={handleSearch}
                        className="w-full bg-[var(--input-bg)] border border-[var(--card-border)] rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-[var(--accent)]"
                        autoFocus
                    />
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-[var(--text-muted)] hover:bg-[var(--hover-bg)] rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                {loading && gifs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
                        <Loader2 className="animate-spin w-6 h-6" />
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <span className="text-2xl mb-2">😢</span>
                        <p className="text-xs text-[var(--text-muted)]">{error}</p>
                    </div>
                ) : gifs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <span className="text-2xl mb-2">🔍</span>
                        <p className="text-xs text-[var(--text-muted)]">No se encontraron GIFs</p>
                    </div>
                ) : (
                    <div className="columns-2 gap-2 space-y-2">
                        {gifs.map((gif) => (
                            <div
                                key={gif.id}
                                className="break-inside-avoid relative group cursor-pointer rounded-lg overflow-hidden bg-[var(--input-bg)]"
                                onClick={() => onSelect(gif.images.fixed_height.url)}
                            >
                                <img
                                    src={gif.images.fixed_height_small.url}
                                    alt={gif.title || 'GIF'}
                                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-200"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Giphy Attribution */}
            <div className="py-1 px-3 text-[10px] text-center text-[var(--text-muted)] bg-[var(--background)] border-t border-[var(--card-border)]">
                Powered By GIPHY
            </div>
        </div>
    )
}
