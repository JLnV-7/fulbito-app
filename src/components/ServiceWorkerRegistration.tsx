// src/components/ServiceWorkerRegistration.tsx
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registrado:', registration.scope)
                })
                .catch((error) => {
                    console.log('Error registrando Service Worker:', error)
                })
        }
    }, [])

    return null
}
