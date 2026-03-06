'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react'

export function PushDebug() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [error, setError] = useState('')

    const sendTestNotification = async (type: 'test' | 'profile' | 'match') => {
        if (!user) return

        setLoading(true)
        setStatus('idle')
        setError('')

        const data: any = {
            userId: user.id,
            title: '⚽ FutLog Debug',
            message: `Esta es una notificación de prueba de tipo: ${type}`,
            type: type
        }

        if (type === 'profile') {
            data.url = `/perfil/${user.id}`
            data.message = '¡Alguien te empezó a seguir! (Prueba)'
        } else if (type === 'match') {
            data.url = '/partido/debug' // Placeholder
            data.message = '¡GOL en el partido que estás siguiendo! (Prueba)'
        }

        try {
            const res = await fetch('/api/push/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Error al enviar')

            setStatus('success')
        } catch (err: any) {
            console.error(err)
            setStatus('error')
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!user) return null

    return (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-5 mt-4">
            <h3 className="font-bold flex items-center gap-2 text-sm text-[var(--foreground)] mb-4">
                <Bell size={16} className="text-[var(--accent)]" /> Panel de Debug: Notificaciones
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                    onClick={() => sendTestNotification('test')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-medium hover:border-[var(--accent)] transition-all"
                >
                    <Send size={12} /> Test Simple
                </button>
                <button
                    onClick={() => sendTestNotification('profile')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-medium hover:border-[var(--accent)] transition-all"
                >
                    <Send size={12} /> Test Perfil
                </button>
                <button
                    onClick={() => sendTestNotification('match')}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--background)] border border-[var(--card-border)] rounded-xl text-xs font-medium hover:border-[var(--accent)] transition-all"
                >
                    <Send size={12} /> Test Partido
                </button>
            </div>

            {status === 'success' && (
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-emerald-500 mt-3 flex items-center gap-1"
                >
                    <CheckCircle2 size={10} /> Notificación enviada correctamente.
                </motion.p>
            )}

            {status === 'error' && (
                <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-red-500 mt-3 flex items-center gap-1"
                >
                    <AlertCircle size={10} /> {error}
                </motion.p>
            )}

            <p className="text-[10px] text-[var(--text-muted)] mt-4 italic">
                Nota: Requiere `ONESIGNAL_REST_API_KEY` en variables de entorno para funcionar.
            </p>
        </div>
    )
}
