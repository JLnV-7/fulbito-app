// src/components/LayoutClientWrapper.tsx
//
// CAMBIOS:
// ✅ ServiceWorkerRegistration ELIMINADO — conflicto crítico con el script de layout.tsx
//    layout.tsx tiene un <Script> que desregistra TODOS los SWs en cada page load
//    LayoutClientWrapper tenía ServiceWorkerRegistration que los REGISTRA en cada page load
//    Resultado: registro → desregistro → registro → desregistro → PWA nunca funciona
//
//    Para reactivar la PWA:
//    1. Eliminá el script de SW cleanup en layout.tsx (ya fue para el deploy actual)
//    2. Reemplazá ServiceWorkerRegistration por el registro nativo de next-pwa (automático)
//    3. No necesitás registrar manualmente el SW — withPWA en next.config.ts lo hace solo
//
// ✅ <div> wrapper innecesario alrededor de ChallengesFAB eliminado

'use client'

import { ThemeProvider }            from '@/contexts/ThemeContext'
import { LanguageProvider }         from '@/contexts/LanguageContext'
import { AuthProvider }             from '@/contexts/AuthContext'
import { ToastProvider }            from '@/contexts/ToastContext'
import { ToastContainer }           from '@/components/Toast'
import { SplashScreen }             from '@/components/SplashScreen'
import { AutoShareListener }        from '@/components/AutoShareListener'
import { InstallPrompt }            from '@/components/InstallPrompt'
import { OnboardingModal }          from '@/components/OnboardingModal'
import { ChallengesFAB }            from '@/components/ChallengesFAB'
import { FeedbackModal }            from '@/components/FeedbackModal'
// ✅ ServiceWorkerRegistration eliminado — ver comentario arriba

export function LayoutClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <SplashScreen />
            {children}
            <ToastContainer />
            <AutoShareListener />
            <InstallPrompt />
            <OnboardingModal />
            <FeedbackModal />
            {/* ✅ <div> wrapper eliminado — era innecesario */}
            <ChallengesFAB />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
