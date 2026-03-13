'use client'

interface Props {
  value?: number
  onChange: (v: number) => void
}

export function PlayerRatingPicker({ value, onChange }: Props) {
  return (
    <div className="flex gap-0.5 flex-shrink-0">
      {[1,2,3,4,5,6,7,8,9,10].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(value === n ? 0 : n)}
          className={`w-6 h-6 text-[10px] font-black rounded-md transition-all
            ${value === n
              ? n >= 7
                ? 'bg-green-600 text-white scale-110'
                : n >= 5
                ? 'bg-yellow-500 text-white scale-110'
                : 'bg-red-600 text-white scale-110'
              : 'bg-[var(--hover-bg)] text-[var(--text-muted)] hover:bg-[var(--card-border)]'
            }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}
