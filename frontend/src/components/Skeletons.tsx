import { motion } from 'framer-motion'

export function MatchSkeleton() {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-[var(--radius-md)] p-4 overflow-hidden relative min-h-[140px] flex flex-col justify-between">
            {/* Header: Date + League */}
            <div className="flex justify-between items-center mb-4">
                <div className="h-4 w-24 bg-[var(--hover-bg)] rounded-[var(--radius-sm)] animate-pulse-sober" />
                <div className="h-4 w-12 bg-[var(--hover-bg)]/50 rounded-[var(--radius-sm)] animate-pulse-sober" />
            </div>

            {/* Teams and Score */}
            <div className="flex items-center justify-between">
                {/* Team 1 */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full bg-[var(--hover-bg)] animate-pulse-sober" />
                    <div className="h-3 w-16 bg-[var(--hover-bg)] rounded-[var(--radius-sm)] animate-pulse-sober" />
                </div>

                {/* Score / Time */}
                <div className="flex flex-col items-center gap-1 w-1/3">
                    <div className="h-10 w-16 bg-[var(--background)] rounded-[var(--radius-md)] animate-pulse-sober" />
                    <div className="h-3 w-12 bg-[var(--hover-bg)] rounded-[var(--radius-sm)] animate-pulse-sober" />
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full bg-[var(--hover-bg)] animate-pulse-sober" />
                    <div className="h-3 w-16 bg-[var(--hover-bg)] rounded-[var(--radius-sm)] animate-pulse-sober" />
                </div>
            </div>
        </div>
    )
}

export function MatchListSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="flex flex-col gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <MatchSkeleton key={i} />
            ))}
        </div>
    )
}
