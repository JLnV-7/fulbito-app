'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Resena } from '@/types/resena'

export function ListaResenas({ partidoId }: { partidoId: number }) {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('resenas')
      .select(`
        *,
        usuario:profiles(username, avatar_url)
      `)
      .eq('partido_id', partidoId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setResenas(data ?? [])
        setLoading(false)
      })
  }, [partidoId])

  if (loading) return (
    <div className="flex justify-center items-center py-10">
      <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
      <span className="ml-3 text-xs text-[var(--text-muted)] font-black uppercase tracking-widest">Cargando reseñas...</span>
    </div>
  )

  if (!resenas.length) return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] border-dashed rounded-2xl p-10 text-center">
      <span className="text-4xl mb-4 block">⚽</span>
      <p className="text-[var(--text-muted)] text-sm font-black italic tracking-tighter">
        Todavía no hay reseñas. ¡Sé el primero en opinar!
      </p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[var(--foreground)] font-black text-sm uppercase tracking-widest">
          Reseñas de la tribuna ({resenas.length})
        </h4>
        <div className="h-px flex-1 mx-4 bg-[var(--card-border)] opacity-30"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resenas.map((r) => (
          <div key={r.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center font-bold text-xs uppercase tracking-tighter">
                   {r.usuario?.avatar_url ? (
                     <img src={r.usuario.avatar_url} alt={r.usuario.username} className="w-full h-full rounded-full object-cover" />
                   ) : (
                     r.usuario?.username?.[0] || '?'
                   )}
                </div>
                <span className="text-[var(--foreground)] text-sm font-black italic tracking-tighter">
                  @{r.usuario?.username ?? 'usuario'}
                </span>
              </div>
              {r.rating && (
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < r.rating! ? 'text-yellow-400' : 'text-gray-600 opacity-30'}`}>
                      ⭐
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {r.texto && (
              <p className="text-[var(--foreground)] text-sm leading-relaxed font-medium">
                "{r.texto}"
              </p>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-[var(--card-border)]/50">
               {r.mvp_jugador_nombre ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-lg">
                  <span className="text-[10px]">🏆</span>
                  <span className="text-green-500 text-[10px] font-black uppercase tracking-widest">
                    MVP: {r.mvp_jugador_nombre}
                  </span>
                </div>
              ) : <div />}
              
              <p className="text-[var(--text-muted)] text-[10px] font-bold opacity-50">
                {new Date(r.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
