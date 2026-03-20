'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { JugadorPartidoAmigo } from '@/types'

interface Props {
  jugadores: JugadorPartidoAmigo[]
  totalMiembros: number
}

export function RankingEnVivo({ jugadores, totalMiembros }: Props) {
  // Solo mostramos jugadores que tienen al menos 1 voto
  const conVotos = jugadores
    .filter(j => (j.total_votos || 0) > 0)
    .sort((a, b) => (b.promedio || 0) - (a.promedio || 0))

  const maxPromedio = conVotos[0]?.promedio || 10

  if (conVotos.length === 0) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6 text-center opacity-50">
        <p className="text-2xl mb-2">👀</p>
        <p className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
          Esperando los primeros votos...
        </p>
      </div>
    )
  }

  const azules = conVotos.filter(j => j.equipo === 'azul')
  const rojos = conVotos.filter(j => j.equipo === 'rojo')

  const promedioEquipo = (lista: JugadorPartidoAmigo[]) => {
    if (lista.length === 0) return 0
    const conProm = lista.filter(j => (j.promedio || 0) > 0)
    if (conProm.length === 0) return 0
    return Math.round(conProm.reduce((s, j) => s + (j.promedio || 0), 0) / conProm.length * 10) / 10
  }

  const promAzul = promedioEquipo(azules)
  const promRojo = promedioEquipo(rojos)

  return (
    <div className="space-y-4">
      {/* Header con marcador de equipos */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden">
        <div className="flex">
          <div className={`flex-1 p-4 text-center border-r border-[var(--card-border)] ${promAzul >= promRojo ? 'bg-blue-500/10' : ''}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500 mb-1">🔵 Azul</p>
            <p className="text-3xl font-black text-blue-500 tabular-nums">{promAzul || '–'}</p>
            <p className="text-[9px] text-[var(--text-muted)] mt-1">prom. equipo</p>
          </div>
          <div className="flex flex-col items-center justify-center px-4 gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-40">vs</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shadow-[0_0_6px_#16a34a]" />
            <p className="text-[9px] text-[var(--text-muted)] opacity-40 tabular-nums">
              {conVotos.reduce((s, j) => s + (j.total_votos || 0), 0)} votos
            </p>
          </div>
          <div className={`flex-1 p-4 text-center border-l border-[var(--card-border)] ${promRojo > promAzul ? 'bg-red-500/10' : ''}`}>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 mb-1">🔴 Rojo</p>
            <p className="text-3xl font-black text-red-500 tabular-nums">{promRojo || '–'}</p>
            <p className="text-[9px] text-[var(--text-muted)] mt-1">prom. equipo</p>
          </div>
        </div>
      </div>

      {/* Ranking global — top a bottom */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Ranking en vivo
          </h4>
          <span className="text-[9px] font-black bg-[#16a34a]/10 text-[#16a34a] px-2 py-0.5 rounded-full border border-[#16a34a]/20">
            LIVE
          </span>
        </div>

        <div className="divide-y divide-[var(--card-border)]">
          <AnimatePresence>
            {conVotos.map((j, i) => {
              const pct = maxPromedio > 0 ? ((j.promedio || 0) / 10) * 100 : 0
              const equipoColor = j.equipo === 'azul' ? '#3b82f6' : '#ef4444'
              const isFirst = i === 0

              return (
                <motion.div
                  key={j.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={`flex items-center gap-3 px-5 py-3.5 ${isFirst ? 'bg-amber-400/5' : ''}`}
                >
                  {/* Posición */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    isFirst
                      ? 'bg-amber-400 text-amber-900'
                      : 'bg-[var(--background)] text-[var(--text-muted)]'
                  }`}
                  >
                    {isFirst ? '👑' : i + 1}
                  </div>

                  {/* Nombre + barra */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-bold truncate">{j.nombre}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-40"
                          style={{ color: equipoColor }}>
                          {j.equipo === 'azul' ? '🔵' : '🔴'}
                        </span>
                        <span className="text-base font-black tabular-nums" style={{ color: isFirst ? '#f59e0b' : equipoColor }}>
                          {j.promedio}
                        </span>
                        <span className="text-[9px] text-[var(--text-muted)] font-bold">
                          ({j.total_votos}v)
                        </span>
                      </div>
                    </div>
                    {/* Barra de progreso animada */}
                    <div className="h-1.5 bg-[var(--background)] rounded-full overflow-hidden border border-[var(--card-border)]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: isFirst ? '#f59e0b' : equipoColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Jugadores sin votos todavía */}
      {jugadores.filter(j => (j.total_votos || 0) === 0).length > 0 && (
        <div className="bg-[var(--card-bg)] border border-dashed border-[var(--card-border)] rounded-2xl p-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2 opacity-50">
            Sin votos aún
          </p>
          <div className="flex flex-wrap gap-2">
            {jugadores
              .filter(j => (j.total_votos || 0) === 0)
              .map(j => (
                <span
                  key={j.id}
                  className="text-xs font-bold px-3 py-1.5 rounded-full border border-[var(--card-border)] text-[var(--text-muted)]"
                  style={{ borderLeftColor: j.equipo === 'azul' ? '#3b82f6' : '#ef4444', borderLeftWidth: 3 }}
                >
                  {j.nombre}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Participación */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-50">
          Participación del grupo
        </p>
        <p className="text-[9px] font-black text-[var(--text-muted)]">
          {new Set(jugadores.flatMap(j => Array.from({ length: j.total_votos || 0 }))).size > 0
            ? `~${Math.min(
                totalMiembros,
                Math.max(...jugadores.map(j => j.total_votos || 0))
              )}/${totalMiembros} votaron`
            : `0/${totalMiembros} votaron`
          }
        </p>
      </div>
    </div>
  )
}
