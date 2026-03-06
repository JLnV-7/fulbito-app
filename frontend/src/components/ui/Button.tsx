'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'glass'
    size?: 'sm' | 'md' | 'lg'
    icon?: LucideIcon
    loading?: boolean
    fullWidth?: boolean
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {

    const variants = {
        primary: 'bg-[var(--accent-green)] text-white hover:brightness-110 shadow-sm',
        secondary: 'bg-[var(--hover-bg)] text-[var(--foreground)] border border-[var(--card-border)] hover:brightness-110',
        destructive: 'bg-[var(--accent)] text-white hover:brightness-110 shadow-sm',
        outline: 'bg-transparent border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--hover-bg)]',
        glass: 'glass text-[var(--foreground)] hover:brightness-110'
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)]',
        md: 'px-4 py-2.5 text-sm rounded-[var(--radius-md)]',
        lg: 'px-6 py-3.5 text-base rounded-[var(--radius-lg)]'
    }

    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={disabled || loading}
            className={`
        relative inline-flex items-center justify-center gap-2 font-bold transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            {...props as any}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : Icon && (
                <Icon size={size === 'sm' ? 14 : 18} />
            )}
            <span>{children}</span>
        </motion.button>
    )
}
