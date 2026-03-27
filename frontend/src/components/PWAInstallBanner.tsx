// src/components/PWAInstallBanner.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share, PlusSquare } from 'lucide-react'
import { usePWAInstall } from '@/hooks/usePWAInstall'
import { hapticFeedback } from '@/lib/helpers'

export function PWAInstallBanner() {
    const { canInstall, isInstalled, isDismissed, promptInstall, dismiss, isIOS } = usePWAInstall()

    // Mostrar si: no instalada, no cerrada, y (soporta prompt native O es iOS)
    const show = (canInstall || isIOS) && !isInstalled && !isDismissed

    const handleInstall = async () => {
        hapticFeedback(10)
        await promptInstall()
    }

    const handleDismiss = () => {
        hapticFeedback(5)
        dismiss()
    }

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="mx-4 mb-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden shadow-sm flex-shrink-0"
                >
                    <div className="flex items-center gap-3 px-4 py-3">
                        {/* Icono */}
                        <div className="w-9 h-9 rounded-xl bg-[var(--foreground)] flex items-center justify-center shrink-0">
                            <span style={{ fontSize: 18 }}>⚽</span>
                        </div>

                        {/* Texto e instrucciones */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-[var(--foreground)] leading-tight">
                                Instalá FutLog
                            </p>
                            {isIOS ? (
                                <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-1 inline-flex flex-wrap items-center gap-1">
                                    Tocá <Share size={10} className="inline opacity-70" /> y luego <strong>"Agregar a inicio"</strong> <PlusSquare size={10} className="inline opacity-70" />
                                </p>
                            ) : (
                                <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">
                                    Carga al toque, sin abrir el browser
                                </p>
                            )}
                        </div>

                        {/* Botón instalar (solo no-iOS porque iOS es manual) */}
                        {!isIOS && (
                            <button
                                onClick={handleInstall}
                                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-[11px] font-black tracking-tight"
                            >
                                <Download size={12} />
                                Instalar
                            </button>
                        )}

                        {/* Cerrar */}
                        <button
                            onClick={handleDismiss}
                            className={`shrink-0 p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--hover-bg)] transition-colors ${isIOS ? 'ml-2' : ''}`}
                        >
                            <X size={14} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
