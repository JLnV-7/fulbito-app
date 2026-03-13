// src/components/LiveMatchesStrip.tsx
'use client'

import Link from 'next/link'
import { TeamLogo } from '@/components/TeamLogo'
import type { Partido } from '@/types'

export function LiveMatchesStrip({ partidos }: { partidos: Partido[] }) {
  if (!partidos.length) return null

  return (
    <div className="mb-6 pt-2">
      <div className="flex items-center gap-2 px-1 mb-3">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">En vivo ahora</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
        {partidos.map(p => (
          <Link key={p.id} href={`/partido/${p.id}`} className="shrink-0 transition-transform active:scale-95">
            <div className="w-48 bg-[var(--card-bg)] border border-red-500/20 rounded-2xl p-3 shadow-lg hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <TeamLogo src={p.logo_local || undefined} teamName={p.equipo_local} size={28} />
                <div className="flex flex-col items-center">
                    <span className="text-xl font-black tabular-nums tracking-tighter">
                    {p.goles_local ?? 0} <span className="text-[var(--text-muted)] opacity-30 mx-0.5">-</span> {p.goles_visitante ?? 0}
                    </span>
                    <span className="text-[8px] font-black text-red-500 animate-pulse">LIVE</span>
                </div>
                <TeamLogo src={p.logo_visitante || undefined} teamName={p.equipo_visitante} size={28} />
              </div>
              <div className="text-[10px] text-center font-bold text-[var(--text-muted)] truncate flex flex-col gap-0.5">
                <span className="block truncate">{p.equipo_local} vs {p.equipo_visitante}</span>
                <span className="block text-[8px] opacity-50 uppercase">{p.liga}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
