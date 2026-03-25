'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Search, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { TeamLogo } from '@/components/TeamLogo'
import { getTeamColor } from '@/lib/helpers'

interface FavoriteTeam {
    id: string
    equipo_nombre: string
}

interface FavoriteTeamsListProps {
    userId: string
    isOwnProfile?: boolean
}

export function FavoriteTeamsList({ userId, isOwnProfile = false }: FavoriteTeamsListProps) {
    const [favorites, setFavorites] = useState<FavoriteTeam[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('favoritos')
                    .select('id, equipo_nombre')
                    .eq('user_id', userId)
                
                if (data) {
                    setFavorites(data)
                }
            } catch (err) {
                console.error('Error fetching favorites:', err)
            } finally {
                setLoading(false)
            }
        }
        
        fetchFavorites()
    }, [userId])

    if (loading) return (
        <div className="h-20 bg-[var(--card-bg)] animate-pulse rounded-2xl border border-[var(--card-border)]" />
    )

    if (favorites.length === 0 && !isOwnProfile) return null

    return (
        <section className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)] flex items-center gap-1.5">
                    <Heart size={12} className="fill-[var(--accent)]" /> 
                    Mis Equipos Favoritos
                </h3>
                {isOwnProfile && (
                    <Link 
                        href="/buscar"
                        className="text-[10px] text-[var(--text-muted)] hover:text-[var(--foreground)] font-bold transition-all uppercase tracking-widest"
                    >
                        Gestionar →
                    </Link>
                )}
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-4 border border-dashed border-[var(--card-border)] rounded-xl">
                    <p className="text-[10px] text-[var(--text-muted)] font-bold">Todavía no tenés equipos favoritos</p>
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {favorites.map((fav, i) => (
                        <motion.div
                            key={fav.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link
                                href={`/buscar?q=${encodeURIComponent(fav.equipo_nombre)}`}
                                className="flex items-center gap-2 bg-[var(--background)] hover:bg-[var(--hover-bg)] border border-[var(--card-border)] rounded-full px-3 py-1.5 transition-all group/fav active:scale-95"
                            >
                                <TeamLogo teamName={fav.equipo_nombre} size={18} />
                                <span className="text-xs font-bold whitespace-nowrap">{fav.equipo_nombre}</span>
                                <Star size={10} className="text-yellow-500 opacity-0 group-hover/fav:opacity-100 transition-opacity" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </section>
    )
}
