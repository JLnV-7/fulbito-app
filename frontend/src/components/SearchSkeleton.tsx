export function SearchSkeleton({ tab }: { tab: 'partidos' | 'usuarios' | 'resenas' | 'jugadores' }) {
    if (tab === 'partidos') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[24px] p-4 flex flex-col gap-4 animate-pulse">
                        <div className="flex justify-between items-center">
                            <div className="h-4 w-20 bg-[var(--card-border)] rounded" />
                            <div className="h-4 w-12 bg-[var(--card-border)] rounded" />
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-[var(--card-border)] rounded-full" />
                                <div className="h-3 w-16 bg-[var(--card-border)] rounded" />
                            </div>
                            <div className="h-6 w-12 bg-[var(--card-border)] rounded" />
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 bg-[var(--card-border)] rounded-full" />
                                <div className="h-3 w-16 bg-[var(--card-border)] rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (tab === 'usuarios') {
        return (
            <div className="space-y-2 pb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-full flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-[var(--card-border)] shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-[var(--card-border)] rounded" />
                            <div className="h-3 w-20 bg-[var(--card-border)] rounded" />
                        </div>
                        <div className="h-4 w-16 bg-[var(--card-border)] rounded" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-3 pb-8">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-[var(--card-border)]" />
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-[var(--card-border)] rounded" />
                            <div className="h-3 w-16 bg-[var(--card-border)] rounded" />
                        </div>
                    </div>
                    <div className="space-y-2 mb-4">
                        <div className="h-4 w-full bg-[var(--card-border)] rounded" />
                        <div className="h-4 w-3/4 bg-[var(--card-border)] rounded" />
                    </div>
                    <div className="h-32 w-full bg-[var(--card-border)] rounded-2xl" />
                </div>
            ))}
        </div>
    )
}
