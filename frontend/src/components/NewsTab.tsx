'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Flame, Newspaper, Search, Filter } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { fetchTyCNewsAction } from '@/app/actions/news'

interface NewsItem {
    title: string
    link: string
    pubDate: string
    thumbnail: string
    source: string
    description: string
}

export function NewsTab() {
    const { user } = useAuth()
    const { t } = useLanguage()
    
    // Asumimos que los equipos favoritos del usuario están en su metadata
    const userTeams = user?.user_metadata?.favorite_teams || []
    
    const [news, setNews] = useState<NewsItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [filterQuery, setFilterQuery] = useState('')
    const [activeFilter, setActiveFilter] = useState<'all' | 'my_teams'>('all')

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true)
            setError(false)
            setErrorMessage('')
            try {
                const data = await fetchTyCNewsAction()
                if (data && data.length > 0) {
                    const mappedNews: NewsItem[] = data.map((item: any) => ({
                        title: item.title,
                        link: item.link,
                        description: item.description,
                        pubDate: new Date(item.pubDate || new Date()).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                        thumbnail: item.thumbnail,
                        source: 'TyC Sports'
                    }))
                    setNews(mappedNews)
                } else {
                    throw new Error('La fuente de noticias no devolvió artículos válidos.')
                }
            } catch (err: any) {
                console.error("Error fetching news:", err)
                setError(true)
                setErrorMessage(err.message || 'Error de conexión')
            } finally {
                setLoading(false)
            }
        }

        fetchNews()
    }, [])

    const filteredNews = news.filter((item) => {
        // 1. Filtrar por búsqueda manual
        const matchesQuery = item.title.toLowerCase().includes(filterQuery.toLowerCase()) || 
                             item.description.toLowerCase().includes(filterQuery.toLowerCase())
        
        // 2. Filtrar por equipos favoritos si el toggle está activo
        let matchesTeams = true
        if (activeFilter === 'my_teams' && userTeams.length > 0) {
            matchesTeams = userTeams.some((team: string) => 
                item.title.toLowerCase().includes(team.toLowerCase()) || 
                item.description.toLowerCase().includes(team.toLowerCase())
            )
        }

        return matchesQuery && matchesTeams
    })

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Search Controls */}
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar noticias, equipos, jugadores..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-lg pl-10 pr-4 py-2 text-xs font-bold text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
                
                {userTeams.length > 0 && (
                    <div className="flex bg-[var(--background)] p-1 rounded-lg border border-[var(--card-border)] w-full md:w-auto">
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`flex-1 md:px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeFilter === 'all' ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                        >
                            Todo
                        </button>
                        <button 
                            onClick={() => setActiveFilter('my_teams')}
                            className={`flex-1 md:px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-all flex items-center justify-center gap-1.5 ${activeFilter === 'my_teams' ? 'bg-[var(--accent-green)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
                        >
                            <Flame size={12} /> Mi Equipo
                        </button>
                    </div>
                )}
            </div>

            {/* Content Feed */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 bg-[var(--card-bg)] border border-red-500/20 rounded-xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Newspaper size={32} className="text-red-500/70" />
                    </div>
                    <p className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest leading-tight mb-2">No pudimos cargar las noticias</p>
                    <p className="text-xs text-[var(--text-muted)] font-medium max-w-xs mx-auto mb-6">{errorMessage || 'Parece que el servidor de origen (TyC Sports) no está respondiendo. Intentá de nuevo en un rato.'}</p>
                    <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-[var(--background)] border border-[var(--card-border)] text-[10px] font-black tracking-widest uppercase rounded-full hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors shadow-sm">
                        Reintentar Conexión
                    </button>
                </motion.div>
            ) : filteredNews.length === 0 ? (
                <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl border-dashed">
                    <Filter size={48} className="mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">No hay noticias para ese filtro</p>
                    <button onClick={() => {setFilterQuery(''); setActiveFilter('all')}} className="mt-4 text-[10px] font-black text-[var(--accent)] hover:underline">Limpiar Filtros</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredNews.map((item, idx) => (
                        <motion.a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-[var(--accent)] hover:shadow-lg transition-all"
                        >
                            {/* Img Header */}
                            <div className="relative h-48 w-full bg-[var(--background)] overflow-hidden">
                                {item.thumbnail ? (
                                    <img 
                                        src={item.thumbnail} 
                                        alt={item.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center opacity-10">
                                        <Newspaper size={48} />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 px-2 py-1 bg-[var(--foreground)] text-[var(--background)] text-[9px] font-black uppercase tracking-widest rounded shadow-sm">
                                    {item.source}
                                </div>
                            </div>
                            
                            {/* Body */}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="text-sm font-black text-[var(--foreground)] leading-snug mb-2 line-clamp-2 capitalize">
                                    {item.title}
                                </h3>
                                <p className="text-xs font-medium text-[var(--text-muted)] line-clamp-2 mb-4 flex-1">
                                    {item.description}
                                </p>
                                
                                <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-3 mt-auto">
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-tight">
                                        {item.pubDate}
                                    </span>
                                    <span className="text-[10px] font-black text-[var(--accent)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                        Leer más <ExternalLink size={12} />
                                    </span>
                                </div>
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}
        </div>
    )
}
