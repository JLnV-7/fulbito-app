// src/components/NewsTab.tsx
// Server Component — las noticias llegan con el HTML inicial, sin spinner
import { Suspense } from 'react'
import { ExternalLink, Newspaper } from 'lucide-react'
import { fetchTyCNewsAction } from '@/app/actions/news'

interface NewsItem {
    title: string
    link: string
    pubDate: string
    thumbnail: string
    source: string
    description: string
}

async function NewsList() {
    let news: NewsItem[] = []
    let error = false

    try {
        const data = await fetchTyCNewsAction()
        if (data && data.length > 0) {
            news = data.map((item: any) => ({
                title: item.title,
                link: item.link,
                description: item.description,
                pubDate: new Date(item.pubDate || new Date()).toLocaleDateString('es-AR', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                }),
                thumbnail: item.thumbnail,
                source: 'TyC Sports'
            }))
        } else {
            error = true
        }
    } catch {
        error = true
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-[var(--card-bg)] border border-red-500/20 rounded-xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Newspaper size={32} className="text-red-500/70" />
                </div>
                <p className="text-sm font-black text-[var(--foreground)] uppercase tracking-widest mb-2">
                    No pudimos cargar las noticias
                </p>
                <p className="text-xs text-[var(--text-muted)] font-medium max-w-xs mx-auto">
                    TyC Sports no está respondiendo. Intentá de nuevo en un rato.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((item, idx) => (
                <a
                    key={idx}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl overflow-hidden hover:border-[var(--accent)] hover:shadow-lg transition-all"
                >
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
                    <div className="p-4 flex flex-col flex-1">
                        <h3 className="text-sm font-black leading-snug mb-2 line-clamp-2 capitalize">
                            {item.title}
                        </h3>
                        <p className="text-xs font-medium text-[var(--text-muted)] line-clamp-2 mb-4 flex-1">
                            {item.description}
                        </p>
                        <div className="flex items-center justify-between border-t border-[var(--card-border)] pt-3 mt-auto">
                            <span className="text-[10px] font-bold text-[var(--text-muted)]">
                                {item.pubDate}
                            </span>
                            <span className="text-[10px] font-black text-[var(--accent)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                Leer más <ExternalLink size={12} />
                            </span>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    )
}

function NewsTabSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-72 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl animate-pulse" />
            ))}
        </div>
    )
}

// Export — envuelto en Suspense para streaming
export function NewsTab() {
    return (
        <Suspense fallback={<NewsTabSkeleton />}>
            <NewsList />
        </Suspense>
    )
}
