export function PartidoCardSkeleton() {
    return (
        <div className="bg-[var(--card-bg)] rounded-xl p-5 border border-[var(--card-border)] animate-pulse">
            {/* Liga badge */}
            <div className="h-4 bg-gray-700/50 rounded w-24 mb-4"></div>

            {/* Teams */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 bg-gray-700/50 rounded-full"></div>
                    <div className="h-5 bg-gray-700/50 rounded w-24"></div>
                </div>

                <div className="h-8 bg-gray-700/50 rounded w-16 mx-4"></div>

                <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="h-5 bg-gray-700/50 rounded w-24"></div>
                    <div className="h-10 w-10 bg-gray-700/50 rounded-full"></div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-[var(--card-border)]">
                <div className="h-4 bg-gray-700/50 rounded w-32"></div>
                <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-700/50 rounded-full"></div>
                    <div className="h-8 w-8 bg-gray-700/50 rounded-full"></div>
                </div>
            </div>
        </div>
    );
}
