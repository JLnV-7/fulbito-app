// src/components/NewsTab.tsx
// ANTES: 'use client' — fetcha noticias después de hydration (usuario ve pantalla vacía)
// AHORA: Server Component — noticias pre-fetched, llegan con el HTML inicial

import { ExternalLink, Flame, Newspaper } from 'lucide-react'
import { fetchTyCNewsAction } from '@/app/actions/news'

interface NewsItem {
    title: string
    link: string
    pubDate: string
    thumbnail: string
    source: string
    description: string
}

// Server Component — sin 'use client', sin useEffect, sin useState
export async function NewsTab() {
    let news: NewsItem[] = []
    let error = false

    try {
        const data = await fetchTyCNewsAction()
        if (data && data.length > 0) {
            news = data.map((item: any) => ({
                title: item.title,
                link: item.link,
                description: item.description || '',
                pubDate: new Date(item.pubDate || new Date()).toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                }),
                thumbnail: item.thumbnail || '',
                source: 'TyC Sports'
            }))
        } else {
            error = true
        }
    } catch (err) {
        console.error('Error fetching news:', err)
        error = true
    }

    if (error || news.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Newspaper size={40} className="text-[var(--text-muted)] mb-4 opacity-40" />
                <p className="font-black text-sm">No pudimos cargar las noticias</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Intentá de nuevo en unos minutos
                </p>
            </div>
        )
    }

    const featured = news[0]
    const rest = news.slice(1)

    return (
        <div className="space-y-4">
            {/* Nota destacada */}
            {featured && (
                <a
                    href={featured.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl overflow-hidden hover:border-[var(--foreground)]/20 transition-all group"
                >
                    {featured.thumbnail && (
                        <div className="relative h-48 bg-[var(--hover-bg)] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={featured.thumbnail}
                                alt={featured.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="eager"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
                                <Flame size={12} className="text-orange-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Destacado</span>
                            </div>
                        </div>
                    )}
                    <div className="p-4">
                        <p className="font-black text-sm leading-snug group-hover:text-[var(--accent)] transition-colors">
                            {featured.title}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] text-[var(--text-muted)] font-bold">{featured.source} · {featured.pubDate}</span>
                            <ExternalLink size={12} className="text-[var(--text-muted)]" />
                        </div>
                    </div>
                </a>
            )}

            {/* Lista de noticias */}
            <div className="space-y-2">
                {rest.map((item, i) => (
                    <a
                        key={i}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-3 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl hover:border-[var(--foreground)]/20 transition-all group"
                    >
                        {item.thumbnail && (
                            <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-[var(--hover-bg)]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs leading-snug line-clamp-2 group-hover:text-[var(--accent)] transition-colors">
                                {item.title}
                            </p>
                            <p className="text-[9px] text-[var(--text-muted)] mt-1.5 font-bold">
                                {item.source} · {item.pubDate}
                            </p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
