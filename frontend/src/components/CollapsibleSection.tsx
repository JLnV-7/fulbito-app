// src/components/CollapsibleSection.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
    title: string | React.ReactNode
    icon?: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
}

export function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between bg-[var(--background)] hover:bg-[var(--hover-bg)] transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <h3 className="text-[10px] font-black capitalize tracking-widest text-[var(--foreground)]">{title}</h3>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <ChevronDown size={18} className="text-[var(--foreground)]" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        key="content"
                        initial="collapsed"
                        animate="open"
                        exit="collapsed"
                        variants={{
                            open: { opacity: 1, height: 'auto' },
                            collapsed: { opacity: 0, height: 0 }
                        }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                        <div className="border-t border-[var(--card-border)]">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
