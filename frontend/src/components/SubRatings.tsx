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
            color: '#f59e0b',
            value: ratings.arbitro
        },
        {
            id: 'atmosfera' as const,
            label: t('ratings.subratings.atmosphere'),
            icon: '🏟️',
            color: '#10b981',
            value: ratings.atmosfera
        },
        {
            id: 'garra' as const,
            label: t('ratings.subratings.garra'),
            icon: '🔥',
            color: '#ff6b6b',
            value: ratings.garra
        }
    ]

    const handleChange = (id: 'arbitro' | 'atmosfera' | 'garra', val: number) => {
        if (!readOnly) {
            onChange(id, val)
        }
    }

    return (
        <div className="space-y-5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5">
            <div className="mb-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>📊</span> Calificaciones Detalladas
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                    {language === 'es' ? 'Deslizá para evaluar' : (language === 'en' ? 'Slide to rate' : 'Deslize para avaliar')} (0.5 - 5.0)
                </p>
            </div>

            {categories.map((cat) => (
                <div key={cat.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                            <span>{cat.icon}</span> {cat.label}
                            {cat.id === 'garra' && (
                                <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded ml-1 font-bold">REQ</span>
                            )}
                        </label>
                        <span className="text-sm font-bold tabular-nums" style={{ color: cat.value > 0 ? cat.color : 'var(--text-muted)' }}>
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
                        <div className="w-full h-2 bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--card-border)] relative z-10">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: cat.color }}
                                initial={{ width: 0 }}
                                animate={{ width: `${(cat.value / 5) * 100}%` }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                            />
                        </div>

                        {/* Custom thumb/handle */}
                        <motion.div
                            className="absolute h-5 w-5 bg-white rounded-full shadow-md z-10 border-2 pointer-events-none"
                            style={{
                                borderColor: cat.value > 0 ? cat.color : '#ccc',
                                left: `calc(${(cat.value / 5) * 100}% - 10px)`
                            }}
                            animate={{
                                scale: cat.value > 0 ? 1.1 : 1
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}
