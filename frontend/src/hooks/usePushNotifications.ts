'use client'

import { useState, useEffect } from 'react'
import OneSignal from 'react-onesignal'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export function usePushNotifications() {
    const { user } = useAuth()
    const router = useRouter()
    const [isSupported, setIsSupported] = useState(true)
    const [loading, setLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [isOptedIn, setIsOptedIn] = useState(false)

    useEffect(() => {
        const initOneSignal = async () => {
            try {
                if (!isInitialized) {
                    await OneSignal.init({
                        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '',
                        allowLocalhostAsSecureOrigin: true,
                        notifyButton: {
                            enable: false,
                            prenotify: false,
                            showCredit: false,
                            text: {
                                'tip.state.unsubscribed': 'Subscription Tip',
                            }
                        } as any,
                    })
                    setIsInitialized(true)

                    // Deep Linking: Click handler
                    OneSignal.Notifications.addEventListener('click', (event: any) => {
                        const data = event.notification.additionalData as any
                        if (data && data.url) {
                            router.push(data.url)
                        } else if (data && data.type) {
                            // Legacy or specific type handling
                            if (data.type === 'profile' && data.userId) {
                                router.push(`/perfil/${data.userId}`)
                            } else if (data.type === 'match' && data.matchId) {
                                router.push(`/partido/${data.matchId}`)
                            }
                        }
                    })

                    // Check opt-in status
                    const optedIn = OneSignal.User.PushSubscription.optedIn
                    setIsOptedIn(!!optedIn)

                    OneSignal.User.PushSubscription.addEventListener('change', (event) => {
                        setIsOptedIn(!!event.current.optedIn)
                    })
                }
            } catch (error) {
                console.error('Error inicializando OneSignal:', error)
            }
        }

        if (typeof window !== 'undefined') {
            initOneSignal()
        }
    }, [isInitialized, router])

    // Update OneSignal external user ID when user logs in
    useEffect(() => {
        if (isInitialized && user) {
            OneSignal.login(user.id).catch(console.error)
        } else if (isInitialized && !user) {
            OneSignal.logout().catch(console.error)
        }
    }, [user, isInitialized])

    const subscribeToPush = async () => {
        if (!user) {
            alert('Debes iniciar sesión para activar las notificaciones')
            return
        }

        if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
            console.error('Falta NEXT_PUBLIC_ONESIGNAL_APP_ID en variables de entorno')
            alert('Configuración de notificaciones incompleta en el servidor.')
            return
        }

        setLoading(true)
        try {
            await OneSignal.Slidedown.promptPush()

            if (OneSignal.User.PushSubscription.optedIn) {
                setIsOptedIn(true)
                const deviceToken = OneSignal.User.PushSubscription.id

                if (deviceToken) {
                    const { error } = await supabase
                        .from('user_notifications')
                        .upsert({
                            user_id: user.id,
                            device_token: deviceToken,
                            enabled: true
                        }, { onConflict: 'user_id, device_token' })

                    if (error) console.error('Error guardando token en DB:', error)
                }

                alert('✅ Notificaciones activadas. ¡No te vas a perder de nada!')
            } else {
                alert('Las notificaciones fueron bloqueadas o denegadas. Podés cambiarlo desde los ajustes de tu navegador.')
            }

        } catch (error) {
            console.error('Error al suscribir:', error)
            alert('Ocurrió un error al intentar activar las notificaciones.')
        } finally {
            setLoading(false)
        }
    }

    return {
        isSupported,
        isOptedIn,
        subscribeToPush,
        loading
    }
}
