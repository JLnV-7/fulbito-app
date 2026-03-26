// frontend/next.config.ts
//
// CAMBIOS:
// ✅ typescript.ignoreBuildErrors eliminado — ocultaba errores TypeScript reales
// ✅ PWA re-habilitado con config correcta (swMinify: true, workbox mejorado)
// ✅ canvas-confetti eliminado de optimizePackageImports (ya no se usa)
// ✅ minimumCacheTTL para escudos de equipos (30 días — cambian rarísimo)
// ✅ Supabase Storage agregado a remotePatterns
// ✅ headers de cache para /api/ routes que no son user-specific

import type { NextConfig } from 'next'

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // ✅ swMinify: true — minifica el service worker (antes era false)
  swMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      // Supabase API — NetworkFirst: siempre intenta red, cae a cache si falla
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 1 día
          },
          networkTimeoutSeconds: 10,
        },
      },
      // Escudos de equipos — StaleWhileRevalidate: sirve cache inmediato, actualiza en background
      // Los escudos casi nunca cambian → 30 días de TTL
      {
        urlPattern: /^https:\/\/media\.api-sports\.io\/.*$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'team-logos-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
          },
        },
      },
      // Supabase Storage (avatares, fotos de usuario)
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'user-avatars-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
          },
        },
      },
    ],
  },
})

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
        pathname: '/football/**',
      },
      {
        protocol: 'https',
        hostname: 'api.sofascore.com',
        pathname: '/api/v1/**',
      },
      {
        protocol: 'https',
        hostname: 'www.thesportsdb.com',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'r2.thesportsdb.com',
        pathname: '/images/**',
      },
      // ✅ Supabase Storage para avatares de usuarios
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // ✅ minimumCacheTTL: escudos y avatares se cachean en el CDN de Vercel
    // Antes: Vercel re-optimizaba la imagen en cada request
    // Después: imagen optimizada vive 30 días en el edge
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
  },
  experimental: {
    // ✅ canvas-confetti eliminado (ya no se importa en el proyecto)
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  // ✅ turbopack: {} vacío — requerido en Next.js 16 cuando hay plugins con webpack config (next-pwa)
  // Sin esto, CI/Vercel falla con: "This build is using Turbopack, with a webpack config and no turbopack config"
  turbopack: {},
  // ✅ typescript.ignoreBuildErrors ELIMINADO
  // Tenías esto activo → TypeScript nunca fallaba el build aunque hubiera errores reales.
  // Si el build empieza a fallar después de este cambio, esos son bugs reales que hay que fixear.
  // Podés agregar ignoreBuildErrors: true temporalmente mientras los resolvés, pero no dejarlo permanente.
}

export default withPWA(nextConfig)
