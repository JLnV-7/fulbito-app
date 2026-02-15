// src/components/skeletons/FixturesSkeleton.tsx
'use client'

export function FixturesSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Hora header */}
            <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-4 bg-[var(--card-border)] rounded"></div>
                <div className="flex-1 h-px bg-[var(--card-border)]"></div>
                <div className="w-16 h-3 bg-[var(--card-border)] rounded"></div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(4).fill(0).map((_, idx) => (
                    <div
                        key={idx}
                        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5"
                    >
                        {/* Liga y fecha */}
                        <div className="flex justify-between mb-4">
                            <div className="h-3 w-24 bg-[var(--card-border)] rounded"></div>
                            <div className="h-3 w-16 bg-[var(--card-border)] rounded"></div>
                        </div>

                        {/* Equipos */}
                        <div className="space-y-3">
                            {/* Local */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[var(--card-border)] rounded-full"></div>
                                    <div className="h-5 w-28 bg-[var(--card-border)] rounded"></div>
                                </div>
                                <div className="w-8 h-8 bg-[var(--card-border)] rounded"></div>
                            </div>

                            {/* Visitante */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[var(--card-border)] rounded-full"></div>
                                    <div className="h-5 w-24 bg-[var(--card-border)] rounded"></div>
                                </div>
                                <div className="w-8 h-8 bg-[var(--card-border)] rounded"></div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-[var(--card-border)] flex gap-2">
                            <div className="h-4 w-16 bg-[var(--card-border)] rounded"></div>
                            <div className="h-4 w-16 bg-[var(--card-border)] rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Segunda hora */}
            <div className="flex items-center gap-3 mb-3 mt-6">
                <div className="w-12 h-4 bg-[var(--card-border)] rounded"></div>
                <div className="flex-1 h-px bg-[var(--card-border)]"></div>
                <div className="w-16 h-3 bg-[var(--card-border)] rounded"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array(2).fill(0).map((_, idx) => (
                    <div
                        key={idx}
                        className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5"
                    >
                        <div className="flex justify-between mb-4">
                            <div className="h-3 w-24 bg-[var(--card-border)] rounded"></div>
                            <div className="h-3 w-16 bg-[var(--card-border)] rounded"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[var(--card-border)] rounded-full"></div>
                                    <div className="h-5 w-28 bg-[var(--card-border)] rounded"></div>
                                </div>
                                <div className="w-8 h-8 bg-[var(--card-border)] rounded"></div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[var(--card-border)] rounded-full"></div>
                                    <div className="h-5 w-24 bg-[var(--card-border)] rounded"></div>
                                </div>
                                <div className="w-8 h-8 bg-[var(--card-border)] rounded"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
