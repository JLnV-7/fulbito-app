'use client'

import { motion } from 'framer-motion'

interface Props {
    selectedAvatar?: string
    onSelect: (avatar: string) => void
}

const PRESET_AVATARS = [
    '👤', '😎', '🦁', '🐯', '🦅', '🦈', '👻', '👽', '🤖', '👾', '🤡', '👺',
    '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🥊', '🥋', '🥅',
    '🥇', '🥈', '🥉', '🏆', '👑', '💎', '🔥', '⚡', '🌟', '🚀', '💣', '🛡️'
]

export function AvatarSelector({ selectedAvatar, onSelect }: Props) {
    return (
        <div className="grid grid-cols-6 gap-2 sm:gap-4 p-2">
            {PRESET_AVATARS.map((avatar) => (
                <motion.button
                    key={avatar}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onSelect(avatar)}
                    className={`aspect-square flex items-center justify-center text-3xl rounded-xl border-2 transition-all
            ${selectedAvatar === avatar
                            ? 'bg-[#10b981]/10 border-[#10b981] shadow-lg shadow-[#10b981]/20'
                            : 'border-transparent hover:bg-[var(--card-bg)] hover:border-[var(--card-border)]'
                        }`}
                >
                    {avatar}
                </motion.button>
            ))}
        </div>
    )
}
