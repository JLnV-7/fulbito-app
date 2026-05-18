'use client'

import { useEffect, useState } from 'react'
import { hapticFeedback } from '@/lib/helpers'
import { Check, Share2 } from 'lucide-react'

interface Props {
  nota: number
  equipoLocal: string
  equipoVisitante: string
  chips: string[]
  mvp?: string
  onClose: () => void
}

// Same color logic as StepNota
function getNoteColor(n: number): string {
  const hue = ((n - 1) / 9) * 120
  return `hsl(${hue}, 80%, 45%)`
}

function getNoteLabel(n: number): string {
  const labels: Record<number, string> = {
    1: 'Desastre total', 2: 'Muy malo', 3: 'Flojo', 4: 'Regular', 5: 'Meh...',
    6: 'Aceptable', 7: 'Buen partido', 8: 'Muy bueno', 9: 'Partidazo', 10: 'OBRA MAESTRA',
  }
  return labels[n] || ''
}

export function VotoResumen({ nota, equipoLocal, equipoVisitante, chips, mvp, onClose }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    hapticFeedback([20, 50, 20, 50, 40])
    requestAnimationFrame(() => setShow(true))
  }, [])

  const handleShare = async () => {
    hapticFeedback(15)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mi reseña: ${equipoLocal} vs ${equipoVisitante}`,
          text: `Le puse un ${nota}/10 a ${equipoLocal} vs ${equipoVisitante}${mvp ? `. MVP: ${mvp}` : ''}. ¡Votá vos también en FutLog!`,
          url: window.location.href,
        })
      } catch { /* user cancelled */ }
    }
  }

  return (
    <div className={`voto-resumen ${show ? 'voto-resumen--show' : ''}`}>
      {/* Success animation */}
      <div className="voto-resumen__icon" style={{ color: getNoteColor(nota) }}>
        <div className="voto-resumen__check-ring">
          <Check size={40} strokeWidth={3} />
        </div>
      </div>

      <h2 className="voto-resumen__title">¡Voto registrado!</h2>

      <div className="voto-resumen__nota" style={{ color: getNoteColor(nota) }}>
        <span className="voto-resumen__nota-value">{nota}</span>
        <span className="voto-resumen__nota-of">/10</span>
      </div>

      <p className="voto-resumen__label" style={{ color: getNoteColor(nota) }}>
        {getNoteLabel(nota)}
      </p>

      <p className="voto-resumen__match">
        {equipoLocal} vs {equipoVisitante}
      </p>

      {mvp && (
        <div className="voto-resumen__mvp">
          ⭐ MVP: <strong>{mvp}</strong>
        </div>
      )}

      {chips.length > 0 && (
        <div className="voto-resumen__chips">
          {chips.map(c => (
            <span key={c} className="voto-resumen__chip">{c}</span>
          ))}
        </div>
      )}

      <div className="voto-resumen__actions">
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button type="button" className="voto-resumen__btn voto-resumen__btn--share" onClick={handleShare}>
            <Share2 size={16} /> Compartir
          </button>
        )}
        <button type="button" className="voto-resumen__btn voto-resumen__btn--close" onClick={onClose}>
          Volver al partido
        </button>
      </div>

      <style>{`
        .voto-resumen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 2rem 1.5rem;
          text-align: center;
          opacity: 0;
          transform: scale(0.9);
          transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .voto-resumen--show {
          opacity: 1;
          transform: scale(1);
        }
        .voto-resumen__icon {
          margin-bottom: 0.5rem;
        }
        .voto-resumen__check-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          border: 3px solid currentColor;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: vr-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes vr-pop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .voto-resumen__title {
          font-size: 1.25rem;
          font-weight: 900;
          color: var(--foreground);
          letter-spacing: -0.03em;
        }
        .voto-resumen__nota {
          display: flex;
          align-items: baseline;
          gap: 0.15rem;
        }
        .voto-resumen__nota-value {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .voto-resumen__nota-of {
          font-size: 1.2rem;
          font-weight: 700;
          opacity: 0.5;
        }
        .voto-resumen__label {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-top: -0.5rem;
        }
        .voto-resumen__match {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .voto-resumen__mvp {
          font-size: 0.8rem;
          color: #eab308;
          padding: 0.5rem 1rem;
          background: rgba(234, 179, 8, 0.1);
          border-radius: 9999px;
          border: 1px solid rgba(234, 179, 8, 0.2);
        }
        .voto-resumen__chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          justify-content: center;
        }
        .voto-resumen__chip {
          font-size: 0.6rem;
          font-weight: 600;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          color: var(--text-muted);
        }
        .voto-resumen__actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
          width: 100%;
          max-width: 320px;
        }
        .voto-resumen__btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          border: none;
        }
        .voto-resumen__btn:active {
          transform: scale(0.95);
        }
        .voto-resumen__btn--share {
          background: var(--card-bg);
          border: 1.5px solid var(--card-border);
          color: var(--foreground);
        }
        .voto-resumen__btn--close {
          background: var(--foreground);
          color: var(--background);
        }
      `}</style>
    </div>
  )
}
