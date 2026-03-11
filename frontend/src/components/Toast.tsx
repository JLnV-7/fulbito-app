// src/components/Toast.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/contexts/ToastContext'

export function ToastContainer() {
    const { toasts, hideToast } = useToast()

    const getToastStyles = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-[var(--foreground)] text-[var(--background)]'
            case 'error':
                return 'bg-[#dc2626] text-white'
            case 'warning':
                return 'bg-[#f59e0b] text-black'
            default:
                return 'bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--card-border)]'
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return '✓'
            case 'error': return '✕'
            case 'warning': return '⚠'
            default: return 'ℹ'
        }
    }

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, x: 100, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 100, scale: 0.9 }}
                        className={`px-4 py-3 border border-[var(--card-border)] shadow-xl flex items-center gap-3 cursor-pointer
                                   ${getToastStyles(toast.type)}`}
                        style={{ borderRadius: 'var(--radius)' }}
                        onClick={() => hideToast(toast.id)}
                    >
                        <span className="text-lg">{getIcon(toast.type)}</span>
                        <span className="text-sm font-black capitalize tracking-widest">{toast.message}</span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
