import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { toPng } from 'html-to-image'

interface AutoShareModalProps {
    isOpen: boolean
    onClose: () => void
    type: 'prode_exact' | 'badge_unlock'
    title: string
    subtitle: string
    achievementData: {
        badgeIcon?: string
        badgeName?: string
        matchDetails?: string
        pointsIcon?: string
        pointsText?: string
    }
}

export function AutoShareModal({ isOpen, onClose, type, title, subtitle, achievementData }: AutoShareModalProps) {
    const cardRef = useRef<HTMLDivElement>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedImage, setGeneratedImage] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            setGeneratedImage(null) // Reset image on open
            // Short delay to ensure DOM is fully rendered with animations
            const timer = setTimeout(() => {
                generateImage()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const generateImage = async () => {
        if (!cardRef.current) return

        try {
            setIsGenerating(true)
            const imgData = await toPng(cardRef.current, {
                pixelRatio: 2, // High resolution
                backgroundColor: '#0f172a', // force dark background for consistent share cards
                style: { margin: '0' }
            })

            setGeneratedImage(imgData)
        } catch (error) {
            console.error('Error generating share preview:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleNativeShare = async () => {
        const shareData = {
            title: '¡Mirá mi logro en FutLog!',
            text: subtitle,
            url: window.location.origin
        }

        if (navigator.share && generatedImage) {
            try {
                // Convert base64 to File for native sharing
                const res = await fetch(generatedImage)
                const blob = await res.blob()
                const file = new File([blob], 'futlog_achievement.png', { type: 'image/png' })

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        ...shareData,
                        files: [file]
                    })
                } else {
                    // Fallback to text link share
                    await navigator.share(shareData)
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Error sharing:', err)
                }
            }
        } else {
            // Fallback clipboard
            navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
            alert('Enlace copiado al portapapeles')
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[var(--card-bg)] rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-[var(--card-border)] relative"
                    >
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center text-white/70 hover:text-white z-20"
                        >
                            ✕
                        </button>

                        {/* Hidden preview structure for html2canvas generation */}
                        {!generatedImage && (
                            <div
                                ref={cardRef}
                                className="absolute top-[-9999px] left-[-9999px] w-[400px] h-[500px] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 flex flex-col items-center justify-center text-white text-center rounded-3xl border border-[#334155]"
                            >
                                <div className="text-6xl mb-4">
                                    {type === 'badge_unlock' ? achievementData.badgeIcon : '🎯'}
                                </div>
                                <h2 className="text-3xl font-black mb-2 leading-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                                    {title}
                                </h2>
                                <p className="text-lg opacity-80 font-medium mb-8 px-4">
                                    {subtitle}
                                </p>

                                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 w-full border border-white/10">
                                    {type === 'prode_exact' && (
                                        <>
                                            <p className="text-sm font-bold opacity-60 capitalize mb-2">Partido</p>
                                            <p className="font-bold text-xl">{achievementData.matchDetails}</p>
                                            <div className="mt-4 flex justify-center items-center gap-2 text-emerald-400 font-bold bg-emerald-400/10 py-2 rounded-xl">
                                                <span>+</span>{achievementData.pointsText} PTS
                                            </div>
                                        </>
                                    )}
                                    {type === 'badge_unlock' && (
                                        <>
                                            <p className="text-sm font-bold opacity-60 capitalize mb-2">Nueva Insignia</p>
                                            <p className="font-bold text-2xl text-amber-400">{achievementData.badgeName}</p>
                                        </>
                                    )}
                                </div>

                                <div className="mt-auto pt-8 flex items-center justify-center gap-3 w-full opacity-60">
                                    <span className="text-emerald-500 font-black text-xl">FutLog</span>
                                </div>
                            </div>
                        )}

                        <div className="p-6 text-center">
                            {/* Visual Header */}
                            <div className="mb-6 relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] to-transparent z-10 bottom-0 top-1/2" />
                                {generatedImage ? (
                                    <img
                                        src={generatedImage}
                                        alt="Tu logro"
                                        className="w-full h-auto rounded-xl shadow-lg border border-[var(--card-border)]"
                                    />
                                ) : (
                                    <div className="w-full aspect-[4/5] bg-[var(--hover-bg)] animate-pulse rounded-xl flex items-center justify-center border border-[var(--card-border)]">
                                        <div className="text-sm text-[var(--text-muted)] font-bold">
                                            Generando imagen...
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-black mb-2">{title}</h3>
                            <p className="text-sm text-[var(--text-muted)] mb-6">
                                {subtitle}
                            </p>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleNativeShare}
                                    fullWidth
                                    disabled={!generatedImage || isGenerating}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 border-none flex items-center justify-center gap-2"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                                    Compartir Logro
                                </Button>
                                <Button
                                    onClick={onClose}
                                    variant="outline"
                                    fullWidth
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
