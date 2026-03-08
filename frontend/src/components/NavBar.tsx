// src/components/NavBar.tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback } from '@/lib/helpers'

export function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { path: '/', icon: '🏠', activeIcon: '⚽', label: 'Inicio', defaultColor: 'var(--text-muted)', activeColor: 'var(--accent)' },
    { path: '/prode', icon: '🎯', activeIcon: '🎯', label: 'Prode', defaultColor: 'var(--text-muted)', activeColor: 'var(--accent-green)' },
    { path: '/ranking', icon: '🏆', activeIcon: '🏆', label: 'Ranking', defaultColor: 'var(--text-muted)', activeColor: 'var(--accent-yellow)' },
    { path: '/comunidad', icon: '💬', activeIcon: '🤝', label: 'Comunidad', defaultColor: 'var(--text-muted)', activeColor: '#8b5cf6' },
    { path: '/perfil', icon: '👤', activeIcon: '👤', label: 'Perfil', defaultColor: 'var(--text-muted)', activeColor: 'var(--accent-blue)', authRequired: true }
  ]

  return (
    <>

      {/* NavBar flotante tipo Píldora (iOS Tab Bar Style) */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[360px]
                        bg-[var(--card-bg)]/80 backdrop-blur-3xl border border-[var(--card-border)]/50 shadow-2xl
                        rounded-full px-2 py-2 flex justify-around items-center z-50">
        {navItems.map((item) => {
          const active = isActive(item.path) || (item.path === '/' && pathname?.startsWith('/partido/'))
          return (
            <button
              key={item.path}
              onClick={() => {
                hapticFeedback(10) // Light native vibration tap
                router.push(item.authRequired && !user ? '/login' : item.path)
              }}
              className="relative flex items-center justify-center transition-all outline-none py-1.5 px-3 rounded-full"
              style={{
                backgroundColor: active ? 'var(--card-bg)' : 'transparent',
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <div
                className="flex items-center gap-2 transition-all duration-300"
                style={{ color: active ? item.activeColor : item.defaultColor }}
              >
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="text-[20px] leading-none drop-shadow-sm"
                >
                  {active ? item.activeIcon : item.icon}
                </motion.div>

                {/* Etiqueta solo visible si está activa */}
                <AnimatePresence>
                  {active && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                      animate={{ opacity: 1, width: 'auto', marginLeft: 4 }}
                      exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                      className="text-[11px] font-black tracking-tight overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </button>
          )
        })}
      </nav>

      {/* Padding for env bottom safe area + pill offset */}
      <style dangerouslySetInnerHTML={{
        __html: `
            .pb-safe { padding-bottom: calc(max(0.75rem, env(safe-area-inset-bottom)) + 5rem); }
        `}} />
    </>
  )
}