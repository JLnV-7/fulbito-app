// src/components/NotificationSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface NotificationPrefs {
    partidoInicio: boolean
    golFavorito: boolean
    resultadoProde: boolean
}

export function NotificationSettings() {
    const { user } = useAuth()
    const [prefs, setPrefs] = useState<NotificationPrefs>({
        partidoInicio: true,
        golFavorito: true,
        resultadoProde: true
    })
    const { isSupported, subscription, subscribeToPush, loading } = usePushNotifications()
    const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissionState(Notification.permission)
        }
    }, [])

    useEffect(() => {
        // Cargar preferencias guardadas
        if (user) {
            loadPrefs()
        }
    }, [user])

    const loadPrefs = async () => {
        try {
            const stored = localStorage.getItem(`notif_prefs_${user?.id}`)
            if (stored) {
                setPrefs(JSON.parse(stored))
            }
        } catch (err) {
            console.error('Error loading prefs:', err)
        }
    }

    const savePrefs = async (newPrefs: NotificationPrefs) => {
        setPrefs(newPrefs)
        localStorage.setItem(`notif_prefs_${user?.id}`, JSON.stringify(newPrefs))
    }

    const togglePref = (key: keyof NotificationPrefs) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] }
        savePrefs(newPrefs)
    }

    const handleSubscribe = async () => {
        // En móvil, es crucial pedir permiso dentro de un handler de evento de usuario
        const result = await Notification.requestPermission()
        setPermissionState(result)
        if (result === 'granted') {
            await subscribeToPush()
        }
    }

    if (!isSupported) {
        return (
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] p-6">
                <div className="text-center">
                    <span className="text-4xl mb-4 block">🔕</span>
                    <h3 className="font-bold mb-2 text-[var(--foreground)]">Notificaciones no soportadas</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        Tu navegador o dispositivo no soporta notificaciones push.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 bg-[var(--background)] border-b border-[var(--card-border)]">
                <h3 className="font-bold flex items-center gap-2 text-[var(--foreground)]">
                    <span>🔔</span> Notificaciones
                </h3>
            </div>

            <div className="p-5 space-y-4">
                {/* Estado del permiso */}
                {permissionState === 'denied' ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                        <p className="text-sm mb-2 text-red-500 font-medium">
                            🚫 Notificaciones bloqueadas
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Tenés que habilitarlas desde la configuración de tu navegador o celular.
                        </p>
                    </div>
                ) : !subscription ? (
                    <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-xl p-4 text-center">
                        <p className="text-sm mb-3 text-[var(--foreground)]">
                            📢 Activa las notificaciones para recibir alertas de partidos
                        </p>
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="bg-[#ff6b6b] text-white px-4 py-2 rounded-lg font-bold text-sm
                                        hover:bg-[#ee5a5a] transition-colors disabled:opacity-50 shadow-lg"
                        >
                            {loading ? 'Activando...' : 'Activar Notificaciones'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Preferencias */}
                        <div className="space-y-3">
                            <ToggleOption
                                icon="⚽"
                                label="Inicio de partido"
                                description="Avisarte cuando arranca un partido que pronosticaste"
                                enabled={prefs.partidoInicio}
                                onToggle={() => togglePref('partidoInicio')}
                            />
                            <ToggleOption
                                icon="❤️"
                                label="Gol de tu equipo favorito"
                                description="Notificación instantánea cuando tu equipo hace un gol"
                                enabled={prefs.golFavorito}
                                onToggle={() => togglePref('golFavorito')}
                            />
                            <ToggleOption
                                icon="🎯"
                                label="Resultado del prode"
                                description="Saber cuántos puntos ganaste al finalizar el partido"
                                enabled={prefs.resultadoProde}
                                onToggle={() => togglePref('resultadoProde')}
                            />
                        </div>

                        {/* Estado activo */}
                        <div className="pt-3 border-t border-[var(--card-border)]">
                            <p className="text-xs text-[#10b981] flex items-center gap-2 font-medium">
                                <span className="w-2 h-2 bg-[#10b981] rounded-full animate-pulse"></span>
                                Notificaciones activas
                            </p>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    )
}

function ToggleOption({
    icon,
    label,
    description,
    enabled,
    onToggle
}: {
    icon: string
    label: string
    description: string
    enabled: boolean
    onToggle: () => void
}) {
    return (
        <div
            onClick={onToggle}
            className="flex items-center justify-between p-3 bg-[var(--background)] rounded-xl cursor-pointer
                       hover:bg-[var(--background)]/70 transition-colors"
        >
            <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{description}</p>
                </div>
            </div>
            <div className={`w-12 h-7 rounded-full p-1 transition-colors ${enabled ? 'bg-[#10b981]' : 'bg-[var(--card-border)]'}`}>
                <motion.div
                    animate={{ x: enabled ? 20 : 0 }}
                    className="w-5 h-5 bg-white rounded-full shadow-md"
                />
            </div>
        </div>
    )
}
