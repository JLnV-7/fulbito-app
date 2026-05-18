'use client'

import { useState, useCallback } from 'react'
import { hapticFeedback } from '@/lib/helpers'

interface Props {
  value: number
  onChange: (val: number) => void
}

// ─── Interpolación de color basada en nota 1-10 ──────────────────────────
function getNoteColor(n: number): string {
  // 1 = rojo sangre, 5 = amarillo, 10 = verde flúor
  const hue = ((n - 1) / 9) * 120 // 0° (rojo) → 120° (verde)
  return `hsl(${hue}, 80%, 45%)`
}

function getNoteGlow(n: number): string {
  const hue = ((n - 1) / 9) * 120
  return `0 0 80px hsl(${hue}, 90%, 40%), 0 0 160px hsl(${hue}, 80%, 30%)`
}

function getNoteLabel(n: number): string {
  const labels: Record<number, string> = {
    1: 'Desastre total',
    2: 'Muy malo',
    3: 'Flojo',
    4: 'Regular',
    5: 'Meh...',
    6: 'Aceptable',
    7: 'Buen partido',
    8: 'Muy bueno',
    9: 'Partidazo',
    10: 'OBRA MAESTRA',
  }
  return labels[n] || ''
}

export function StepNota({ value, onChange }: Props) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleChange = useCallback((delta: number) => {
    const next = Math.max(1, Math.min(10, value + delta))
    if (next === value) return
    hapticFeedback(15)
    setIsAnimating(true)
    onChange(next)
    setTimeout(() => setIsAnimating(false), 200)
  }, [value, onChange])

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null)

  return (
    <div
      className="step-nota"
      style={{
        '--note-color': getNoteColor(value),
        '--note-glow': getNoteGlow(value),
      } as React.CSSProperties}
      onTouchStart={e => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchStart === null) return
        const diff = e.changedTouches[0].clientX - touchStart
        if (Math.abs(diff) > 40) {
          handleChange(diff > 0 ? 1 : -1)
        }
        setTouchStart(null)
      }}
    >
      <p className="step-nota__subtitle">¿Cómo estuvo el partido?</p>

      <div className="step-nota__controls">
        <button
          type="button"
          className="step-nota__btn step-nota__btn--minus"
          onClick={() => handleChange(-1)}
          disabled={value <= 1}
          aria-label="Bajar nota"
        >
          −
        </button>

        <div className={`step-nota__number ${isAnimating ? 'step-nota__number--pop' : ''}`}>
          <span className="step-nota__value">{value}</span>
          <span className="step-nota__of">/10</span>
        </div>

        <button
          type="button"
          className="step-nota__btn step-nota__btn--plus"
          onClick={() => handleChange(1)}
          disabled={value >= 10}
          aria-label="Subir nota"
        >
          +
        </button>
      </div>

      <p className="step-nota__label" style={{ color: getNoteColor(value) }}>
        {getNoteLabel(value)}
      </p>

      {/* Quick select row */}
      <div className="step-nota__quickselect">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            className={`step-nota__dot ${n === value ? 'step-nota__dot--active' : ''}`}
            style={n === value ? { backgroundColor: getNoteColor(n) } : undefined}
            onClick={() => {
              hapticFeedback(10)
              onChange(n)
            }}
            aria-label={`Nota ${n}`}
          />
        ))}
      </div>

      <style>{`
        .step-nota {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 2rem 1rem;
          min-height: 320px;
        }
        .step-nota__subtitle {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-muted);
          text-align: center;
        }
        .step-nota__controls {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .step-nota__btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid var(--card-border);
          background: var(--card-bg);
          color: var(--foreground);
          font-size: 1.5rem;
          font-weight: 900;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .step-nota__btn:hover:not(:disabled) {
          border-color: var(--note-color);
          color: var(--note-color);
          transform: scale(1.1);
        }
        .step-nota__btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        .step-nota__btn:disabled {
          opacity: 0.25;
          cursor: default;
        }
        .step-nota__number {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .step-nota__number--pop {
          transform: scale(1.15);
        }
        .step-nota__value {
          font-size: 5rem;
          font-weight: 900;
          line-height: 1;
          color: var(--note-color);
          text-shadow: var(--note-glow);
          font-variant-numeric: tabular-nums;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }
        .step-nota__of {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-muted);
          opacity: 0.5;
        }
        .step-nota__label {
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          transition: color 0.3s ease;
          min-height: 1.5em;
          text-align: center;
        }
        .step-nota__quickselect {
          display: flex;
          gap: 0.5rem;
          padding-top: 0.5rem;
        }
        .step-nota__dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--card-border);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }
        .step-nota__dot:hover {
          transform: scale(1.3);
          border-color: var(--text-muted);
        }
        .step-nota__dot--active {
          border-color: transparent;
          transform: scale(1.4);
          box-shadow: 0 0 8px currentColor;
        }
      `}</style>
    </div>
  )
}
