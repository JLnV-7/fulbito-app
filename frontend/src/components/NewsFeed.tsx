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
            <GlassCard className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Newspaper size={18} className="text-[#10b981]" />
                    <h2 className="text-lg font-black tracking-tight">Últimas Noticias</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="min-w-[260px] md:min-w-[300px] h-[120px] bg-white/5 border border-white/10 rounded-2xl animate-pulse shrink-0 snap-start" />
                    ))}
                </div>
            </GlassCard>
        )
    }

    if (error || news.length === 0) {
        return null // Fallback: don't show the section if it fails, to maintain a clean UI
    }

    return (
        <GlassCard noPadding className="mb-6 p-5 border-[#10b981]/10 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-2 mb-4">
                <Flame size={18} className="text-[#ff6b6b]" />
                <h2 className="text-lg font-black tracking-tight">
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
                        className="group relative min-w-[280px] md:min-w-[320px] h-[140px] rounded-[18px] overflow-hidden shrink-0 snap-center border border-white/10"
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {item.thumbnail ? (
                            <img src={item.thumbnail} alt={item.title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                        ) : (
                            <div className="absolute inset-0 bg-[#1a1a1a]" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/80 to-transparent" />

                        <div className="absolute inset-x-0 bottom-0 p-4">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider bg-[#10b981]/10 px-2 py-0.5 rounded">
                                    {item.source}
                                </span>
                                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                    {item.pubDate}
                                </span>
                            </div>
                            <h3 className="text-sm font-semibold text-white leading-tight line-clamp-2">
                                {item.title}
                            </h3>
                        </div>
                    </motion.a>
                ))}

                <div className="min-w-[150px] flex items-center justify-center shrink-0 snap-center">
                    <a href="https://www.tycsports.com/futbol.html" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-[var(--text-muted)] hover:text-[#10b981] transition-colors">
                        <div className="w-12 h-12 rounded-full border border-dashed border-white/20 flex items-center justify-center bg-white/5 hover:bg-[#10b981]/10">
                            <ExternalLink size={18} />
                        </div>
                        <span className="text-xs font-bold">Ver más noticias</span>
                    </a>
                </div>
            </div>
        </GlassCard>
    )
}
