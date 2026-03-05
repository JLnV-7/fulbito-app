// src/lib/badges.ts
// Sistema de gamificación con badges/logros

export interface Badge {
    id: string
    name: string
    description: string
    icon: string
    category: 'actividad' | 'social' | 'especial'
    requirement: number  // threshold to unlock
    checkField: string   // field in stats to check
}

export const BADGES: Badge[] = [
    // Actividad
    { id: 'debut', name: 'Debut', description: 'Logueaste tu primer partido', icon: '🌟', category: 'actividad', requirement: 1, checkField: 'total_logs' },
    { id: 'hincha', name: 'Hincha', description: '10 partidos logueados', icon: '💚', category: 'actividad', requirement: 10, checkField: 'total_logs' },
    { id: 'fanatico', name: 'Fanático', description: '50 partidos logueados', icon: '🔥', category: 'actividad', requirement: 50, checkField: 'total_logs' },
    { id: 'leyenda', name: 'Leyenda', description: '100 partidos logueados', icon: '👑', category: 'actividad', requirement: 100, checkField: 'total_logs' },
    { id: 'critico', name: 'Crítico', description: '20 reseñas con texto', icon: '✍️', category: 'actividad', requirement: 20, checkField: 'reviews_with_text' },
    { id: 'palometa', name: 'Palometa', description: 'Votaste en 25 partidos', icon: '🗳️', category: 'actividad', requirement: 25, checkField: 'total_votos' },

    // Social
    { id: 'socio', name: 'Socio', description: 'Te uniste a un grupo', icon: '🤝', category: 'social', requirement: 1, checkField: 'grupos_joined' },
    { id: 'influencer', name: 'Influencer', description: '10 seguidores', icon: '📢', category: 'social', requirement: 10, checkField: 'followers_count' },
    { id: 'popular', name: 'Popular', description: '50 likes en tus reseñas', icon: '❤️', category: 'social', requirement: 50, checkField: 'total_likes_received' },

    // Especial
    { id: 'globetrotter', name: 'Globetrotter', description: 'Logueaste partidos de 3+ ligas', icon: '🌍', category: 'especial', requirement: 3, checkField: 'distinct_ligas' },
    { id: 'prodista', name: 'Prodista', description: '10 pronósticos acertados', icon: '🎯', category: 'especial', requirement: 10, checkField: 'prode_aciertos' },
    { id: 'arbitro', name: 'Árbitro', description: '10 reseñas en modo neutral', icon: '📐', category: 'especial', requirement: 10, checkField: 'neutral_reviews' },
    { id: 'madrugador', name: 'Madrugador', description: 'Logueaste un partido antes de las 10am', icon: '🌅', category: 'especial', requirement: 1, checkField: 'early_logs' },
    { id: 'noctambulo', name: 'Noctámbulo', description: 'Logueaste un partido después de medianoche', icon: '🌙', category: 'especial', requirement: 1, checkField: 'late_logs' },
]

export interface BadgeStats {
    total_logs: number
    reviews_with_text: number
    total_votos: number
    grupos_joined: number
    followers_count: number
    total_likes_received: number
    distinct_ligas: number
    prode_aciertos: number
    neutral_reviews: number
    early_logs: number
    late_logs: number
}

export function getUnlockedBadges(stats: BadgeStats): Badge[] {
    return BADGES.filter(badge => {
        const value = stats[badge.checkField as keyof BadgeStats] || 0
        return value >= badge.requirement
    })
}

export function getBadgeProgress(badge: Badge, stats: BadgeStats): number {
    const value = stats[badge.checkField as keyof BadgeStats] || 0
    return Math.min(100, Math.round((value / badge.requirement) * 100))
}

export function getNextBadges(stats: BadgeStats, limit: number = 3): Badge[] {
    return BADGES
        .filter(badge => {
            const value = stats[badge.checkField as keyof BadgeStats] || 0
            return value < badge.requirement
        })
        .sort((a, b) => {
            const progressA = getBadgeProgress(a, stats)
            const progressB = getBadgeProgress(b, stats)
            return progressB - progressA // closest to completion first
        })
        .slice(0, limit)
}
