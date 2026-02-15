// src/components/SearchBar.tsx
'use client'

import { useState } from 'react'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Buscar equipo...' }: SearchBarProps) {
    const [isFocused, setIsFocused] = useState(false)

    return (
        <div className="relative w-full max-w-md">
            <div className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl
        bg-[#242424] border transition-all duration-200
        ${isFocused
                    ? 'border-[#ff6b6b] shadow-lg shadow-[#ff6b6b]/10'
                    : 'border-[#333333] hover:border-[#444444]'
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
                    className="flex-1 bg-transparent text-[#f5f5f5] placeholder-[#606060] 
                     outline-none text-sm font-medium"
                />

                {/* Clear Button */}
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="text-[#909090] hover:text-[#f5f5f5] transition-colors"
                        aria-label="Limpiar búsqueda"
                    >
                        <span className="text-lg">✕</span>
                    </button>
                )}
            </div>

            {/* Results hint */}
            {value && (
                <div className="absolute top-full mt-2 left-0 right-0 text-center">
                    <p className="text-xs text-[#909090]">
                        Buscando "{value}"
                    </p>
                </div>
            )}
        </div>
    )
}
