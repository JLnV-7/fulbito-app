'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface ProfileAccordionProps {
    title: string
    icon: React.ReactNode
    children: React.ReactNode
    defaultOpen?: boolean
    action?: React.ReactNode
}

export function ProfileAccordion({ title, icon, children, defaultOpen = false, action }: ProfileAccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-sm overflow-hidden mb-6">
            <div
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-[var(--hover-bg)] transition-colors select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="text-xl">{icon}</div>
                    <h2 className="text-xl font-black">{title}</h2>
                </div>

                <div className="flex items-center gap-3">
                    {action && (
                        <div onClick={e => e.stopPropagation()}>
                            {action}
                        </div>
                    )}
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-[var(--text-muted)] bg-[var(--background)] p-1.5 rounded-full"
                    >
                        <ChevronDown size={18} />
                    </motion.div>
                </div>
            </div>

            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 border-t border-[var(--card-border)] mt-2 mx-4">
                            <div className="pt-4">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
