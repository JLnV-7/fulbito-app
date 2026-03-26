// src/components/NavBar.tsx
//
// CAMBIOS:
// ✅ <style dangerouslySetInnerHTML> ELIMINADO
//    Antes: se creaba un nuevo <style> tag en el DOM en CADA render de NavBar
//    Forzaba un recalculo de estilos del browser en cada navegación
//    Movido a globals.css (ver abajo)
// ✅ useState eliminado — nunca se usó en este componente

'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth }                from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { hapticFeedback }         from '@/lib/helpers'
import { useLanguage }            from '@/contexts/LanguageContext'

export function NavBar() {
  const router   = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { t }    = useLanguage()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { path: '/',          icon: '🏠', activeIcon: '⚽', label: t('nav.home'),      activeColor: 'var(--accent)' },
    { path: '/prode',     icon: '🎯', activeIcon: '🎯', label: t('nav.prode'),     activeColor: 'var(--accent-green)' },
    { path: '/ranking',   icon: '🏆', activeIcon: '🏆', label: t('nav.ranking'),   activeColor: 'var(--accent-yellow)' },
    { path: '/comunidad', icon: '💬', activeIcon: '🤝', label: t('nav.community'), activeColor: 'var(--accent-blue)' },
    { path: '/perfil',    icon: '👤', activeIcon: '👤', label: t('nav.profile'),   activeColor: 'var(--accent-blue)', authRequired: true },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0
                    bg-[var(--card-bg)] border-t border-[var(--card-border)]
                    flex justify-around items-stretch z-50 h-16">
      {navItems.map((item) => {
        const active = isActive(item.path) || (item.path === '/' && pathname?.startsWith('/partido/'))
        return (
          <button
            key={item.path}
            onClick={() => {
              hapticFeedback(10)
              router.push(item.authRequired && !user ? '/login' : item.path)
            }}
            className="relative flex-1 flex flex-col items-center justify-center transition-all outline-none"
          >
            <div
              className="flex items-center gap-2 transition-all duration-300"
              style={{ color: active ? item.activeColor : 'var(--text-muted)' }}
            >
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                className="text-[18px] leading-none"
              >
                {active ? item.activeIcon : item.icon}
              </motion.div>

              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[9px] font-black tracking-tight"
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
  )
}

// ─── AGREGAR EN globals.css ────────────────────────────────────────────────
//
// .pb-safe {
//   padding-bottom: calc(max(0.75rem, env(safe-area-inset-bottom)) + 5rem);
// }
//
// ──────────────────────────────────────────────────────────────────────────
