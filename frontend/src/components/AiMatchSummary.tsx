'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Mic2, RefreshCw } from 'lucide-react'
import { generateAiSummary } from '@/actions/partido'

interface AiMatchSummaryProps {
  partidoId: number
}

export function AiMatchSummary({ partidoId }: AiMatchSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const fetchSummary = async (forceRegenerate = false) => {
    try {
      if (forceRegenerate) {
        setRegenerating(true)
        // Opcional: Podrías pasar un flag al server action para forzar
        // recreación ignorando la DB. Por ahora mostramos loading state
      } else {
        setLoading(true)
      }
      
      const res = await generateAiSummary(partidoId)
      
      if (res.success && res.summary) {
        setSummary(res.summary)
        setError(null)
      } else {
        setError(res.error || 'No se pudo generar la crónica del partido.')
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión al relator AI.')
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [partidoId])

  // Simple markdown renderer for bold (**text**) and newlines
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />
      
      // Handle ### Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} className="text-lg font-black mb-2 text-[var(--foreground)]">{line.replace('### ', '')}</h4>
      }
      // Handle **bold**
      const parts = line.split(/(\*\*.*?\*\*)/g)
      return (
        <p key={i} className="mb-2 text-sm leading-relaxed text-[var(--text-muted)]">
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-[var(--foreground)]">{part.substring(2, part.length - 2)}</strong>
            }
            return part
          })}
        </p>
      )
    })
  }

  if (loading && !summary) {
    return (
      <div className="bg-[#10241b] border border-[#16a34a]/20 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#16a34a] blur-[80px] opacity-20" />
        <div className="flex items-center gap-3 mb-4">
          <Mic2 className="text-[#16a34a] animate-pulse" size={20} />
          <h3 className="text-xs font-black uppercase tracking-widest text-[#16a34a]">La Crónica del Relator</h3>
        </div>
        <div className="space-y-3 animate-pulse">
            <div className="h-5 bg-[#16a34a]/10 rounded w-3/4" />
            <div className="h-3 bg-[var(--card-border)]/50 rounded w-full" />
            <div className="h-3 bg-[var(--card-border)]/50 rounded w-5/6" />
            <div className="h-3 bg-[var(--card-border)]/50 rounded w-4/6" />
        </div>
        <p className="text-[10px] text-[#16a34a]/60 mt-4 italic text-center animate-pulse tracking-widest uppercase font-bold">
            El relator está calentando la garganta...
        </p>
      </div>
    )
  }

  if (!summary && !error) return null

  return (
    <div className="bg-[#10241b] border border-[#16a34a]/30 rounded-2xl p-6 shadow-lg relative overflow-hidden group transition-all duration-500 hover:border-[#16a34a]/50">
      {/* Background glow effects */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#16a34a] blur-[100px] opacity-20 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--accent)] blur-[100px] opacity-10 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-[#16a34a]/20 p-2 rounded-xl">
             <Mic2 className="text-[#16a34a]" size={18} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-[#16a34a] drop-shadow-sm">La Crónica del Relator</h3>
          <Sparkles className="text-yellow-500 ml-1 opacity-80" size={14} />
        </div>

        {/* Action Button */}
        <button 
            onClick={() => fetchSummary(true)}
            disabled={regenerating}
            className="text-[10px] flex items-center gap-1 font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[#16a34a] transition-colors disabled:opacity-50"
            title="Regenerar crónica"
        >
            <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Regenerar</span>
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 prose-sm text-balance">
        {error ? (
           <div className="text-red-400 text-xs text-center border border-red-500/20 bg-red-500/10 p-3 rounded-lg">
               {error}
           </div>
        ) : (
           <div className={regenerating ? 'opacity-50' : ''}>
               {summary && renderFormattedText(summary)}
           </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-5 pt-3 border-t border-white/5 relative z-10 flex justify-between items-center opacity-40">
        <span className="text-[9px] font-bold uppercase tracking-widest text-white">Generado por IA con datos reales del partido</span>
        <span className="text-[9px] uppercase tracking-widest text-white">FutLog Viterbo Engine</span>
      </div>
    </div>
  )
}
