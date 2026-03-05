// src/components/NeutralModeToggle.tsx
'use client'

import { Shield, ShieldCheck } from 'lucide-react'

interface NeutralModeToggleProps {
    enabled: boolean
    onChange: (enabled: boolean) => void
}

export function NeutralModeToggle({ enabled, onChange }: NeutralModeToggleProps) {
    return (
        <button
            type="button"
            onClick={() => onChange(!enabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all w-full ${enabled
                    ? 'bg-[#6366f1]/10 border-[#6366f1]/30 text-[#6366f1]'
                    : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                }`}
        >
            {enabled ? <ShieldCheck size={15} /> : <Shield size={15} />}
            <div className="flex-1 text-left">
                <div className="font-semibold">{enabled ? 'Modo Neutral activo' : 'Modo Neutral'}</div>
                <div className="text-[10px] opacity-70">
                    {enabled ? 'Tu reseña será marcada como imparcial' : 'Puntuá sin sesgo de hinchismo'}
                </div>
            </div>
            <div className={`w-8 h-5 rounded-full flex items-center transition-all ${enabled ? 'bg-[#6366f1] justify-end' : 'bg-[var(--card-border)] justify-start'
                }`}>
                <div className="w-3.5 h-3.5 rounded-full bg-white mx-0.5 shadow-sm transition-all" />
            </div>
        </button>
    )
}
