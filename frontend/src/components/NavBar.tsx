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

      {/* NavBar principal de 5 tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 
                        glass
                        px-2 py-3 pb-safe flex justify-around items-center z-50">
        {navItems.map((item) => {
          const active = isActive(item.path) || (item.path === '/' && pathname?.startsWith('/partido/'))
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.authRequired && !user ? '/login' : item.path)}
              className="flex flex-col items-center gap-1.5 transition-all outline-none w-16"
              style={{ color: active ? item.activeColor : item.defaultColor }}
            >
              <motion.div
                animate={{ scale: active ? 1.15 : 1, y: active ? -2 : 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className="text-[22px] leading-none"
              >
                {active ? item.activeIcon : item.icon}
              </motion.div>
              <span className={`text-[10px] font-medium transition-opacity ${active ? 'opacity-100 font-bold' : 'opacity-70'}`}>
                {item.label}
              </span>
              {/* Indicador de activo (Puntito) */}
              {active && (
                <motion.div
                  layoutId="navIndicator"
                  className="w-1 h-1 rounded-full absolute bottom-1"
                  style={{ backgroundColor: item.activeColor }}
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* Padding for env bottom safe area */}
      <style dangerouslySetInnerHTML={{
        __html: `
            .pb-safe { padding-bottom: max(0.75rem, env(safe-area-inset-bottom)); }
        `}} />
    </>
  )
}