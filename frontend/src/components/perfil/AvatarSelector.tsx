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
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSelect(avatar)}
                    className={`aspect-square flex items-center justify-center text-3xl transition-all border-2
            ${selectedAvatar === avatar
                            ? 'bg-[#16a34a]/10 border-[#16a34a]'
                            : 'bg-[var(--background)] border-[var(--card-border)] hover:border-[var(--foreground)]'
                        }`}
                    style={{ borderRadius: 'var(--radius)' }}
                >
                    {avatar}
                </motion.button>
            ))}
        </div>
    )
}
