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
        <div className="space-y-3">
            <input
                type="text"
                placeholder="Buscar equipo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl px-4 py-3 outline-none focus:border-[#ffd700]"
                autoFocus
            />

            <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filtrados.map((equipo) => (
                    <button
                        key={equipo}
                        onClick={() => onSelect(equipo)}
                        className={`px-4 py-2 rounded-lg text-left text-sm font-medium transition-all
              ${selectedEquipo === equipo
                                ? 'bg-[#ffd700] text-black'
                                : 'bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                            }`}
                    >
                        {equipo}
                    </button>
                ))}
                {filtrados.length === 0 && (
                    <p className="text-center text-sm text-[var(--text-muted)] col-span-2 py-4">
                        No se encontraron equipos
                    </p>
                )}
            </div>
        </div>
    )
}
