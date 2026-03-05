// src/components/ListCard.tsx
'use client'

import Link from 'next/link'
import { Lock, AlignLeft } from 'lucide-react'
import type { UserList } from '@/hooks/useUserLists'
import { TeamLogo } from './TeamLogo'

interface ListCardProps {
    list: UserList
}

export function ListCard({ list }: ListCardProps) {
    // Get up to 4 items to display a mini-collage of logos
    const previewItems = (list.items || []).slice(0, 4)

    return (
        <Link href={`/listas/${list.id}`}>
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 hover:border-[var(--accent)] transition-colors h-full flex flex-col group">
                {/* Collage Preview */}
                <div className="bg-[var(--hover-bg)] rounded-xl aspect-[21/9] mb-4 flex items-center justify-center p-2 relative overflow-hidden group-hover:scale-[1.02] transition-transform">
                    {previewItems.length > 0 ? (
                        <div className="flex -space-x-4">
                            {previewItems.map((item, i) => (
                                <div key={item.id} className="w-12 h-12 rounded-full border-2 border-[var(--card-bg)] bg-[var(--background)] flex items-center justify-center relative z-[1]" style={{ zIndex: 4 - i }}>
                                    <TeamLogo teamName={item.equipo_local} size={32} src={item.logo_local} className="rounded-full overflow-hidden" />
                                </div>
                            ))}
                            {list._count && list._count > 4 && (
                                <div className="w-12 h-12 rounded-full border-2 border-[var(--card-bg)] bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-xs font-bold relative z-0">
                                    +{list._count - 4}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-[var(--text-muted)] opacity-50">
                            <AlignLeft size={24} className="mb-1" />
                            <span className="text-[10px] uppercase font-bold tracking-wider">Lista Vacía</span>
                        </div>
                    )}

                    {!list.is_public && (
                        <div className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur rounded-lg text-white">
                            <Lock size={12} />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col">
                    <h3 className="font-bold text-[var(--foreground)] line-clamp-1 mb-1">{list.title}</h3>
                    <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-xs text-[var(--text-muted)] font-medium">
                            {list._count} {list._count === 1 ? 'partido' : 'partidos'}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
