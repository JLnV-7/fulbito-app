'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, TrendingUp } from 'lucide-react'

interface NewsItem {
    id: string
    title: string
    source: string
    time: string
    url: string
    imageUrl?: string
    category: string
}

export function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Simulación de fetch de noticias (TyC / Olé / SofaScore)
        const fetchNews = async () => {
            setLoading(true)
            await new Promise(resolve => setTimeout(resolve, 1500))

            const mockNews: NewsItem[] = [
                {
                    id: '1',
                    title: 'Scaloni confirmó la lista para las Eliminatorias: sorpresas en la delantera',
                    source: 'TyC Sports',
                    time: 'Hace 2h',
                    url: 'https://www.tycsports.com',
                    category: 'Selección',
                    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=200'
                },
                {
                    id: '2',
                    title: 'Boca negocia por un volante central de jerarquía europea',
                    source: 'Olé',
                    time: 'Hace 4h',
                    url: 'https://www.ole.com.ar',
                    category: 'Mercado',
                    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=200'
                },
                {
                    id: '3',
                    title: 'River prepara el Monumental para una noche de Copa Libertadores',
                    source: 'TyC Sports',
                    time: 'Hace 5h',
                    url: 'https://www.tycsports.com',
                    category: 'Libertadores',
                    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&q=80&w=200'
                },
                {
                    id: '4',
                    title: 'Racing e Independiente: todo listo para un nuevo Clásico de Avellaneda',
                    source: 'SofaScore',
                    time: 'Hace 6h',
                    url: 'https://www.sofascore.com',
                    category: 'Lpf',
                    imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d445bb523c?auto=format&fit=crop&q=80&w=200'
                }
            ]

            setNews(mockNews)
            setLoading(false)
        }

        fetchNews()
    }, [])

    return (
        <div className="my-6">
            <div className="flex items-center justify-between px-1 mb-3">
                <div className="flex items-center gap-2">
                    <Newspaper size={18} className="text-[var(--accent)]" />
                    <h3 className="font-bold text-sm text-[var(--foreground)] tracking-tight">NOTICIAS DESTACADAS</h3>
                </div>
                <a
                    href="https://www.tycsports.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                >
                    VER MÁS EN TYC <ExternalLink size={10} />
                </a>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-1">
                {loading ? (
                    Array(3).fill(0).map((_, i) => <NewsSkeleton key={i} />)
                ) : (
                    news.map((item, i) => (
                        <motion.a
                            key={item.id}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex-shrink-0 w-[280px] group"
                        >
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-2 border border-[var(--card-border)] bg-[var(--card-bg)]">
                                {item.imageUrl && (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                )}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase">
                                    {item.category}
                                </div>
                            </div>
                            <h4 className="font-bold text-xs line-clamp-2 leading-relaxed group-hover:text-[var(--accent)] transition-colors mb-1">
                                {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                                <span className="font-bold">{item.source}</span>
                                <span>•</span>
                                <span>{item.time}</span>
                            </div>
                        </motion.a>
                    ))
                )}
            </div>
        </div>
    )
}

function NewsSkeleton() {
    return (
        <div className="flex-shrink-0 w-[240px] animate-pulse">
            <div className="aspect-video bg-[var(--card-bg)] rounded-2xl mb-2 border border-[var(--card-border)]" />
            <div className="h-3 bg-[var(--card-bg)] rounded-full w-full mb-1" />
            <div className="h-3 bg-[var(--card-bg)] rounded-full w-2/3 mb-2" />
            <div className="flex gap-2">
                <div className="h-2 bg-[var(--card-bg)] rounded-full w-12" />
                <div className="h-2 bg-[var(--card-bg)] rounded-full w-8" />
            </div>
        </div>
    )
}
