// src/components/grupos/partido-modal-components/ModalHeader.tsx
'use client'

import { X } from 'lucide-react'
import type { PartidoAmigo } from '@/types'

interface ModalHeaderProps {
    partido: PartidoAmigo
    onClose: () => void
}

export function ModalHeader({ partido, onClose }: ModalHeaderProps) {
    return (
        <div className="bg-[#16a34a] text-white pt-10 pb-4 px-6 relative shrink-0">
            <button
                type="button"
                onClick={onClose}
                className="absolute top-10 right-6 p-2 bg-black/20 rounded-full hover:bg-black/30 transition-all"
            >
                <X size={20} />
            </button>
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-black italic tracking-tighter">⚽ Partido</h2>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {new Date(partido.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long', day: 'numeric', month: 'long'
                    })} · {partido.hora.slice(0, 5)} hs
                </p>
                {partido.cancha && (
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                        📍 {partido.cancha}
                    </p>
                )}
            </div>
        </div>
    )
}
