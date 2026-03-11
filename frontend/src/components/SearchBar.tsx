import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Buscar hincha o equipo...' }: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false)
    const [suggestions, setSuggestions] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const timer = setTimeout(() => {
            if (value.length >= 2) {
                fetchSuggestions(value)
            } else {
                setSuggestions([])
            }
        }, 200)

        return () => clearTimeout(timer)
    }, [value])

    const fetchSuggestions = async (query: string) => {
        setLoading(true)
        const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${query}%`)
            .limit(5)

        setSuggestions(data || [])
        setLoading(false)
    }

    return (
        <div className="relative w-full max-w-md">
            <div className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl
        bg-[var(--card-bg)] border transition-all duration-200
        ${isFocused
                    ? 'border-[var(--accent)] shadow-lg shadow-[var(--accent)]/10'
                    : 'border-[var(--card-border)] hover:border-[var(--hover-bg)]'
                }
      `}>
                {/* Search Icon */}
                <span className="text-xl">🔍</span>

                {/* Input */}
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-[var(--foreground)] placeholder-[var(--text-muted)] 
                     outline-none text-sm font-medium"
                />

                {/* Clear Button */}
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Limpiar búsqueda"
                    >
                        <span className="text-lg">✕</span>
                    </button>
                )}
            </div>

            {/* Suggestions Autocomplete */}
            <AnimatePresence>
                {isFocused && (suggestions.length > 0 || loading) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 left-0 right-0 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {loading ? (
                            <div className="p-4 text-center text-xs text-[var(--text-muted)] animate-pulse">
                                Buscando...
                            </div>
                        ) : (
                            <div className="py-2">
                                {suggestions.map(s => (
                                    <button
                                        key={s.id}
                                        onMouseDown={() => router.push(`/perfil/${s.id}`)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--hover-bg)] transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-[var(--hover-bg)] overflow-hidden flex items-center justify-center text-xs font-bold">
                                            {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : s.username[0]}
                                        </div>
                                        <span className="text-sm font-medium">{s.username}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
