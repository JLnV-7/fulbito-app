'use client'

import { useState } from 'react'

interface Props {
    selectedEquipo?: string
    onSelect: (equipo: string) => void
}

const EQUIPOS = [
    // Argentina
    'River Plate', 'Boca Juniors', 'Racing Club', 'Independiente', 'San Lorenzo',
    'Vélez Sarsfield', 'Estudiantes', 'Newell\'s Old Boys', 'Rosario Central', 'Talleres',
    'Belgrano', 'Argentinos Juniors', 'Lanús', 'Banfield', 'Huracán',
    // Internacional
    'Real Madrid', 'Barcelona', 'Atlético Madrid', 'Manchester City', 'Liverpool',
    'Manchester United', 'Arsenal', 'Chelsea', 'PSG', 'Bayern Munich',
    'Inter Miami', 'Flamengo', 'Palmeiras', 'Juventus', 'Inter', 'Milan'
]

export function EquipoSelector({ selectedEquipo, onSelect }: Props) {
    const [search, setSearch] = useState('')

    const filtrados = EQUIPOS.filter(eq =>
        eq.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar equipo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-[var(--background)]/50 border border-[var(--card-border)] rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all"
                />
            </div>

            <div className="max-h-60 overflow-y-auto grid grid-cols-2 gap-2 no-scrollbar px-1 py-1">
                {filtrados.map((equipo) => (
                    <button
                        key={equipo}
                        onClick={() => onSelect(equipo)}
                        className={`px-4 py-2.5 rounded-xl text-left text-sm font-bold transition-all active:scale-95 truncate border
              ${selectedEquipo === equipo
                                ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-sm'
                                : 'bg-[var(--card-bg)]/80 hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)] border-[var(--card-border)]/50'
                            }`}
                    >
                        {equipo}
                    </button>
                ))}
                {filtrados.length === 0 && (
                    <p className="text-center text-xs font-bold text-[var(--text-muted)] col-span-2 py-8">
                        No se encontraron equipos
                    </p>
                )}
            </div>
        </div>
    )
}
