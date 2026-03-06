import { motion } from 'framer-motion'

export function MatchSkeleton() {
    return (
        <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 overflow-hidden relative">
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[#10b981]/10 to-transparent -translate-x-full"
                animate={{ translateX: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Header: Date + League */}
            <div className="flex justify-between items-center mb-4">
                <div className="h-4 w-20 bg-[var(--hover-bg)] rounded animate-pulse" />
                <div className="h-4 w-12 bg-[#10b981]/20 rounded animate-pulse" />
            </div>

            {/* Teams and Score */}
            <div className="flex items-center justify-between">
                {/* Team 1 */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full bg-[var(--hover-bg)] animate-pulse" />
                    <div className="h-4 w-16 bg-[var(--hover-bg)] rounded animate-pulse" />
                </div>

                {/* Score / Time */}
                <div className="flex flex-col items-center gap-1 w-1/3">
                    <div className="h-8 w-14 bg-[var(--background)] rounded-xl animate-pulse" />
                    <div className="h-3 w-10 bg-[#10b981]/20 rounded animate-pulse" />
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full bg-[var(--hover-bg)] animate-pulse" />
                    <div className="h-4 w-16 bg-[var(--hover-bg)] rounded animate-pulse" />
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
