// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

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
      setError(err.message || 'Error al iniciar sesión')
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
      alert('✅ Cuenta creada! Revisá tu email para confirmar.')
      setIsRegistering(false)
    } catch (err: any) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Fulbito</h1>
          <p className="text-[#909090] text-sm">
            {isRegistering ? 'Creá tu cuenta para votar' : 'Iniciá sesión para votar'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#242424] rounded-2xl border border-[#333333] p-6">
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333333] rounded-lg
                         focus:outline-none focus:border-[#ff6b6b] transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] border border-[#333333] rounded-lg
                         focus:outline-none focus:border-[#ff6b6b] transition-colors"
                placeholder="••••••••"
              />
              {isRegistering && (
                <p className="text-xs text-[#909090] mt-1">Mínimo 6 caracteres</p>
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
              className="w-full bg-[#ff6b6b] hover:bg-[#ff5252] py-3 rounded-lg font-semibold
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="text-sm text-[#909090] hover:text-[#f5f5f5] transition-colors"
            >
              {isRegistering
                ? '¿Ya tenés cuenta? Iniciá sesión'
                : '¿No tenés cuenta? Registrate'}
            </button>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-[#909090] hover:text-[#f5f5f5] transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}