'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// Keys handled inside function to support multiple env var names

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function usePushNotifications() {
    const { user } = useAuth()
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
        } catch (error) {
            console.error('Service Worker registration failed:', error)
        }
    }

    const subscribeToPush = async () => {
        if (!user) return alert('Debes iniciar sesión para activar notificaciones')

        // Configurable VAPID key
        const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!VAPID_KEY) return console.error('VAPID Key missing')

        setLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
            })

            setSubscription(sub)

            // Save to Supabase directly (RLS protected)
            const { endpoint, keys } = sub.toJSON()
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint: endpoint!,
                    p256dh: keys!.p256dh,
                    auth: keys!.auth
                }, { onConflict: 'user_id, endpoint' })

            if (error) throw error

            alert('✅ Notificaciones activadas!')
        } catch (error) {
            console.error('Failed to subscribe:', error)
            alert('Error al activar notificaciones. Puede que estén bloqueadas en tu navegador.')
        } finally {
            setLoading(false)
        }
    }

    return {
        isSupported,
        subscription,
        subscribeToPush,
        loading
    }
}
