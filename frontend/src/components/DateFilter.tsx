// src/components/DateFilter.tsx
'use client'

interface DateFilterProps {
    value: string
    onChange: (date: string) => void
}

export function DateFilter({ value, onChange }: DateFilterProps) {
    return (
        <div className="relative">
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="
          bg-[#242424] text-[#f5f5f5] 
          border border-[#333333] hover:border-[#444444] focus:border-[#ff6b6b]
          rounded-xl px-4 py-3 text-sm outline-none transition-colors
          cursor-pointer
          [&::-webkit-calendar-picker-indicator]:invert
          [&::-webkit-calendar-picker-indicator]:cursor-pointer
          [&::-webkit-calendar-picker-indicator]:hover:opacity-70
        "
                aria-label="Filtrar por fecha"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 
                   text-[#909090] hover:text-[#f5f5f5] bg-[#242424] pl-2"
                    title="Borrar filtro de fecha"
                >
                    ✕
                </button>
            )}
        </div>
    )
}
