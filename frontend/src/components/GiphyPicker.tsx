// src/components/GiphyPicker.tsx
'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, X } from 'lucide-react'

interface GiphyPickerProps {
    onSelect: (url: string) => void
    onClose: () => void
}

const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'BkaUZZWcFij6J7AoQn3vnVKcgUdKibwe'

export function GiphyPicker({ onSelect, onClose }: GiphyPickerProps) {
    const [query, setQuery] = useState('')
    const [gifs, setGifs] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        // Fetch trending initially
        fetchGifs('')
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGifs(query)
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    const fetchGifs = async (searchQuery: string) => {
        setLoading(true)
        try {
            const endpoint = searchQuery
                ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchQuery)}&limit=12`
                : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12`

            const res = await fetch(endpoint)
            const json = await res.json()
            setGifs(json.data || [])
        } catch (error) {
            console.error('Error fetching GIFs:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-2.5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar GIF (ej: golazo, llorando)..."
                        className="w-full pl-8 pr-3 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-muted)]"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="h-48 overflow-y-auto no-scrollbar relative min-h-[100px]">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--card-bg)]/80 z-10">
                        <Loader2 className="animate-spin text-[var(--accent)]" />
                    </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                    {gifs.map((gif) => (
                        <button
                            key={gif.id}
                            type="button"
                            onClick={() => onSelect(gif.images.downsized_medium.url)}
                            className="aspect-square rounded-lg overflow-hidden bg-[var(--hover-bg)] hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={gif.images.preview_gif.url}
                                alt={gif.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </button>
                    ))}
                    {!loading && gifs.length === 0 && (
                        <div className="col-span-3 text-center text-sm text-[var(--text-muted)] py-4">
                            No se encontraron GIFs
                        </div>
                    )}
                </div>
            </div>
            <div className="text-[10px] items-center text-center mt-2 text-[var(--text-muted)] flex justify-center gap-1">
                Powered By GIPHY
            </div>
        </div>
    )
}
