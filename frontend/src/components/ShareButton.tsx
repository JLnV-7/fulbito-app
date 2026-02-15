// src/components/ShareButton.tsx
'use client'

import { useState, RefObject } from 'react'

interface ShareButtonProps {
    titulo: string
    texto: string
    url: string
    captureRef?: RefObject<HTMLDivElement | null>
}

export function ShareButton({ titulo, texto, url, captureRef }: ShareButtonProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [capturing, setCapturing] = useState(false)
    const [copied, setCopied] = useState(false)

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
            }
        } else {
            try {
                await navigator.clipboard.writeText(`${texto}\n${url}`)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (error) {
                console.error('Error copiando:', error)
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
            // Usar modern-screenshot en lugar de html2canvas
            const { domToPng } = await import('modern-screenshot')

            // Capturar el elemento
            const dataUrl = await domToPng(captureRef.current, {
                scale: 2,
                backgroundColor: '#1a1a1a',
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
            ctx.fillText('⚽ Fulbito', finalCanvas.width / 2, finalCanvas.height - footerHeight / 2)

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
            link.download = 'mi-votacion-fulbito.png'
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

    if (copied) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#10b981] text-white text-sm font-medium">
                <span>✅</span>
                <span>Enlace copiado</span>
            </div>
        )
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                disabled={capturing}
                className="
                    flex items-center gap-2 px-4 py-2 rounded-full
                    bg-[#242424] hover:bg-[#333333] border border-[#333333]
                    text-[#f5f5f5] text-sm font-medium
                    transition-all duration-200
                    disabled:opacity-50
                "
            >
                <span>{capturing ? '⏳' : '📤'}</span>
                <span>{capturing ? 'Generando...' : 'Compartir'}</span>
            </button>

            {showMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 bg-[#242424] border border-[#333333] 
                                    rounded-xl overflow-hidden shadow-xl z-50 min-w-[180px]">
                        <button
                            onClick={handleShareLink}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-[#333333] 
                                       transition-colors flex items-center gap-3"
                        >
                            <span className="text-lg">🔗</span>
                            <span>Compartir link</span>
                        </button>
                        {captureRef && (
                            <button
                                onClick={handleShareImage}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-[#333333] 
                                           transition-colors flex items-center gap-3 border-t border-[#333333]"
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
