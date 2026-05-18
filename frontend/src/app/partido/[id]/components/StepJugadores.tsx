'use client'

import { useState } from 'react'
import { hapticFeedback } from '@/lib/helpers'
import { Star, Skull } from 'lucide-react'

interface Jugador {
  id: number
  nombre: string
}

interface Props {
  jugadores: Jugador[]
  mvp: string | undefined
  villano: string | undefined
  onChangeMvp: (name: string | undefined) => void
  onChangeVillano: (name: string | undefined) => void
}

export function StepJugadores({ jugadores, mvp, villano, onChangeMvp, onChangeVillano }: Props) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'mvp' | 'villano'>('mvp')

  const filtered = search.trim()
    ? jugadores.filter(j =>
        j.nombre.toLowerCase().includes(search.toLowerCase())
      )
    : jugadores

  const currentValue = mode === 'mvp' ? mvp : villano
  const onSelect = mode === 'mvp' ? onChangeMvp : onChangeVillano

  const handleSelect = (nombre: string) => {
    hapticFeedback(15)
    if (currentValue === nombre) {
      onSelect(undefined) // deselect
    } else {
      onSelect(nombre)
    }
  }

  const hasJugadores = jugadores.length > 0

  return (
    <div className="step-jugadores">
      <p className="step-jugadores__subtitle">
        {mode === 'mvp' ? '¿Quién fue la figura?' : '¿Quién fue el villano?'}
      </p>
      <p className="step-jugadores__hint">Paso opcional — podés saltearlo</p>

      {/* Mode toggle */}
      <div className="step-jugadores__toggle">
        <button
          type="button"
          className={`step-jugadores__toggle-btn ${mode === 'mvp' ? 'step-jugadores__toggle-btn--active step-jugadores__toggle-btn--mvp' : ''}`}
          onClick={() => setMode('mvp')}
        >
          <Star size={14} /> MVP
          {mvp && <span className="step-jugadores__badge">✓</span>}
        </button>
        <button
          type="button"
          className={`step-jugadores__toggle-btn ${mode === 'villano' ? 'step-jugadores__toggle-btn--active step-jugadores__toggle-btn--villano' : ''}`}
          onClick={() => setMode('villano')}
        >
          <Skull size={14} /> Villano
          {villano && <span className="step-jugadores__badge">✓</span>}
        </button>
      </div>

      {hasJugadores ? (
        <>
          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar jugador..."
            className="step-jugadores__search"
          />

          {/* Player list */}
          <div className="step-jugadores__list">
            {filtered.length === 0 ? (
              <p className="step-jugadores__empty">No se encontraron jugadores</p>
            ) : (
              filtered.map(j => (
                <button
                  key={j.id}
                  type="button"
                  className={`step-jugadores__player ${currentValue === j.nombre ? 'step-jugadores__player--selected' : ''}`}
                  onClick={() => handleSelect(j.nombre)}
                >
                  <span className="step-jugadores__player-icon">
                    {mode === 'mvp' ? '⭐' : '💀'}
                  </span>
                  <span className="step-jugadores__player-name">{j.nombre}</span>
                  {currentValue === j.nombre && (
                    <span className="step-jugadores__check">✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        /* No lineups available — free text input */
        <div className="step-jugadores__freetext">
          <p className="step-jugadores__freetext-label">
            No hay alineaciones disponibles. Escribí el nombre:
          </p>
          <input
            type="text"
            value={currentValue || ''}
            onChange={e => onSelect(e.target.value || undefined)}
            placeholder={mode === 'mvp' ? 'Nombre del MVP...' : 'Nombre del villano...'}
            className="step-jugadores__search"
          />
        </div>
      )}

      <style>{`
        .step-jugadores {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem 1rem;
        }
        .step-jugadores__subtitle {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-muted);
        }
        .step-jugadores__hint {
          font-size: 0.65rem;
          color: var(--text-muted);
          opacity: 0.5;
          margin-top: -0.5rem;
        }
        .step-jugadores__toggle {
          display: flex;
          gap: 0.5rem;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 12px;
          padding: 0.25rem;
        }
        .step-jugadores__toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .step-jugadores__toggle-btn--active.step-jugadores__toggle-btn--mvp {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
        }
        .step-jugadores__toggle-btn--active.step-jugadores__toggle-btn--villano {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .step-jugadores__badge {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          color: var(--background);
          font-size: 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
        }
        .step-jugadores__search {
          width: 100%;
          max-width: 360px;
          padding: 0.65rem 1rem;
          border-radius: 12px;
          border: 1.5px solid var(--card-border);
          background: var(--background);
          color: var(--foreground);
          font-size: 0.8rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .step-jugadores__search:focus {
          border-color: var(--accent);
        }
        .step-jugadores__list {
          width: 100%;
          max-width: 360px;
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .step-jugadores__empty {
          text-align: center;
          color: var(--text-muted);
          font-size: 0.75rem;
          padding: 1rem;
        }
        .step-jugadores__player {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.75rem;
          border-radius: 10px;
          border: 1.5px solid transparent;
          background: var(--card-bg);
          color: var(--foreground);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
        }
        .step-jugadores__player:hover {
          border-color: var(--card-border);
          background: var(--hover-bg);
        }
        .step-jugadores__player--selected {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 10%, transparent);
        }
        .step-jugadores__player-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }
        .step-jugadores__player-name {
          flex: 1;
          font-weight: 600;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .step-jugadores__check {
          color: var(--accent);
          font-weight: 900;
          font-size: 0.85rem;
        }
        .step-jugadores__freetext {
          width: 100%;
          max-width: 360px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .step-jugadores__freetext-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          text-align: center;
        }
      `}</style>
    </div>
  )
}
