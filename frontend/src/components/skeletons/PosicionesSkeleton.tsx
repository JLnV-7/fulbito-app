// src/components/skeletons/PosicionesSkeleton.tsx
'use client'

export function PosicionesSkeleton() {
    return (
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--card-border)] overflow-hidden animate-pulse">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-[var(--background)] border-b border-[var(--card-border)]">
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-4 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded"></div>
                <div className="col-span-1 h-3 bg-[var(--card-border)] rounded hidden md:block"></div>
            </div>

            {/* Rows */}
            {Array(12).fill(0).map((_, idx) => (
                <div
                    key={idx}
                    className={`grid grid-cols-12 gap-2 px-4 py-4 items-center
                        ${idx % 2 === 0 ? 'bg-[var(--card-bg)]' : 'bg-[var(--background)]/30'}`}
                >
                    <div className="col-span-1 flex justify-center">
                        <div className="w-5 h-5 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-[var(--card-border)] rounded-full"></div>
                        <div className="h-4 bg-[var(--card-border)] rounded flex-1 max-w-[120px]"></div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <div className="w-4 h-4 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <div className="w-4 h-4 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <div className="w-4 h-4 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <div className="w-4 h-4 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <div className="w-6 h-4 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                        <div className="w-6 h-6 bg-[var(--card-border)] rounded"></div>
                    </div>
                    <div className="col-span-1 hidden md:flex gap-0.5 justify-center">
                        {Array(5).fill(0).map((_, i) => (
                            <div key={i} className="w-4 h-4 bg-[var(--card-border)] rounded-sm"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
