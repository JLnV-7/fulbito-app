// src/components/NotificationSettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { supabase } from '@/lib/supabase'

interface NotificationPrefs {
    partidoInicio: boolean
    golFavorito: boolean
    resultadoProde: boolean
    nuevosSeguidores: boolean
    insignias: boolean
    previa30m: boolean
}

export function NotificationSettings() {
    const { user } = useAuth()
    const [prefs, setPrefs] = useState<NotificationPrefs>({
        partidoInicio: true,
        golFavorito: true,
        resultadoProde: true,
        nuevosSeguidores: true,
        insignias: true,
        previa30m: true
    })
    const { isSupported, isOptedIn, subscribeToPush, loading } = usePushNotifications()
    const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermissionState(Notification.permission)
        }
    }, [])

    useEffect(() => {
        if (user) loadPrefs()
    }, [user])

    const loadPrefs = async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('notification_prefs')
                .eq('id', user.id)
                .single()

            if (data?.notification_prefs) {
                setPrefs({ ...prefs, ...data.notification_prefs })
            }
        } catch (err: any) {
            console.error('Error loading prefs:', err)
        }
    }

    const savePrefs = async (newPrefs: NotificationPrefs) => {
        setPrefs(newPrefs)
        if (!user) return

        const { error } = await supabase
            .from('profiles')
            .update({ notification_prefs: newPrefs })
            .eq('id', user.id)

        if (error) console.error('Error saving prefs:', error)
    }

    const togglePref = async (key: keyof NotificationPrefs) => {
        const newPrefs = { ...prefs, [key]: !prefs[key] }
        await savePrefs(newPrefs)
    }

    const handleSubscribe = async () => {
        await subscribeToPush()
        setPermissionState(Notification.permission)
    }

    if (!isSupported) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 mt-4" style={{ borderRadius: 'var(--radius)' }}>
                <div className="text-center">
                    <span className="text-3xl mb-4 block">🔕</span>
                    <h3 className="text-[10px] font-black capitalize tracking-widest mb-2 text-[var(--foreground)]">Notificaciones no soportadas</h3>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] capitalize">
                        Tu navegador o dispositivo no las soporta.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] mt-4 overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
            {/* Header */}
            <div className="px-5 py-3 bg-[var(--background)] border-b border-[var(--card-border)] border-dashed">
                <h3 className="text-[10px] font-black capitalize tracking-widest flex items-center gap-2 text-[var(--foreground)]">
                    <span>🔔</span> Notificaciones
                </h3>
            </div>

            <div className="p-5 space-y-4">
                {/* Estado del permiso */}
                {permissionState === 'denied' ? (
                    <div className="bg-red-500/5 border border-red-500/20 p-4 text-center" style={{ borderRadius: 'var(--radius)' }}>
                        <p className="text-[10px] mb-2 text-red-600 font-black capitalize">
                            🚫 Notificaciones bloqueadas
                        </p>
                        <p className="text-[9px] text-[var(--text-muted)] font-bold capitalize">
                            Habilitalas en la configuración de tu navegador.
                        </p>
                    </div>
                ) : !isOptedIn ? (
                    <div className="bg-[var(--background)] border border-[var(--card-border)] p-5 text-center relative overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
                        <p className="text-[10px] mb-3 font-black text-[var(--foreground)] capitalize relative z-10">
                            Activá alertas para no perderte nada 🏆
                        </p>
                        <button
                            onClick={handleSubscribe}
                            disabled={loading}
                            className="bg-[var(--foreground)] text-[var(--background)] px-5 py-2 font-black text-[10px] capitalize tracking-widest
                                        hover:bg-[var(--foreground)] transition-all disabled:opacity-50 relative z-10 w-full"
                            style={{ borderRadius: 'var(--radius)' }}
                        >
                            {loading ? 'Activando...' : '¡Activar ahora!'}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Preferencias */}
                        <div className="space-y-2">
                            <ToggleOption
                                icon="⚽"
                                label="Inicio de partido"
                                description="Al arrancar un partido pronosticado"
                                enabled={prefs.partidoInicio}
                                onToggle={() => togglePref('partidoInicio')}
                            />
                            <ToggleOption
                                icon="⏰"
                                label="La Previa"
                                description="Aviso 30 min antes (Equipo Favorito)"
                                enabled={prefs.previa30m}
                                onToggle={() => togglePref('previa30m')}
                            />
                            <ToggleOption
                                icon="❤️"
                                label="Goles en vivo"
                                description="Instantánea cuando hay goles"
                                enabled={prefs.golFavorito}
                                onToggle={() => togglePref('golFavorito')}
                            />
                            <ToggleOption
                                icon="👤"
                                label="Seguidores"
                                description="Cuando alguien te sigue"
                                enabled={prefs.nuevosSeguidores}
                                onToggle={() => togglePref('nuevosSeguidores')}
                            />
                            <ToggleOption
                                icon="🎖️"
                                label="Insignias"
                                description="Al desbloquear medallas"
                                enabled={prefs.insignias}
                                onToggle={() => togglePref('insignias')}
                            />
                            <ToggleOption
                                icon="🎯"
                                label="Prode"
                                description="Saber puntos al finalizar"
                                enabled={prefs.resultadoProde}
                                onToggle={() => togglePref('resultadoProde')}
                            />
                        </div>

                        {/* Estado activo */}
                        <div className="pt-3 border-t border-[var(--card-border)] border-dashed">
                            <p className="text-[9px] text-[#16a34a] flex items-center gap-2 font-black capitalize">
                                <span className="w-1.5 h-1.5 bg-[#16a34a] rounded-full"></span>
                                Notificaciones activas
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
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
            className="flex items-center justify-between p-3 bg-[var(--background)] border border-[var(--card-border)] cursor-pointer
                       hover:bg-[var(--hover-bg)] transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
        >
            <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <div>
                    <p className="font-black text-[10px] capitalize">{label}</p>
                    <p className="text-[9px] text-[var(--text-muted)] font-bold capitalize">{description}</p>
                </div>
            </div>
            <div className={`w-8 h-4 border border-[var(--card-border)] transition-colors relative ${enabled ? 'bg-[var(--foreground)]' : 'bg-[var(--background)]'}`}>
                <div className={`absolute top-0.5 w-2.5 h-2.5 bg-[var(--background)] border border-[var(--card-border)] transition-all ${enabled ? 'right-0.5' : 'left-0.5'}`} />
            </div>
        </div>
    )
}
