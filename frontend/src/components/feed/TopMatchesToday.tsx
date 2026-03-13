// src/components/feed/TopMatchesToday.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Trophy, MessageSquare, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface TrendingMatch {
  id: number
  local: string
  visitante: string
  count: number
}

export function TopMatchesToday() {
  const [trending, setTrending] = useState<TrendingMatch[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTrending = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Fetch logs from today to count discussions
      const { data, error } = await supabase
        .from('match_logs')
        .select('equipo_local, equipo_visitante, match_id')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) {
        const counts: Record<number, { local: string; visitante: string; count: number }> = {}
        data.forEach(log => {
          if (!log.match_id) return
          const id = Number(log.match_id)
          if (!counts[id]) {
            counts[id] = { local: log.equipo_local, visitante: log.equipo_visitante, count: 0 }
          }
          counts[id].count++
        })

        const sorted = Object.entries(counts)
          .map(([id, val]) => ({ id: Number(id), ...val }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)

        setTrending(sorted)
      }
      setLoading(false)
    }

    fetchTrending()
  }, [])

  if (loading) return (
    <div className="grid grid-cols-1 gap-2 mb-8">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-[var(--card-bg)] animate-pulse rounded-xl border border-[var(--card-border)]" />)}
    </div>
  )

  if (trending.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="p-1.5 bg-amber-500/10 rounded-lg">
          <TrendingUp size={16} className="text-amber-500" />
        </div>
        <h2 className="text-xs font-black uppercase tracking-widest italic">Tendencias de Hoy</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {trending.map((match, i) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link 
              href={`/partido/${match.id}`}
              className="group flex items-center justify-between p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl hover:border-[var(--accent)]/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex flex-col items-center justify-center w-8 h-8 rounded-full bg-[var(--background)] text-[10px] font-black text-[var(--text-muted)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate tracking-tighter">
                    {match.local} <span className="text-[var(--text-muted)] opacity-30 mx-1">vs</span> {match.visitante}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <MessageSquare size={10} className="text-[#6366f1]" />
                    <span className="text-[10px] font-bold text-[var(--text-muted)]">{match.count} reseñas hoy</span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function ChevronRight({ size, className }: { size: number; className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
