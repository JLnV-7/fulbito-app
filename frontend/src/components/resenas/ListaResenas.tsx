'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Resena } from '@/types/resena'
import { motion } from 'framer-motion'
import { Languages, Loader2, Crown } from 'lucide-react'
import { translateText } from '@/actions/translate'

function ResenaItem({ r }: { r: Resena }) {
  const [translatedText, setTranslatedText] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  const handleTranslate = async () => {
    if (translatedText) {
      setTranslatedText(null)
      return
    }
    if (!r.texto) return

    setIsTranslating(true)
    setErrorLocal(null)
    const res = await translateText(r.texto)
    if (res.success && res.text) {
      setTranslatedText(res.text)
    } else {
      setErrorLocal('Traductor no disponible')
    }
    setIsTranslating(false)
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center font-bold text-xs uppercase tracking-tighter">
             {r.usuario?.avatar_url ? (
               <img src={r.usuario.avatar_url} alt={r.usuario.username} className="w-full h-full rounded-full object-cover" />
             ) : (
               r.usuario?.username?.[0] || '?'
             )}
          </div>
          <span className="text-[var(--foreground)] text-sm font-black italic tracking-tighter flex items-center gap-1">
            @{r.usuario?.username ?? 'usuario'}
            {r.usuario?.is_pro && <Crown size={12} className="text-yellow-400 fill-yellow-400" />}
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
        <div className="group relative">
          <p className="text-[var(--foreground)] text-sm leading-relaxed font-medium">
            "{r.texto}"
          </p>
          <button 
            onClick={handleTranslate} 
            disabled={isTranslating} 
            className="text-[10px] mt-2 flex items-center gap-1 text-[var(--accent)]/70 hover:text-[var(--accent)] transition-colors uppercase font-bold tracking-widest"
          >
            {isTranslating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
            {translatedText ? 'Ocultar Traducción' : 'Traducir al español'}
          </button>
          
          {errorLocal && <span className="text-red-400 text-[10px] block mt-1">{errorLocal}</span>}

          {translatedText && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-[var(--background)] border border-[var(--card-border)]/50 rounded-xl relative"
            >
              <div className="absolute -top-2 left-4 px-2 bg-[var(--background)] text-[var(--accent)] text-[9px] font-black tracking-widest uppercase">Traducción IA</div>
              <p className="text-[var(--foreground)] text-sm leading-relaxed font-medium mt-1">
                "{translatedText}"
              </p>
            </motion.div>
          )}
        </div>
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
  )
}

export function ListaResenas({ partidoId }: { partidoId: number }) {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('resenas')
      .select(`
        *,
        usuario:profiles(username, avatar_url, is_pro)
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
          <ResenaItem key={r.id} r={r} />
        ))}
      </div>
    </div>
  )
}
