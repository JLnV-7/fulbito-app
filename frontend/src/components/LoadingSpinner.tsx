// src/components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="text-center py-10">
      <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-gray-700 font-black animate-pulse uppercase text-xs">
        Cargando...
      </p>
    </div>
  )
}