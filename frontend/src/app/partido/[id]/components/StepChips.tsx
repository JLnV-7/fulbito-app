'use client'

import { hapticFeedback } from '@/lib/helpers'

// ─── Chip definitions ─────────────────────────────────────────────────────
const CHIPS = [
  { id: 'arbitro',    emoji: '🟨', label: 'Árbitro polémico' },
  { id: 'clima',      emoji: '🌧️', label: 'Clima extremo' },
  { id: 'garra',      emoji: '🔥', label: 'Mucha garra' },
  { id: 'aburrido',   emoji: '😴', label: 'Aburrido' },
  { id: 'goles',      emoji: '⚽', label: 'Lluvia de goles' },
  { id: 'tactica',    emoji: '🧠', label: 'Táctico' },
  { id: 'cancha',     emoji: '🏟️', label: 'Cancha llena' },
  { id: 'penal',      emoji: '🎯', label: 'Penal polémico' },
  { id: 'expulsion',  emoji: '🟥', label: 'Expulsión clave' },
  { id: 'dt',         emoji: '👔', label: 'Gran DT' },
  { id: 'golazo',     emoji: '🚀', label: 'Golazo' },
  { id: 'var',        emoji: '📺', label: 'VAR decisivo' },
] as const

interface Props {
  selected: string[]
  onChange: (chips: string[]) => void
}

export function StepChips({ selected, onChange }: Props) {
  const toggle = (chipId: string) => {
    hapticFeedback(10)
    if (selected.includes(chipId)) {
      onChange(selected.filter(c => c !== chipId))
    } else {
      onChange([...selected, chipId])
    }
  }

  return (
    <div className="step-chips">
      <p className="step-chips__subtitle">¿Qué caracterizó al partido?</p>
      <p className="step-chips__hint">Seleccioná las que apliquen (opcional)</p>

      <div className="step-chips__grid">
        {CHIPS.map(chip => {
          const isActive = selected.includes(chip.id)
          return (
            <button
              key={chip.id}
              type="button"
              className={`step-chips__chip ${isActive ? 'step-chips__chip--active' : ''}`}
              onClick={() => toggle(chip.id)}
              aria-pressed={isActive}
            >
              <span className="step-chips__emoji">{chip.emoji}</span>
              <span className="step-chips__label">{chip.label}</span>
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <p className="step-chips__count">
          {selected.length} seleccionad{selected.length === 1 ? 'o' : 'os'}
        </p>
      )}

      <style>{`
        .step-chips {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem 1rem;
        }
        .step-chips__subtitle {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-muted);
        }
        .step-chips__hint {
          font-size: 0.7rem;
          color: var(--text-muted);
          opacity: 0.6;
          margin-top: -0.75rem;
        }
        .step-chips__grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          max-width: 400px;
        }
        .step-chips__chip {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 0.85rem;
          border-radius: 9999px;
          border: 1.5px solid var(--card-border);
          background: var(--card-bg);
          color: var(--foreground);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .step-chips__chip:hover {
          border-color: var(--text-muted);
          transform: translateY(-1px);
        }
        .step-chips__chip:active {
          transform: scale(0.95);
        }
        .step-chips__chip--active {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 15%, transparent);
          box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .step-chips__emoji {
          font-size: 1rem;
          line-height: 1;
        }
        .step-chips__label {
          font-size: 0.7rem;
        }
        .step-chips__count {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--accent);
        }
      `}</style>
    </div>
  )
}
