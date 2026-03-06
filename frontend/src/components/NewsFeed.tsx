import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, ExternalLink, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface NewsItem {
    id: string
    title: string
    source: string
    time: string
    url: string
    imageUrl?: string
    category: string
    isPersonalized?: boolean
}

export function NewsFeed() {
    const { user } = useAuth()
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true)

            try {
                // 1. Get user's team
                let userTeam: string | null = null
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('equipo')
                        .eq('id', user.id)
                        .single()
                    userTeam = profile?.equipo || null
                }

                // 2. Fetch RSS feed from proxy
                const rssUrl = 'https://www.tycsports.com/rss/futbol.xml'
                const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
                const data = await response.json()

                if (data.items && data.items.length > 0) {
                    const allItems = data.items.map((item: any, idx: number) => ({
                        id: String(idx),
                        title: item.title,
                        source: 'TyC Sports',
                        time: 'Reciente',
                        url: item.link,
                        imageUrl: item.thumbnail || item.enclosure?.link || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=200',
                        category: item.categories?.[0] || 'Fútbol',
                        isPersonalized: userTeam ? item.title.toLowerCase().includes(userTeam.toLowerCase()) : false
                    }))

                    const general = allItems.slice(0, 3)
                    const rest = allItems.slice(3)

                    let finalNews = [...general]
                    if (userTeam) {
                        const personalized = rest.filter((item: any) => item.isPersonalized)
                        const others = rest.filter((item: any) => !item.isPersonalized)
                        finalNews = [...general, ...personalized, ...others].slice(0, 15)
                    } else {
                        finalNews = allItems.slice(0, 15)
                    }
                    setNews(finalNews)
                } else {
                    throw new Error('No news items found')
                }
            } catch (err) {
                console.error('Error fetching news:', err)
                setNews([]) // Trigger fallback in JSX
            } finally {
                setLoading(false)
            }
        }

        fetchNews()
    }, [user])

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

            <div className="flex gap-4 overflow-x-auto pb-4 px-1 scroll-smooth custom-scrollbar">
                {loading ? (
                    Array(3).fill(0).map((_, i) => <NewsSkeleton key={i} />)
                ) : (
                    (news.length > 0 ? news : [
                        {
                            id: 'fb-1',
                            title: '¡FutLog Beta lanzada! Probá el armador de XI ideal y las encuestas en vivo.',
                            url: '#',
                            source: 'FutLog Staff',
                            time: 'Ahora',
                            category: 'COMUNIDAD',
                            imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=500&auto=format&fit=crop',
                            isPersonalized: true
                        },
                        {
                            id: 'fb-2',
                            title: 'Simulación de Partidos: Ya podés ver estadísticas en vivo de los clásicos.',
                            url: '#',
                            source: 'Sistema',
                            time: '1h',
                            category: 'VIVO',
                            imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=500&auto=format&fit=crop',
                            isPersonalized: false
                        }
                    ]).map((item, i) => (
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
                            <div className="relative aspect-video rounded-2xl overflow-hidden mb-2 border border-[var(--card-border)] bg-[var(--card-bg)] shadow-sm">
                                {item.imageUrl && (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                )}
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[9px] font-black text-white px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                    {item.isPersonalized && <Sparkles size={10} className="text-amber-400" />}
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

                {/* VER MÁS CARD */}
                {!loading && (
                    <motion.a
                        href="https://www.tycsports.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-shrink-0 w-[140px] flex flex-col items-center justify-center bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl hover:bg-[var(--hover-bg)] transition-all group p-4 gap-3 text-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ArrowRight size={24} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--foreground)]">Ver más noticias</span>
                    </motion.a>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: var(--card-bg);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--card-border);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: var(--accent);
                }
            `}</style>
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
