// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Eye, EyeOff, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
          <Button
            onClick={handleGoogleLogin}
            loading={googleLoading}
            variant="glass"
            fullWidth
            icon={Chrome}
            className="mb-4 bg-white/90 dark:bg-white/10 text-gray-800 dark:text-white border-gray-200 dark:border-white/10"
          >
            {googleLoading ? 'Conectando...' : 'Continuar con Google'}
          </Button>

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