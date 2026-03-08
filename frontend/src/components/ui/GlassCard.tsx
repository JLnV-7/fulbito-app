import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface GlassCardProps extends HTMLMotionProps<'div'> {
    children: ReactNode
    className?: string
    noPadding?: boolean
}

export function GlassCard({ children, className = '', noPadding = false, ...props }: GlassCardProps) {
    return (
        <motion.div
            className={`glass rounded-[var(--radius-lg)] overflow-hidden ${noPadding ? '' : 'p-5'} ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    )
}
