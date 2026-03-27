// src/hooks/usePWAInstall.ts
'use client'

import { useState, useEffect } from 'react'

interface UsePWAInstallReturn {
    canInstall: boolean        // true si el browser tiene el prompt listo
    isInstalled: boolean       // true si ya está corriendo como PWA
    promptInstall: () => Promise<boolean>  // llama al prompt nativo, retorna si aceptó
    dismiss: () => void        // el usuario lo cerró — no volver a mostrar
    isDismissed: boolean
}

const STORAGE_KEY = 'futlog-pwa-dismissed'

export function usePWAInstall(): UsePWAInstallReturn {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [canInstall, setCanInstall] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        // Ya está instalada como PWA
        const standaloneMode =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true

        if (standaloneMode) {
            setIsInstalled(true)
            return
        }

        // El usuario ya cerró el banner antes
        const dismissed = localStorage.getItem(STORAGE_KEY)
        if (dismissed) {
            setIsDismissed(true)
            return
        }

        // Capturar el evento nativo del browser
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setCanInstall(true)
        }

        window.addEventListener('beforeinstallprompt', handler)

        // Si ya está instalada (appinstalled)
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true)
            setCanInstall(false)
            setDeferredPrompt(null)
        })

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const promptInstall = async (): Promise<boolean> => {
        if (!deferredPrompt) return false
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        setDeferredPrompt(null)
        setCanInstall(false)
        return outcome === 'accepted'
    }

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true')
        setIsDismissed(true)
        setCanInstall(false)
    }

    return { canInstall, isInstalled, promptInstall, dismiss, isDismissed }
}
