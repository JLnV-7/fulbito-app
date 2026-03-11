// src/components/ShareableCard.tsx
'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toPng } from 'html-to-image'

interface ShareableCardProps {
    children: React.ReactNode
    title?: string
    filename?: string
}

export function ShareableCard({ children, title = 'Stats', filename = 'FutLog-stats' }: ShareableCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isCapturing, setIsCapturing] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const captureImage = async () => {
        if (!cardRef.current) return null

        setIsCapturing(true)
        try {
            const watermark = cardRef.current.querySelector('.share-watermark') as HTMLElement
            if (watermark) watermark.style.display = 'flex'

            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 2,
                style: { margin: '0' }
            })

            if (watermark) watermark.style.display = 'none'

            return dataUrl
        } catch (error) {
            console.error('Error capturing image:', error)
            return null
        } finally {
            setIsCapturing(false)
        }
    }

    const downloadImage = async () => {
        const dataUrl = await captureImage()
        if (!dataUrl) return

        const link = document.createElement('a')
        link.download = `${filename}.png`
        link.href = dataUrl
        link.click()

        setShowMenu(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
    }

    const shareImage = async () => {
        const dataUrl = await captureImage()
        if (!dataUrl) return

        try {
            const blob = await (await fetch(dataUrl)).blob()
            const file = new File([blob], `${filename}.png`, { type: 'image/png' })

            await navigator.share({
                title: `FutLog - ${title}`,
                text: '¡Mirá las stats en FutLog! ⚽🔥',
                files: [file]
            })
        } catch (error) {
            console.error('Error sharing:', error)
            // Fallback to download
            await downloadImage()
        }
        setShowMenu(false)
    }

    const copyToClipboard = async () => {
        const dataUrl = await captureImage()
        if (!dataUrl) return

        try {
            const blob = await (await fetch(dataUrl)).blob()
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ])
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2000)
        } catch (error) {
            console.error('Error copying to clipboard:', error)
        }
        setShowMenu(false)
    }

    return (
        <div className="relative group">
            {/* Card content to capture */}
            <div ref={cardRef} className="bg-[var(--card-bg)] p-1" style={{ borderRadius: 'var(--radius)' }}>
                {children}

                {/* Watermark — hidden by default, shown during capture via onclone */}
                <div className="hidden justify-between items-center px-4 py-2 border-t border-[var(--card-border)] border-dashed share-watermark">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">⚽</span>
                        <span className="text-[10px] font-black capitalize tracking-tighter text-[var(--text-muted)]">FutLog App</span>
                    </div>
                    <span className="text-[10px] font-black capitalize tracking-widest text-[var(--text-muted)]">FutLog.app</span>
                </div>
            </div>

            {/* Share button — subtle, appears on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-6 h-6 bg-[var(--background)]/70 backdrop-blur-sm hover:bg-[var(--card-border)] 
                             flex items-center justify-center rounded-full
                             transition-all border border-[var(--card-border)] shadow-sm"
                    title="Compartir"
                >
                    <span className="text-[10px]">📤</span>
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute right-0 top-10 bg-[var(--card-bg)] border border-[var(--card-border)]
                                     shadow-xl overflow-hidden min-w-[140px] z-50"
                            style={{ borderRadius: 'var(--radius)' }}
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
                        className="absolute inset-0 bg-black/50 flex items-center justify-center"
                        style={{ borderRadius: 'var(--radius)' }}
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
                                 bg-[#16a34a] text-white px-4 py-2 text-sm font-black capitalize tracking-widest
                                 shadow-lg"
                        style={{ borderRadius: 'var(--radius)' }}
                    >
                        ✓ ¡Hecho!
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
