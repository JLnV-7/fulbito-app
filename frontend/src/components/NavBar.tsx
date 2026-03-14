// src/components/NavBar.tsx
'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback } from '@/lib/helpers'
import { useLanguage } from '@/contexts/LanguageContext'

export function NavBar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useLanguage()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { path: '/', icon: '🏠', activeIcon: '⚽', label: t('nav.home'), defaultColor: 'var(--text-muted)', activeColor: 'var(--accent)' },
    { path: '/prode', icon: '🎯', activeIcon: '🎯', label: t('nav.prode'), defaultColor: 'var(--text-muted)', activeColor: 'var(--accent-green)' },
    { path: '/ranking', icon: '🏆', activeIcon: '🏆', label: t('nav.ranking'), defaultColor: 'var(--text-muted)', activeColor: 'var(--accent-yellow)' },
    { path: '/comunidad', icon: '💬', activeIcon: '🤝', label: t('nav.community'), defaultColor: 'var(--text-muted)', activeColor: 'var(--accent-blue)' },
    { path: '/perfil', icon: '👤', activeIcon: '👤', label: t('nav.profile'), defaultColor: 'var(--text-muted)', activeColor: 'var(--accent-blue)', authRequired: true }
  ]

  return (
    <>

      {/* NavBar Clásica (Fixed Bottom Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0
                        bg-[var(--card-bg)] border-t border-[var(--card-border)]
                        flex justify-around items-stretch z-50 h-16">
        {navItems.map((item) => {
          const active = isActive(item.path) || (item.path === '/' && pathname?.startsWith('/partido/'))
          return (
            <button
              key={item.path}
              onClick={() => {
                hapticFeedback(10) // Light native vibration tap
                if (item.path === '/perfil') {
                  // Force a hard navigation bypassing Next.js cache and triggering a full page reload for PWA Cache Bust
                  window.location.href = `/perfil?_cb=${Date.now()}`
                } else {
                  router.push(item.authRequired && !user ? '/login' : item.path)
                }
              }}
              className="relative flex-1 flex flex-col items-center justify-center transition-all outline-none"
              style={{
                backgroundColor: 'transparent',
              }}
            >
                <div className="flex flex-col items-center justify-center gap-0.5 transition-all duration-300"
                     style={{ color: active ? item.activeColor : item.defaultColor }}>
                    <motion.div
                        animate={{ scale: active ? 1.1 : 1 }}
                        className="text-[18px] leading-none"
                    >
                        {active ? item.activeIcon : item.icon}
                    </motion.div>
                    <span className={`text-[9px] font-black tracking-tight transition-opacity duration-200
                        ${active ? 'opacity-100' : 'opacity-40'}`}>
                        {item.label}
                    </span>
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