// src/components/NavBar.tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const [showMore, setShowMore] = useState(false)

  const isActive = (path: string) => pathname === path

  const moreOptions = [
    { path: '/buscar', icon: '🔍', label: 'Buscar', color: '#ff6b6b' },
    { path: '/grupos', icon: '🤝', label: 'Grupos', color: '#EC4899' },
    { path: '/historial', icon: '📜', label: 'Historial', color: '#6366f1' },
    { path: '/feed', icon: '🎬', label: 'Reseñas', color: '#f59e0b' },
  ]

  return (
    <>
      {/* Overlay cuando el menú está abierto */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMore(false)}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Menú expandido */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="md:hidden fixed bottom-20 left-4 right-4 
                       bg-[var(--card-bg)] border border-[var(--card-border)]
                       rounded-2xl p-4 z-50 shadow-xl"
          >
            <div className="grid grid-cols-3 gap-3">
              {moreOptions.map((option) => (
                <button
                  key={option.path}
                  onClick={() => {
                    router.push(option.path)
                    setShowMore(false)
                  }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all
                    ${isActive(option.path)
                      ? 'bg-[var(--background)]'
                      : 'hover:bg-[var(--background)]'
                    }`}
                  style={{ color: isActive(option.path) ? option.color : undefined }}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className="text-[10px] font-bold">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NavBar principal */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 
                      glass
                      border-t px-2 py-3 flex justify-around items-center z-50">
        <button
          onClick={() => router.push('/')}
          className={`flex flex-col items-center gap-1 transition-all ${isActive('/')
            ? 'text-[#ff6b6b] scale-105 nav-active-dot'
            : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
        >
          <span className="text-xl">⚽</span>
          <span className="text-[10px] font-medium">Partidos</span>
        </button>

        <button
          onClick={() => router.push('/prode')}
          className={`flex flex-col items-center gap-1 transition-all ${isActive('/prode')
            ? 'text-[#10b981] scale-105 nav-active-dot'
            : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
        >
          <span className="text-xl">🎯</span>
          <span className="text-[10px] font-medium">Prode</span>
        </button>

        <button
          onClick={() => router.push('/ranking')}
          className={`flex flex-col items-center gap-1 transition-all ${isActive('/ranking')
            ? 'text-[#ffd700] scale-105 nav-active-dot'
            : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
        >
          <span className="text-xl">🏆</span>
          <span className="text-[10px] font-medium">Ranking</span>
        </button>

        {/* Botón MÁS */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center gap-1 transition-all ${showMore
            ? 'text-[#ff6b6b] scale-105'
            : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
        >
          <motion.span
            className="text-xl"
            animate={{ rotate: showMore ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ➕
          </motion.span>
          <span className="text-[10px] font-medium">Más</span>
        </button>

        <button
          onClick={() => router.push(user ? '/perfil' : '/login')}
          className={`flex flex-col items-center gap-1 transition-all ${isActive('/perfil') || isActive('/login')
            ? 'text-[#ff6b6b] scale-105 nav-active-dot'
            : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'
            }`}
        >
          <span className="text-xl">{user ? '👤' : '🔐'}</span>
          <span className="text-[10px] font-medium">{user ? 'Perfil' : 'Login'}</span>
        </button>
      </nav>
    </>
  )
}