// frontend/src/app/layout.tsx
//
// CAMBIOS:
// ✅ geistMono eliminado — se cargaba pero nunca se usaba en globals.css ni en body
//    Ahorrás ~30-40KB de fuente en el initial page load
// ✅ themeColor adaptativo dark/light — antes solo tenía el color del tema claro
// ✅ Script de SW cleanup movido a Strategy="afterInteractive" pattern
//    (inline script en body es render-blocking en algunos browsers)
// ✅ Eliminado maximumScale:1 / userScalable:false — bloquea el zoom de accesibilidad
// ✅ Agregado display: 'swap' explícito en la fuente (next/font ya lo hace por default
//    pero es buena práctica dejarlo explícito para Lighthouse)
// ✅ Agregados meta tags para iOS PWA que faltaban

import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import Link from 'next/link'
import Script from 'next/script'
import { LayoutClientWrapper } from '@/components/LayoutClientWrapper'
import './globals.css'

// ✅ Solo Geist Sans — Mono eliminado (no se usaba, +30KB en FOUT)
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  // display: 'swap' es el default de next/font pero lo dejamos explícito
  display: 'swap',
  // Preload solo los pesos que realmente usás (bold + black según el design system)
  weight: ['400', '700', '900'],
})

export const metadata: Metadata = {
  title: {
    default: 'FutLog - Tu Letterboxd del Fútbol ⚽',
    template: '%s | FutLog',
  },
  description:
    'Puntuá partidos, logueá tu experiencia, votá figuras, competí en el prode y compartí reseñas con la comunidad.',
  manifest: '/manifest.json',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || 'https://futlog.app'
  ),
  openGraph: {
    title: 'FutLog - Tu Letterboxd del Fútbol ⚽',
    description:
      'Puntuá partidos, logueá tu experiencia, votá figuras y compartí reseñas.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'FutLog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FutLog - Tu Letterboxd del Fútbol',
    description:
      'Puntuá partidos, logueá tu experiencia, votá figuras y compartí reseñas.',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FutLog',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport: Viewport = {
  // ✅ themeColor adaptativo: antes solo '#F5F5F5' (light hardcodeado)
  // Ahora el browser adapta la barra de estado según el tema del sistema
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f2f5' },
    { media: '(prefers-color-scheme: dark)',  color: '#111111' },
  ],
  width: 'device-width',
  initialScale: 1,
  // ✅ maximumScale y userScalable eliminados — bloqueaban el zoom de accesibilidad
  // Si necesitás evitar zoom en inputs específicos, hacelo con font-size: 16px en esos inputs
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* ✅ iOS PWA: color de barra de estado */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <LayoutClientWrapper>
          {children}
          <footer className="text-center py-6 text-[var(--text-muted)] text-sm pb-28 md:pb-8 border-t border-[var(--card-border)] mt-8 bg-[var(--background)]">
            <div className="flex justify-center flex-wrap gap-4 font-bold">
              <Link
                href="/privacy"
                className="hover:text-[var(--accent)] hover:underline transition-colors"
              >
                Privacidad
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                className="hover:text-[var(--accent)] hover:underline transition-colors"
              >
                Términos
              </Link>
              <span>•</span>
              <Link
                href="/sources"
                className="hover:text-[var(--accent)] hover:underline transition-colors"
              >
                Fuentes de datos
              </Link>
            </div>
            <p className="text-[10px] mt-4 opacity-50">
              FutLog Beta © {new Date().getFullYear()}
            </p>
          </footer>
        </LayoutClientWrapper>

        {/*
          ✅ Service Worker cleanup via next/script Strategy="afterInteractive"
          Antes: inline <script> en body → render-blocking en algunos browsers
          Después: corre después del hydration, sin bloquear nada
          
          Nota: una vez que todos los usuarios hayan recibido este script
          y no queden SW viejos en circulación, podés eliminar este bloque
          y habilitar withPWA en next.config.ts para registrar el nuevo SW.
        */}
        <Script
          id="sw-cleanup"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations()
                  .then(registrations => registrations.forEach(r => r.unregister()))
                  .catch(() => {})
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
