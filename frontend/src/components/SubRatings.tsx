'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

interface SubRatingsProps {
    ratings: {
        arbitro: number
        atmosfera: number
        garra: number
    }
    onChange: (field: 'arbitro' | 'atmosfera' | 'garra', value: number) => void
    readOnly?: boolean
}

export function SubRatings({ ratings, onChange, readOnly = false }: SubRatingsProps) {
    const { t, language } = useLanguage()

    const categories = [
        {
            id: 'arbitro' as const,
            label: t('ratings.subratings.referee'),
            icon: '🟨',
            color: '#d97706',
            value: ratings.arbitro
        },
        {
            id: 'atmosfera' as const,
            label: t('ratings.subratings.atmosphere'),
            icon: '🏟️',
            color: 'var(--foreground)',
            value: ratings.atmosfera
        },
        {
            id: 'garra' as const,
            label: t('ratings.subratings.garra'),
            icon: '🔥',
            color: '#dc2626',
            value: ratings.garra
        }
    ]

    const handleChange = (id: 'arbitro' | 'atmosfera' | 'garra', val: number) => {
        if (!readOnly) {
            onChange(id, val)
        }
    }

    return (
        <div className="space-y-5 bg-[var(--card-bg)] border border-[var(--card-border)] p-5" style={{ borderRadius: 'var(--radius)' }}>
            <div className="mb-2 border-b border-[var(--card-border)] border-dashed pb-2">
                <h3 className="text-[10px] font-black capitalize tracking-widest flex items-center gap-2">
                    📊 Calificaciones Detalladas
                </h3>
                <p className="text-[9px] font-bold text-[var(--text-muted)] capitalize mt-1">
                    {language === 'es' ? 'Deslizá para evaluar' : (language === 'en' ? 'Slide to rate' : 'Deslize para avaliar')}
                </p>
            </div>

            {categories.map((cat) => (
                <div key={cat.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black text-[var(--text-muted)] capitalize flex items-center gap-1.5 tracking-tight">
                            <span>{cat.icon}</span> {cat.label}
                        </label>
                        <span className="text-[10px] font-black tabular-nums border border-[var(--card-border)] bg-[var(--background)] px-1.5 py-0.5" style={{ color: cat.value > 0 ? cat.color : 'var(--text-muted)', borderRadius: 'var(--radius)' }}>
                            {cat.value > 0 ? cat.value.toFixed(1) : '-.-'}
                        </span>
                    </div>

                    <div className="relative h-6 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="5"
                            step="0.5"
                            value={cat.value}
                            onChange={(e) => handleChange(cat.id, parseFloat(e.target.value))}
                            disabled={readOnly}
                            className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                        />

                        {/* Custom visual track */}
                        <div className="w-full h-1.5 bg-[var(--background)] border border-[var(--card-border)] overflow-hidden relative z-10">
                            <motion.div
                                className="h-full"
                                style={{ backgroundColor: cat.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(cat.value / 5) * 100}%` }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            />
                        </div>

                        {/* Custom thumb/handle */}
                        <motion.div
                            className="absolute h-4 w-4 bg-[var(--background)] z-10 border-2 border-[var(--foreground)] pointer-events-none"
                            style={{
                                left: `calc(${(cat.value / 5) * 100}% - 8px)`,
                                borderRadius: 'var(--radius)'
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
