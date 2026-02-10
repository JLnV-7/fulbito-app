// src/components/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="bg-red-500/10 border border-red-500/50 rounded-2xl p-6 text-center">
      <p className="text-red-400 font-bold mb-4">⚠️ {message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-full text-sm font-black uppercase transition-all"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}