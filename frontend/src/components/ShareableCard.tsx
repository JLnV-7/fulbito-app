// src/components/ShareableCard.tsx
'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import html2canvas from 'html2canvas'

interface ShareableCardProps {
    children: React.ReactNode
    title?: string
    filename?: string
}

export function ShareableCard({ children, title = 'Stats', filename = 'fulbito-stats' }: ShareableCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const captureImage = async () => {
        if (!cardRef.current) return null

        setIsCapturing(true)
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null, // Transparent/Inherit
                scale: 2, // Higher resolution
                useCORS: true,
                logging: false,
            })
            return canvas
        } catch (error) {
            console.error('Error capturing image:', error)
            return null
        } finally {
            setIsCapturing(false)
        }
    }

    const downloadImage = async () => {
        const canvas = await captureImage()
        if (!canvas) return

        const link = document.createElement('a')
        link.download = `${filename}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()

        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
        setShowMenu(false)
    }

    const shareImage = async () => {
        const canvas = await captureImage()
        if (!canvas) return

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return

                if (navigator.share) {
                    const file = new File([blob], `${filename}.png`, { type: 'image/png' })
                    await navigator.share({
                        title: `Fulbito - ${title}`,
                        text: '¡Mirá las stats en Fulbito! ⚽🔥',
                        files: [file]
                    })
                } else {
                    // Fallback: copy to clipboard
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ])
                    setShowSuccess(true)
                    setTimeout(() => setShowSuccess(false), 2000)
                }
            }, 'image/png')
        } catch (error) {
            console.error('Error sharing:', error)
            // Fallback to download
            await downloadImage()
        }
        setShowMenu(false)
    }

    const copyToClipboard = async () => {
        const canvas = await captureImage()
        if (!canvas) return

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ])
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 2000)
            }, 'image/png')
        } catch (error) {
            console.error('Error copying to clipboard:', error)
        }
        setShowMenu(false)
    }

    return (
        <div className="relative">
            {/* Card content to capture */}
            <div ref={cardRef} className="bg-[var(--card-bg)] p-1 rounded-2xl">
                {children}

                {/* Watermark for sharing */}
                <div className="mt-2 flex justify-between items-center px-4 py-2 opacity-60 grayscale">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚽</span>
                        <span className="text-xs font-bold text-[var(--text-muted)]">Fulbito App</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">fulbito.app</span>
                </div>
            </div>

            {/* Share button */}
            <div className="absolute top-3 right-3">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-8 h-8 bg-[var(--background)] hover:bg-[#ff6b6b] 
                             rounded-full flex items-center justify-center
                             transition-all hover:scale-110 border border-[var(--card-border)]"
                    title="Compartir"
                >
                    <span className="text-sm">📤</span>
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute right-0 top-10 bg-[var(--card-bg)] border border-[var(--card-border)]
                                     rounded-xl shadow-xl overflow-hidden min-w-[140px] z-50"
                        >
                            <button
                                onClick={shareImage}
                                disabled={isCapturing}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium 
                                         hover:bg-[var(--background)] transition-colors flex items-center gap-2"
                            >
                                <span>📱</span> Compartir
                            </button>
                            <button
                                onClick={downloadImage}
                                disabled={isCapturing}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium 
                                         hover:bg-[var(--background)] transition-colors flex items-center gap-2"
                            >
                                <span>💾</span> Descargar
                            </button>
                            <button
                                onClick={copyToClipboard}
                                disabled={isCapturing}
                                className="w-full px-4 py-2.5 text-left text-sm font-medium 
                                         hover:bg-[var(--background)] transition-colors flex items-center gap-2"
                            >
                                <span>📋</span> Copiar
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Loading overlay */}
            <AnimatePresence>
                {isCapturing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center"
                    >
                        <div className="text-center">
                            <span className="animate-spin text-2xl inline-block">⚽</span>
                            <p className="text-xs mt-2 text-white">Generando imagen...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Success toast */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute -bottom-12 left-1/2 -translate-x-1/2 
                                 bg-[#10b981] text-white px-4 py-2 rounded-full text-sm font-bold
                                 shadow-lg"
                    >
                        ✅ ¡Listo!
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close */}
            {showMenu && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                />
            )}
        </div>
    )
}
