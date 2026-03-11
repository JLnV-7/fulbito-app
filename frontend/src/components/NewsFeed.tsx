'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Flame, Newspaper } from 'lucide-react'
import { GlassCard } from './ui/GlassCard'

interface NewsItem {
    title: string
    link: string
    pubDate: string
    thumbnail: string
    source: string
}

interface NewsFeedProps {
    userTeams: string[]
}

export function NewsFeed({ userTeams }: NewsFeedProps) {
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true)
            setError(false)
            try {
                // Proxy CORS free para tycsports
                const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.tycsports.com/rss/futbol.xml')
                const data = await res.json()

                if (data.status === 'ok') {
                    // Filter by user teams if available, otherwise just show top news
                    let filtered = data.items

                    if (userTeams.length > 0) {
                        filtered = data.items.filter((item: any) =>
                            userTeams.some(team =>
                                item.title.toLowerCase().includes(team.toLowerCase()) ||
                                item.description.toLowerCase().includes(team.toLowerCase())
                            )
                        )
                        // If strict filter yields nothing, fallback to general news
                        if (filtered.length === 0) {
                            filtered = data.items
                        }
                    }

                    const mappedNews: NewsItem[] = filtered.map((item: any) => ({
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.pubDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
                        thumbnail: item.enclosure?.link || '',
                        source: 'TyC Sports'
                    })).slice(0, 15)

                    setNews(mappedNews)
                } else {
                    throw new Error('RSS Error')
                }
            } catch (err) {
                console.error("Error fetching news:", err)
                setError(true)
            } finally {
                setLoading(false)
            }
        }

        fetchNews()
    }, [userTeams])

    if (loading) {
        return (
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-5 mb-6" style={{ borderRadius: 'var(--radius)' }}>
                <div className="flex items-center gap-2 mb-4">
                    <Newspaper size={18} className="text-[var(--text-muted)]" />
                    <h2 className="text-sm font-black capitalize tracking-widest italic">Últimas Noticias</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="min-w-[260px] md:min-w-[300px] h-[120px] bg-[var(--background)] border border-[var(--card-border)] animate-pulse shrink-0 snap-start" style={{ borderRadius: 'var(--radius)' }} />
                    ))}
                </div>
            </div>
        )
    }

    if (error || news.length === 0) {
        return null // Fallback: don't show the section if it fails, to maintain a clean UI
    }

    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] mb-6 p-5" style={{ borderRadius: 'var(--radius)' }}>
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--card-border)] pb-2 border-dashed">
                <Flame size={18} className="text-[#ff4d4d]" />
                <h2 className="text-sm font-black capitalize tracking-widest italic">
                    {userTeams.length > 0 ? 'Noticias para vos' : 'Últimas Noticias'}
                </h2>
            </div>

            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                {news.map((item, idx) => (
                    <motion.a
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative min-w-[280px] md:min-w-[320px] h-[140px] overflow-hidden shrink-0 snap-center border border-[var(--card-border)]"
                        style={{ borderRadius: 'var(--radius)' }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        ) : (
                            <div className="absolute inset-0 bg-[var(--background)]" />
                        )}
                        <div className="absolute inset-0 bg-[var(--background)]/80" />

                        <div className="absolute inset-x-0 bottom-0 p-4">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-[8px] font-black text-[var(--background)] bg-[var(--foreground)] capitalize tracking-widest px-2 py-0.5">
                                    {item.source}
                                </span>
                                <span className="text-[8px] text-[var(--text-muted)] font-black capitalize">
                                    {item.pubDate}
                                </span>
                            </div>
                            <h3 className="text-xs font-bold text-[var(--foreground)] leading-tight line-clamp-2 capitalize">
                                {item.title}
                            </h3>
                        </div>
                    </motion.a>
                ))}

                <div className="min-w-[150px] flex items-center justify-center shrink-0 snap-center">
                    <a href="https://www.tycsports.com/futbol.html" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors">
                        <div className="w-10 h-10 border border-dashed border-[var(--card-border)] flex items-center justify-center bg-[var(--background)] hover:bg-[var(--hover-bg)]" style={{ borderRadius: 'var(--radius)' }}>
                            <ExternalLink size={16} />
                        </div>
                        <span className="text-[10px] font-black capitalize">Ver más</span>
                    </a>
                </div>
            </div>
        </div>
    )
}
