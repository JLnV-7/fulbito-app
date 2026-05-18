'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { hapticFeedback } from '@/lib/helpers'
import { useToast } from '@/contexts/ToastContext'
import { guardarVotoAction, type VotoPayload } from '@/actions/voto'

import { StepNota } from './StepNota'
import { StepChips } from './StepChips'
import { StepJugadores } from './StepJugadores'
import { StepComentario } from './StepComentario'
import { VotoResumen } from './VotoResumen'

// ─── Types ────────────────────────────────────────────────────────────────
interface Jugador {
  id: number
  nombre: string
}

interface ExistingVote {
  rating_partido: number
  review_text?: string
  jugador_estrella?: string
  jugador_villano?: string
  tags?: string[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  partidoId: string | number
  equipoLocal: string
  equipoVisitante: string
  logoLocal?: string
  logoVisitante?: string
  liga?: string
  golesLocal?: number
  golesVisitante?: number
  jugadores: Jugador[]
  existingVote?: ExistingVote | null
  onVotoGuardado?: () => void
}

// ─── Draft persistence helpers ─────────────────────────────────────────────
interface DraftState {
  nota: number
  chips: string[]
  mvp?: string
  villano?: string
  comentario: string
}

const DRAFT_PREFIX = 'draft_voto_'

function getDraftKey(partidoId: string | number): string {
  return `${DRAFT_PREFIX}${partidoId}`
}

function loadDraft(partidoId: string | number): DraftState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getDraftKey(partidoId))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDraft(partidoId: string | number, state: DraftState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(getDraftKey(partidoId), JSON.stringify(state))
  } catch { /* storage full — ignore */ }
}

function clearDraft(partidoId: string | number): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(getDraftKey(partidoId)) } catch {}
}

// ─── Step definitions ──────────────────────────────────────────────────────
const STEPS = [
  { id: 'nota',       label: 'Nota',       required: true },
  { id: 'chips',      label: 'Tags',       required: false },
  { id: 'jugadores',  label: 'Jugadores',  required: false },
  { id: 'comentario', label: 'Comentario', required: false },
] as const

type StepId = typeof STEPS[number]['id']

// ─── Component ────────────────────────────────────────────────────────────
export function VotacionModal({
  isOpen, onClose, partidoId,
  equipoLocal, equipoVisitante,
  logoLocal, logoVisitante, liga,
  golesLocal, golesVisitante,
  jugadores, existingVote, onVotoGuardado,
}: Props) {
  const router = useRouter()
  const { showToast } = useToast()
  const modalRef = useRef<HTMLDivElement>(null)

  // ── State ──────────────────────────────────────────────────────────────
  const isEdit = !!existingVote

  // Initialize from existing vote or draft
  const initState = useCallback((): DraftState => {
    if (existingVote) {
      return {
        nota: Math.round(existingVote.rating_partido * 2), // 0.5-5 → 1-10
        chips: existingVote.tags || [],
        mvp: existingVote.jugador_estrella,
        villano: existingVote.jugador_villano,
        comentario: existingVote.review_text || '',
      }
    }
    const draft = loadDraft(partidoId)
    if (draft) return draft
    return { nota: 7, chips: [], comentario: '' }
  }, [existingVote, partidoId])

  const [nota, setNota]           = useState(7)
  const [chips, setChips]         = useState<string[]>([])
  const [mvp, setMvp]             = useState<string | undefined>()
  const [villano, setVillano]     = useState<string | undefined>()
  const [comentario, setComentario] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting]   = useState(false)
  const [showResumen, setShowResumen] = useState(false)
  const [hasDraft, setHasDraft]       = useState(false)

  // ── Initialize on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const state = initState()
    setNota(state.nota)
    setChips(state.chips)
    setMvp(state.mvp)
    setVillano(state.villano)
    setComentario(state.comentario)
    setCurrentStep(0)
    setShowResumen(false)
    setSubmitting(false)

    // Check if there was a saved draft
    if (!existingVote && loadDraft(partidoId)) {
      setHasDraft(true)
    } else {
      setHasDraft(false)
    }
  }, [isOpen, initState, existingVote, partidoId])

  // ── Auto-save draft ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || showResumen) return
    saveDraft(partidoId, { nota, chips, mvp, villano, comentario })
  }, [isOpen, showResumen, partidoId, nota, chips, mvp, villano, comentario])

  // ── Lock body scroll ───────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  // ── Navigation ─────────────────────────────────────────────────────────
  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      hapticFeedback(10)
      setCurrentStep(s => s + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      hapticFeedback(10)
      setCurrentStep(s => s - 1)
    }
  }

  const goToStep = (idx: number) => {
    hapticFeedback(10)
    setCurrentStep(idx)
  }

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    hapticFeedback(30)
    setSubmitting(true)

    const payload: VotoPayload = {
      partido_id: String(partidoId),
      equipo_local: equipoLocal,
      equipo_visitante: equipoVisitante,
      logo_local: logoLocal,
      logo_visitante: logoVisitante,
      liga,
      goles_local: golesLocal,
      goles_visitante: golesVisitante,
      rating_partido: nota,
      jugador_estrella: mvp,
      jugador_villano: villano,
      review_text: comentario,
      chips,
    }

    try {
      const result = await guardarVotoAction(payload)
      if (!result.success) {
        throw new Error(result.error)
      }
      clearDraft(partidoId)
      setShowResumen(true)
      onVotoGuardado?.()
    } catch (err: any) {
      showToast(err.message || 'Error al guardar el voto', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────
  if (!isOpen) return null

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="votacion-modal" ref={modalRef}>
      {/* Overlay */}
      <div className="votacion-modal__overlay" onClick={onClose} />

      {/* Modal content */}
      <div className={`votacion-modal__content ${showResumen ? 'votacion-modal__content--resumen' : ''}`}>
        {showResumen ? (
          <VotoResumen
            nota={nota}
            equipoLocal={equipoLocal}
            equipoVisitante={equipoVisitante}
            chips={chips}
            mvp={mvp}
            onClose={onClose}
          />
        ) : (
          <>
            {/* Header */}
            <div className="votacion-modal__header">
              <button type="button" className="votacion-modal__close" onClick={onClose} aria-label="Cerrar">
                <X size={20} />
              </button>

              <div className="votacion-modal__title-wrap">
                <h2 className="votacion-modal__title">
                  {isEdit ? 'Editar reseña' : 'Tu reseña'}
                </h2>
                <p className="votacion-modal__matchinfo">
                  {equipoLocal} vs {equipoVisitante}
                </p>
              </div>

              {/* Progress bar */}
              <div className="votacion-modal__progress">
                <div className="votacion-modal__progress-fill" style={{ width: `${progress}%` }} />
              </div>

              {/* Step pills */}
              <div className="votacion-modal__steps">
                {STEPS.map((step, i) => (
                  <button
                    key={step.id}
                    type="button"
                    className={`votacion-modal__step-pill ${i === currentStep ? 'votacion-modal__step-pill--active' : ''} ${i < currentStep ? 'votacion-modal__step-pill--done' : ''}`}
                    onClick={() => goToStep(i)}
                  >
                    {step.label}
                    {step.required && <span className="votacion-modal__step-required">*</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Draft banner */}
            {hasDraft && currentStep === 0 && (
              <div className="votacion-modal__draft-banner">
                📝 Tenés un borrador guardado — continuamos donde dejaste
                <button type="button" onClick={() => { clearDraft(partidoId); setHasDraft(false); setNota(7); setChips([]); setMvp(undefined); setVillano(undefined); setComentario('') }}>
                  Descartar
                </button>
              </div>
            )}

            {/* Body — Step content */}
            <div className="votacion-modal__body">
              <div
                className="votacion-modal__slider"
                style={{ transform: `translateX(-${currentStep * 100}%)` }}
              >
                <div className="votacion-modal__slide">
                  <StepNota value={nota} onChange={setNota} />
                </div>
                <div className="votacion-modal__slide">
                  <StepChips selected={chips} onChange={setChips} />
                </div>
                <div className="votacion-modal__slide">
                  <StepJugadores
                    jugadores={jugadores}
                    mvp={mvp}
                    villano={villano}
                    onChangeMvp={setMvp}
                    onChangeVillano={setVillano}
                  />
                </div>
                <div className="votacion-modal__slide">
                  <StepComentario value={comentario} onChange={setComentario} />
                </div>
              </div>
            </div>

            {/* Footer navigation */}
            <div className="votacion-modal__footer">
              <button
                type="button"
                className="votacion-modal__nav-btn"
                onClick={goPrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft size={18} /> Anterior
              </button>

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="votacion-modal__nav-btn votacion-modal__nav-btn--next"
                  onClick={goNext}
                >
                  Siguiente <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="votacion-modal__submit-btn"
                  onClick={handleSubmit}
                  disabled={submitting || nota === 0}
                >
                  {submitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Enviar reseña'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .votacion-modal {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .votacion-modal__overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          animation: vm-fade-in 0.25s ease;
        }
        @keyframes vm-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .votacion-modal__content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 500px;
          height: 100dvh;
          background: var(--background);
          display: flex;
          flex-direction: column;
          animation: vm-slide-up 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          overflow: hidden;
        }
        .votacion-modal__content--resumen {
          justify-content: center;
        }
        @keyframes vm-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        /* ── Header ── */
        .votacion-modal__header {
          padding: 1rem 1.25rem 0.75rem;
          border-bottom: 1px solid var(--card-border);
          flex-shrink: 0;
          position: relative;
        }
        .votacion-modal__close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1.5px solid var(--card-border);
          background: var(--card-bg);
          color: var(--foreground);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          z-index: 2;
        }
        .votacion-modal__close:hover {
          border-color: var(--text-muted);
          transform: scale(1.05);
        }
        .votacion-modal__title-wrap {
          padding-right: 3rem;
        }
        .votacion-modal__title {
          font-size: 1rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: var(--foreground);
        }
        .votacion-modal__matchinfo {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 0.15rem;
        }

        /* ── Progress ── */
        .votacion-modal__progress {
          height: 3px;
          background: var(--card-border);
          border-radius: 2px;
          margin-top: 0.75rem;
          overflow: hidden;
        }
        .votacion-modal__progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        /* ── Step pills ── */
        .votacion-modal__steps {
          display: flex;
          gap: 0.35rem;
          margin-top: 0.65rem;
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .votacion-modal__steps::-webkit-scrollbar { display: none; }
        .votacion-modal__step-pill {
          flex-shrink: 0;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          border: 1.5px solid var(--card-border);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.65rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .votacion-modal__step-pill--active {
          border-color: var(--accent);
          background: color-mix(in srgb, var(--accent) 15%, transparent);
          color: var(--accent);
        }
        .votacion-modal__step-pill--done {
          border-color: #16a34a;
          color: #16a34a;
        }
        .votacion-modal__step-required {
          color: #ef4444;
          font-size: 0.7rem;
          margin-left: 0.1rem;
        }

        /* ── Draft banner ── */
        .votacion-modal__draft-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--accent);
          flex-shrink: 0;
        }
        .votacion-modal__draft-banner button {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 0.6rem;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }

        /* ── Body ── */
        .votacion-modal__body {
          flex: 1;
          overflow: hidden;
          position: relative;
        }
        .votacion-modal__slider {
          display: flex;
          height: 100%;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .votacion-modal__slide {
          flex-shrink: 0;
          width: 100%;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        /* ── Footer ── */
        .votacion-modal__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          padding-bottom: max(0.75rem, env(safe-area-inset-bottom));
          border-top: 1px solid var(--card-border);
          background: var(--background);
          flex-shrink: 0;
        }
        .votacion-modal__nav-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          border: 1.5px solid var(--card-border);
          background: transparent;
          color: var(--foreground);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .votacion-modal__nav-btn:hover:not(:disabled) {
          border-color: var(--text-muted);
        }
        .votacion-modal__nav-btn:disabled {
          opacity: 0.3;
          cursor: default;
        }
        .votacion-modal__nav-btn--next {
          background: var(--card-bg);
          border-color: var(--accent);
          color: var(--accent);
        }
        .votacion-modal__submit-btn {
          padding: 0.6rem 1.5rem;
          border-radius: 10px;
          border: none;
          background: var(--foreground);
          color: var(--background);
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .votacion-modal__submit-btn:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        .votacion-modal__submit-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .votacion-modal__submit-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        /* ── Desktop adjustments ── */
        @media (min-width: 768px) {
          .votacion-modal__content {
            height: auto;
            max-height: 90vh;
            border-radius: 20px 20px 0 0;
            animation-name: vm-slide-up-md;
          }
          @keyframes vm-slide-up-md {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        }
      `}</style>
    </div>
  )
}
