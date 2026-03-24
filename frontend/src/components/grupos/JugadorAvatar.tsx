// src/components/grupos/JugadorAvatar.tsx
// Avatar pequeño para jugadores — usa foto de perfil si existe, sino iniciales
'use client'

interface JugadorAvatarProps {
    nombre: string
    avatarUrl?: string | null
    equipo: 'azul' | 'rojo'
    size?: 'sm' | 'md' | 'lg'
}

export function JugadorAvatar({ nombre, avatarUrl, equipo, size = 'md' }: JugadorAvatarProps) {
    const sizeClasses = {
        sm: 'w-7 h-7 text-[10px]',
        md: 'w-9 h-9 text-xs',
        lg: 'w-12 h-12 text-sm',
    }
    const bgColor = equipo === 'azul' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'
    const initials = nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

    return (
        <div className={`${sizeClasses[size]} rounded-full shrink-0 overflow-hidden flex items-center justify-center font-black ${!avatarUrl ? bgColor : ''}`}>
            {avatarUrl?.startsWith('http') ? (
                <img
                    src={avatarUrl}
                    alt={nombre}
                    className="w-full h-full object-cover"
                    onError={e => {
                        // Si la imagen falla, mostrar iniciales
                        const target = e.currentTarget
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = initials
                        target.parentElement!.className += ` ${bgColor}`
                    }}
                />
            ) : avatarUrl && !avatarUrl.startsWith('http') ? (
                // Es un emoji
                <span className="text-base">{avatarUrl}</span>
            ) : (
                <span>{initials}</span>
            )}
        </div>
    )
}
