// src/components/DateScroller.tsx
// Reemplaza el bloque de calendario inline en page.tsx
// Scroll horizontal con auto-scroll al día activo
'use client'

import { useEffect, useRef } from 'react'
import { hapticFeedback } from '@/lib/helpers'

interface DateScrollerProps {
    dateRange: Date[]
    selectedDate: string
    onSelect: (dateStr: string) => void
    localeFormat: string
}

function toLocalDateStr(date: Date): string {
    return date.toISOString().split('T')[0]
}

function getLabel(date: Date, localeFormat: string): { top: string; bottom: string; isSpecial: boolean } {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(date)
    target.setHours(0, 0, 0, 0)
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000)

    if (diff === 0) return { top: '●', bottom: 'Hoy', isSpecial: true }
    if (diff === -1) return { top: '', bottom: 'Ayer', isSpecial: true }
    if (diff === 1) return { top: '', bottom: 'Mañ.', isSpecial: true }

    return {
        top: target.toLocaleDateString(localeFormat, { weekday: 'short' }),
        bottom: String(target.getDate()),
        isSpecial: false
    }
}

export function DateScroller({ dateRange, selectedDate, onSelect, localeFormat }: DateScrollerProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const selectedRef = useRef<HTMLButtonElement>(null)

    // Auto-scroll al día seleccionado al montar y cuando cambia
    useEffect(() => {
        if (selectedRef.current && scrollRef.current) {
            const container = scrollRef.current
            const button = selectedRef.current
            const containerCenter = container.offsetWidth / 2
            const buttonCenter = button.offsetLeft + button.offsetWidth / 2
            container.scrollTo({
                left: buttonCenter - containerCenter,
                behavior: 'smooth'
            })
        }
    }, [selectedDate])

    const todayStr = toLocalDateStr(new Date())

    return (
        <div
            ref={scrollRef}
            className="flex gap-1.5 overflow-x-auto py-2 px-0.5"
            style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
            }}
        >
            {dateRange.map((date) => {
                const dateStr = toLocalDateStr(date)
                const { top, bottom, isSpecial } = getLabel(date, localeFormat)
                const isSelected = dateStr === selectedDate
                const isToday = dateStr === todayStr

                return (
                    <button
                        key={dateStr}
                        ref={isSelected ? selectedRef : undefined}
                        onClick={() => {
                            hapticFeedback(5)
                            onSelect(dateStr)
                        }}
                        className={`flex flex-col items-center justify-center shrink-0 transition-all
                            ${isSpecial ? 'min-w-[52px] px-2 py-2' : 'min-w-[44px] px-1.5 py-2'}
                            rounded-2xl border
                            ${isSelected
                                ? 'bg-[var(--foreground)] border-[var(--foreground)] text-[var(--background)] scale-105 shadow-lg'
                                : isToday
                                    ? 'bg-[var(--card-bg)] border-[var(--accent)]/40 text-[var(--foreground)]'
                                    : 'bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text-muted)]'
                            }
                        `}
                    >
                        <span className={`text-[8px] font-black uppercase tracking-wider h-3 leading-3
                            ${isSelected ? 'opacity-80' : 'opacity-50'}
                        `}>
                            {top}
                        </span>
                        <span className={`font-black tracking-tighter mt-0.5 leading-none
                            ${isSpecial ? 'text-[11px]' : 'text-sm'}
                        `}>
                            {bottom}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
