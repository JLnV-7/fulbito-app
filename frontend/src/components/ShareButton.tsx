// src/components/ShareButton.tsx
'use client'

import { useState, RefObject } from 'react'
import { useToast } from '@/contexts/ToastContext'

interface ShareButtonProps {
    titulo: string
    texto: string
    url: string
    captureRef?: RefObject<HTMLDivElement | null>
    label?: string
}

export function ShareButton({ titulo, texto, url, captureRef, label = 'Compartir' }: ShareButtonProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [capturing, setCapturing] = useState(false)
    const { showToast } = useToast()

    const handleShareLink = async () => {
        setShowMenu(false)

        if (navigator.share) {
            try {
                await navigator.share({
                    title: titulo,
                    text: texto,
                    url: url
                })
            } catch (error) {
                console.log('Error compartiendo:', error)
                // Fallback si falla
                try {
                    await navigator.clipboard.writeText(`${texto}\n${url}`)
                    showToast('Enlace copiado al portapapeles', 'success')
                } catch (e) { console.error('Error fallback copiando:', e) }
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${texto}\n${url}`)
                showToast('Enlace copiado al portapapeles', 'success')
            } catch (error) {
                console.error('Error copiando:', error)
                showToast('Error al copiar el enlace.', 'error')
            }
        }
    }

    const handleShareImage = async () => {
        if (!captureRef?.current) {
            alert('No hay formación para capturar')
            return
        }

        setCapturing(true)
        setShowMenu(false)

        try {
            // Usar html-to-image para evitar crash de oklch
            const { toPng } = await import('html-to-image')

            // Capturar el elemento
            const dataUrl = await toPng(captureRef.current, {
                pixelRatio: 2,
                backgroundColor: '#1a1a1a',
                style: { margin: '0' }
            })

            // Crear imagen y canvas para agregar branding
            const img = new Image()
            img.src = dataUrl

            await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
            })

            // Crear canvas con branding
            const finalCanvas = document.createElement('canvas')
            const ctx = finalCanvas.getContext('2d')
            if (!ctx) throw new Error('No canvas context')

            const padding = 30
            const footerHeight = 50

            finalCanvas.width = img.width + padding * 2
            finalCanvas.height = img.height + padding * 2 + footerHeight

            // Fondo
            ctx.fillStyle = '#1a1a1a'
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

            // Imagen capturada
            ctx.drawImage(img, padding, padding)

            // Footer con branding
            ctx.fillStyle = '#242424'
            ctx.fillRect(0, finalCanvas.height - footerHeight, finalCanvas.width, footerHeight)

            ctx.font = 'bold 24px Arial, sans-serif'
            ctx.fillStyle = '#ff6b6b'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('⚽ FutLog', finalCanvas.width / 2, finalCanvas.height - footerHeight / 2)

            // Convertir a blob y descargar
            const blob = await new Promise<Blob>((resolve, reject) => {
                finalCanvas.toBlob(
                    (b) => b ? resolve(b) : reject(new Error('No blob')),
                    'image/png',
                    0.9
                )
            })

            // Descargar
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = 'mi-votacion-FutLog.png'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)

        } catch (error) {
            console.error('Error capturando:', error)
            alert('Error al crear la imagen')
        } finally {
            setCapturing(false)
        }
    }

    return (
        <div className="relative inline-block w-full">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={capturing}
                className="
                    flex items-center justify-center gap-2 px-4 py-2 rounded-full w-full
                    bg-[var(--card-bg)] hover:bg-[var(--hover-bg)] border border-[var(--card-border)]
                    text-[var(--foreground)] text-sm font-medium
                    transition-all duration-200
                    disabled:opacity-50 shadow-sm
                "
            >
                <span>{capturing ? '⏳' : '📤'}</span>
                <span>{capturing ? 'Generando...' : label}</span>
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] 
                                    rounded-xl overflow-hidden shadow-xl z-50 min-w-[180px]">
                        <button
                            onClick={handleShareLink}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--hover-bg)] 
                                       transition-colors flex items-center gap-3"
                        >
                            <span className="text-lg">🔗</span>
                            <span>Compartir link</span>
                        </button>
                        {captureRef && (
                            <button
                                onClick={handleShareImage}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-[var(--hover-bg)] 
                                            transition-colors flex items-center gap-3 border-t border-[var(--card-border)]"
                            >
                                <span className="text-lg">📸</span>
                                <span>Compartir imagen</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
