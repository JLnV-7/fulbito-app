import { motion } from 'framer-motion'

export function PartidoCardSkeleton() {
    return (
        <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)] relative overflow-hidden">
            {/* Green pulse accent */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--accent-green)]/10 to-transparent -translate-x-full"
                animate={{ translateX: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Liga badge */}
            <div className="h-4 bg-[var(--hover-bg)] rounded w-24 mb-4 animate-pulse"></div>

            {/* Teams */}
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-[var(--hover-bg)] rounded-full animate-pulse border border-[var(--card-border)]"></div>
                    <div className="h-5 bg-[var(--hover-bg)] rounded w-24 animate-pulse"></div>
                </div>

                <div className="h-8 bg-[var(--background)] rounded-xl w-16 mx-4 border border-[var(--card-border)] flex items-center justify-center animate-pulse">
                    <div className="h-3 w-6 bg-[var(--accent-green)]/20 rounded"></div>
                </div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="h-5 bg-[var(--hover-bg)] rounded w-24 animate-pulse"></div>
                    <div className="h-10 w-10 bg-[var(--hover-bg)] rounded-full animate-pulse border border-[var(--card-border)]"></div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-[var(--card-border)] relative z-10">
                <div className="h-4 bg-[var(--hover-bg)] rounded w-32 animate-pulse"></div>
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-[var(--hover-bg)] rounded-full animate-pulse"></div>
                    <div className="h-8 w-8 bg-[var(--hover-bg)] rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
