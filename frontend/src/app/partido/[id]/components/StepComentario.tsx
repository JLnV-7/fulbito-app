'use client'

interface Props {
  value: string
  onChange: (text: string) => void
}

export function StepComentario({ value, onChange }: Props) {
  const maxLen = 500

  return (
    <div className="step-comentario">
      <p className="step-comentario__subtitle">¿Algo más para decir?</p>
      <p className="step-comentario__hint">Opcional — contá lo que quieras del partido</p>

      <div className="step-comentario__wrap">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          maxLength={maxLen}
          rows={5}
          placeholder="Un golazo de media cancha, un árbitro que arruinó todo, la gambeta del año..."
          className="step-comentario__textarea"
        />
        <span className="step-comentario__counter">
          {value.length}/{maxLen}
        </span>
      </div>

      <style>{`
        .step-comentario {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem 1rem;
        }
        .step-comentario__subtitle {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: var(--text-muted);
        }
        .step-comentario__hint {
          font-size: 0.65rem;
          color: var(--text-muted);
          opacity: 0.5;
          margin-top: -0.75rem;
        }
        .step-comentario__wrap {
          width: 100%;
          max-width: 400px;
          position: relative;
        }
        .step-comentario__textarea {
          width: 100%;
          padding: 1rem;
          border-radius: 14px;
          border: 1.5px solid var(--card-border);
          background: var(--background);
          color: var(--foreground);
          font-size: 0.85rem;
          line-height: 1.5;
          resize: none;
          outline: none;
          transition: border-color 0.2s ease;
          font-family: inherit;
        }
        .step-comentario__textarea::placeholder {
          color: var(--text-muted);
          opacity: 0.4;
        }
        .step-comentario__textarea:focus {
          border-color: var(--accent);
        }
        .step-comentario__counter {
          position: absolute;
          bottom: 0.5rem;
          right: 0.75rem;
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--text-muted);
          opacity: 0.5;
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  )
}
