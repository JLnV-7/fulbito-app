'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { ResenasMVP } from '@/components/jugadores/ResenasMVP'
import { NavBar } from '@/components/NavBar'
import { DesktopNav } from '@/components/DesktopNav'
import { ChevronLeft, User } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'

export default function JugadorPage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const jugadorId = Number(id)
  const jugadorNombre = searchParams.get('nombre') || 'Jugador'
  
  return (
    <>
      <DesktopNav />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-28 md:pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => {
              hapticFeedback(10)
              router.back()
            }}
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] mb-8 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-bold uppercase tracking-wider">Volver</span>
          </button>

          {/* Player Header */}
          <div className="flex items-center gap-6 mb-12">
             <div className="w-24 h-24 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--card-border)] shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <User size={48} className="text-[var(--accent)] relative z-10" />
             </div>
             <div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-1">
                  {jugadorNombre}
                </h1>
                <p className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                   Perfil de Jugador
                </p>
             </div>
          </div>

          <ResenasMVP jugadorId={jugadorId} jugadorNombre={jugadorNombre} />
        </div>
      </main>
      <NavBar />
    </>
  )
}
