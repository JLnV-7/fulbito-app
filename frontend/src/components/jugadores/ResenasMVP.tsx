'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trophy, User, MessageCircle } from 'lucide-react'

export function ResenasMVP({
  jugadorId,
  jugadorNombre,
}: {
  jugadorId: number
  jugadorNombre: string
}) {
  const [resenas, setResenas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('resenas')
      .select(`*, usuario:profiles(username, avatar_url)`)
      .eq('mvp_jugador_id', jugadorId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setResenas(data ?? [])
        setLoading(false)
      })
  }, [jugadorId])

  if (loading) return (
     <div className="animate-pulse space-y-4">
        <div className="h-4 bg-[var(--card-border)] rounded w-1/2" />
        <div className="h-24 bg-[var(--card-border)] rounded-2xl w-full" />
     </div>
  )

  return (
    <div className="mt-10 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[var(--foreground)] font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" /> RECONOCIMIENTO DE LA HINCHADA
        </h3>
        <div className="h-px flex-1 mx-4 bg-[var(--card-border)] opacity-30"></div>
      </div>

      {resenas.length === 0 ? (
        <div className="p-8 text-center bg-[var(--card-bg)] border border-[var(--card-border)] border-dashed rounded-2xl">
          <p className="text-[var(--text-muted)] text-xs font-bold italic tracking-tighter uppercase opacity-30 px-6">
            Todavía nadie lo eligió MVP. ¡Puntuá un partido y elegilo vos!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest bg-[var(--accent)]/10 text-[var(--accent)] px-3 py-1 rounded-full w-fit">
            ELEGIDO MVP {resenas.length} VECES
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resenas.map((r) => (
              <div key={r.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 space-y-3 hover:border-[var(--accent)]/30 transition-all">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/perfil/${r.usuario?.username}`}
                    className="flex items-center gap-2"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                      {r.usuario?.avatar_url ? (
                        <img src={r.usuario.avatar_url} alt={r.usuario.username} className="w-full h-full object-cover" />
                      ) : (
                        <User size={10} className="text-[var(--accent)]" />
                      )}
                    </div>
                    <span className="text-[var(--foreground)] text-[10px] font-black italic tracking-tighter hover:text-[var(--accent)]">
                      @{r.usuario?.username}
                    </span>
                  </Link>
                  <Link
                    href={`/partido/${r.partido_id}`}
                    className="text-[var(--text-muted)] text-[9px] font-bold uppercase hover:underline"
                  >
                    Match #{r.partido_id}
                  </Link>
                </div>
                {r.texto && (
                  <div className="flex gap-2">
                    <MessageCircle size={12} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                    <p className="text-[var(--foreground)] text-xs font-medium leading-relaxed">
                      "{r.texto}"
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
