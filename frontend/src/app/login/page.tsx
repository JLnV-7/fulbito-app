// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)

      // Check for redirect URL in query params
      const params = new URLSearchParams(window.location.search)
      const redirectUrl = params.get('redirect') || '/'
      router.push(redirectUrl)
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(email, password)
      showToast('✅ Cuenta creada! Revisá tu email para confirmar.', 'success')
      setIsRegistering(false)
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Error al registrarse'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Error al iniciar con Google'
      setError(message)
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-3xl font-bold mb-2 text-[var(--foreground)]">FutLog</h1>
          <p className="text-[var(--text-muted)] text-sm">
            {isRegistering ? 'Creá tu cuenta y empezá a puntuar' : 'Tu Letterboxd del fútbol'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6 shadow-xl transition-colors duration-300">

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 py-3 rounded-xl font-semibold
                     border border-gray-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 transform duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {googleLoading ? 'Conectando...' : 'Continuar con Google'}
          </button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--card-border)]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[var(--card-bg)] text-[var(--text-muted)]">o con email</span>
            </div>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg
                         text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)]"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg
                           text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)] pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {isRegistering && (
                <p className="text-xs text-[var(--text-muted)] mt-1">Mínimo 6 caracteres</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 rounded-lg font-semibold
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200"
            >
              {loading
                ? (isRegistering ? 'Registrando...' : 'Iniciando...')
                : (isRegistering ? 'Registrarme' : 'Iniciar Sesión')
              }
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering)
                setError('')
              }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {isRegistering
                ? '¿Ya tenés cuenta? Iniciá sesión'
                : '¿No tenés cuenta? Registrate'}
            </button>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}