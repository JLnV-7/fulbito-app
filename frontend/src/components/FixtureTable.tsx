// src/components/FixtureTable.tsx
// REDISEÑO: de lista plana a fixture con carácter visual real
// — Logos grandes (36px)
// — Barra lateral de color para partidos LIVE
// — Score tipografía bold prominente
// — Agrupado por liga cuando hay múltiples ligas
// — Filas con hover glassmorphism sutil

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Partido } from '@/types'

interface FixtureTableProps {
  partidos: Partido[]
  isLoading?: boolean
}

// Agrupa partidos por liga manteniendo orden de aparición
function groupByLiga(partidos: Partido[]): Map<string, Partido[]> {
  const map = new Map<string, Partido[]>()
  for (const p of partidos) {
    const liga = p.liga || 'Otros'
    if (!map.has(liga)) map.set(liga, [])
    map.get(liga)!.push(p)
  }
  return map
}

function MatchRow({ p }: { p: Partido }) {
  const hora = p.fecha_inicio
    ? new Date(p.fecha_inicio).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  const isLive     = p.estado === 'EN_JUEGO'
  const isFinished = p.estado === 'FINALIZADO'
  const hasScore   = p.goles_local != null && p.goles_visitante != null
  const linkId     = p.id || p.fixture_id

  return (
    <Link
      href={`/partido/${linkId}`}
      className={`
        relative flex items-center gap-3 px-4 py-3 transition-all group
        hover:bg-white/[0.03]
        ${isLive ? 'bg-red-500/[0.04]' : ''}
      `}
    >
      {/* Barra lateral de estado */}
      <div className={`
        absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all
        ${isLive     ? 'h-8 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : ''}
        ${isFinished ? 'h-4 bg-[var(--card-border)]' : ''}
        ${!isLive && !isFinished ? 'h-4 bg-[var(--accent)]/40' : ''}
      `} />

      {/* Hora / Estado */}
      <div className="w-10 shrink-0 text-center pl-1">
        {isLive ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[9px] font-black text-red-500 tracking-widest uppercase leading-none">LIVE</span>
          </div>
        ) : (
          <span className={`text-[11px] font-bold tabular-nums ${isFinished ? 'text-[var(--text-muted)] opacity-50' : 'text-[var(--text-muted)]'}`}>
            {hora}
          </span>
        )}
      </div>

      {/* Match layout */}
      <div className="flex-1 flex items-center gap-2 min-w-0">

        {/* Equipo local */}
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className={`text-xs font-black truncate text-right leading-tight ${isLive ? 'text-[var(--foreground)]' : isFinished ? 'text-[var(--text-muted)]' : 'text-[var(--foreground)]'}`}>
            {p.equipo_local}
          </span>
          <div className="relative w-8 h-8 shrink-0">
            {p.logo_local ? (
              <Image
                src={p.logo_local}
                alt={p.equipo_local}
                fill
                className="object-contain drop-shadow-sm"
                sizes="32px"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--card-border)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)]">
                {p.equipo_local.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Score / VS */}
        <div className="w-16 shrink-0 text-center">
          {hasScore && (isFinished || isLive) ? (
            <div className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-black text-sm tabular-nums
              ${isLive
                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                : 'bg-[var(--hover-bg)] text-[var(--foreground)] border border-[var(--card-border)]'
              }
            `}>
              <span>{p.goles_local}</span>
              <span className="text-[var(--text-muted)] font-light opacity-50 text-xs">-</span>
              <span>{p.goles_visitante}</span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-[var(--text-muted)] opacity-40 tracking-widest">VS</span>
          )}
        </div>

        {/* Equipo visitante */}
        <div className="flex-1 flex items-center justify-start gap-2 min-w-0">
          <div className="relative w-8 h-8 shrink-0">
            {p.logo_visitante ? (
              <Image
                src={p.logo_visitante}
                alt={p.equipo_visitante}
                fill
                className="object-contain drop-shadow-sm"
                sizes="32px"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--card-border)] flex items-center justify-center text-[10px] font-black text-[var(--text-muted)]">
                {p.equipo_visitante.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <span className={`text-xs font-black truncate leading-tight ${isLive ? 'text-[var(--foreground)]' : isFinished ? 'text-[var(--text-muted)]' : 'text-[var(--foreground)]'}`}>
            {p.equipo_visitante}
          </span>
        </div>
      </div>

      {/* Flecha hover */}
      <div className="w-4 shrink-0 text-[var(--text-muted)] opacity-0 group-hover:opacity-40 transition-opacity text-xs">
        →
      </div>
    </Link>
  )
}

export const FixtureTable: React.FC<FixtureTableProps> = ({ partidos, isLoading }) => {
  if (isLoading) {
    return (
      <div className="divide-y divide-[var(--card-border)]">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-3 bg-[var(--card-border)] rounded animate-shimmer" />
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex justify-end gap-2">
                <div className="h-3 w-20 bg-[var(--card-border)] rounded animate-shimmer" />
                <div className="w-8 h-8 rounded-full bg-[var(--card-border)] animate-shimmer" />
              </div>
              <div className="w-16 h-6 bg-[var(--card-border)] rounded-lg animate-shimmer" />
              <div className="flex-1 flex gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--card-border)] animate-shimmer" />
                <div className="h-3 w-20 bg-[var(--card-border)] rounded animate-shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (partidos.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-4xl mb-3">📅</p>
        <p className="text-[var(--text-muted)] text-sm font-bold">No hay partidos programados</p>
      </div>
    )
  }

  // Si todos son de la misma liga, mostrar lista simple sin header de grupo
  const groups = groupByLiga(partidos)
  const isMultiLiga = groups.size > 1

  if (!isMultiLiga) {
    return (
      <div className="divide-y divide-[var(--card-border)]/50">
        {partidos.map(p => <MatchRow key={p.id} p={p} />)}
      </div>
    )
  }

  // Multi-liga: agrupar con separador
  return (
    <div>
      {[...groups.entries()].map(([liga, matches]) => (
        <div key={liga}>
          {/* Header de liga */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--hover-bg)]/50 border-y border-[var(--card-border)]/50">
            <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {liga}
            </span>
            <div className="flex-1 h-px bg-[var(--card-border)]/30" />
            <span className="text-[9px] text-[var(--text-muted)] opacity-40 font-bold">
              {matches.length} {matches.length === 1 ? 'partido' : 'partidos'}
            </span>
          </div>
          <div className="divide-y divide-[var(--card-border)]/50">
            {matches.map(p => <MatchRow key={p.id} p={p} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
