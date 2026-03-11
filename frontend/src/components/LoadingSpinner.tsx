// src/components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="text-center py-10">
      <div className="inline-block w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-[var(--text-muted)] font-bold animate-pulse capitalize text-xs tracking-tight">
        Cargando...
      </p>
    </div>
  )
}
