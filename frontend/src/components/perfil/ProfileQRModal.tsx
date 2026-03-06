import { motion, AnimatePresence } from 'framer-motion'
import { X, Share2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useToast } from '@/contexts/ToastContext'

interface ProfileQRModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    username: string
}

export function ProfileQRModal({ isOpen, onClose, userId, username }: ProfileQRModalProps) {
    const { showToast } = useToast()
    // Construimos la URL pública del perfil
    const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/perfil/${userId}` : `https://fulbitoo.app/perfil/${userId}`

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Perfil de ${username} en FutLog`,
                    text: `¡Sumate a mi FutLog con este QR y miremos fútbol juntos! ⚽`,
                    url: profileUrl,
                })
                showToast('¡Compartido con éxito!', 'success')
            } catch (err) {
                console.error(err)
            }
        } else {
            // Fallback
            navigator.clipboard.writeText(profileUrl)
            showToast('Link copiado al portapapeles', 'success')
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[var(--card-bg)] w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-[var(--card-border)] flex flex-col items-center text-center relative overflow-hidden"
                    >
                        {/* Decoración de fondo */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#10b981]/20 to-transparent pointer-events-none" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-[var(--background)] rounded-full text-[var(--text-muted)] hover:text-white transition-colors z-10"
                        >
                            <X size={18} />
                        </button>

                        <div className="w-16 h-16 bg-[#10b981]/20 text-[#10b981] rounded-2xl flex items-center justify-center mb-4 mt-2">
                            <span className="text-3xl">📱</span>
                        </div>

                        <h2 className="text-xl font-black mb-1 text-[var(--foreground)]">Escaneá para seguirme</h2>
                        <p className="text-sm text-[var(--text-muted)] mb-8 px-4">
                            Mostrale este código a tus amigos en la tribuna o en el picadito para que te sigan al toque.
                        </p>

                        <div className="bg-white p-4 rounded-2xl shadow-inner mb-8 transition-transform hover:scale-105">
                            <QRCodeSVG
                                value={profileUrl}
                                size={200}
                                level="H" // High error correction so it scans easily even if blurry
                                includeMargin={false}
                                fgColor="#000000"
                                bgColor="#ffffff"
                            />
                        </div>

                        <button
                            onClick={handleShare}
                            className="w-full flex items-center justify-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-[#10b981]/25 active:scale-95 text-sm"
                        >
                            <Share2 size={18} />
                            Compartir Link
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
