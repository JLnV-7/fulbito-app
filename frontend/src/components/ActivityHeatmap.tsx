// src/components/ActivityHeatmap.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

interface Props {
  userId: string
}

export function ActivityHeatmap({ userId }: Props) {
  const [activity, setActivity] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchActivity = async () => {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      const { data } = await supabase
        .from('match_logs')
        .select('watched_at')
        .eq('user_id', userId)
        .gte('watched_at', oneYearAgo.toISOString())

      if (data) {
        const counts: Record<string, number> = {}
        data.forEach(log => {
          const date = new Date(log.watched_at).toISOString().split('T')[0]
          counts[date] = (counts[date] || 0) + 1
        })
        setActivity(counts)
      }
      setLoading(false)
    }

    fetchActivity()
  }, [userId])

  const buildWeekGrid = () => {
    const grid: string[][] = []
    const today = new Date()
    
    // Start from 52 weeks ago
    const start = new Date(today)
    start.setDate(today.getDate() - (52 * 7))
    // Adjust to nearest Sunday
    start.setDate(start.getDate() - start.getDay())

    const current = new Date(start)
    for (let w = 0; w <= 52; w++) {
      const week: string[] = []
      for (let d = 0; d < 7; d++) {
        week.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
        if (current > today) break
      }
      grid.push(week)
      if (current > today) break
    }
    return grid
  }

  if (loading) return <div className="h-24 bg-[var(--card-bg)] animate-pulse rounded-2xl" />

  const grid = buildWeekGrid()

  const getColor = (count: number) => {
    if (count === 0) return 'var(--card-border)'
    if (count === 1) return '#166534' // green-800
    if (count <= 3) return '#22c55e' // green-500
    return '#4ade80' // green-400
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-6">
      <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-4 flex items-center gap-2">
        📊 Actividad de Visionado (Último año)
      </h3>
      <div className="overflow-x-auto no-scrollbar pb-2">
        <div className="flex gap-1 min-w-max">
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map(day => {
                const count = activity[day] || 0
                return (
                  <motion.div
                    key={day}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (wi * 0.01) }}
                    title={`${day}: ${count} partido${count !== 1 ? 's' : ''}`}
                    className="w-2.5 h-2.5 rounded-[2px] transition-colors hover:ring-1 hover:ring-[var(--accent)] cursor-help"
                    style={{ backgroundColor: getColor(count) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 text-[9px] font-bold text-[var(--text-muted)]">
        <span>Menos</span>
        <div className="flex gap-1">
          {[0, 1, 3, 5].map(v => (
            <div key={v} className="w-2 h-2 rounded-[1px]" style={{ backgroundColor: getColor(v) }} />
          ))}
        </div>
        <span>Más</span>
      </div>
    </div>
  )
}
