export function FormacionSkeleton() {
    return (
        <div className="relative bg-[var(--card-bg)] rounded-xl p-6 min-h-[400px] animate-pulse border border-[var(--card-border)]">
            {/* Field background */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 to-green-800/20 rounded-xl"></div>

            {/* Player positions */}
            <div className="relative z-10 grid grid-rows-4 gap-8 h-full py-4">
                {/* Forward line */}
                <div className="flex justify-around items-center">
                    {Array(3).fill(0).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 bg-gray-700/50 rounded-full"></div>
                            <div className="h-3 bg-gray-700/50 rounded w-16"></div>
                        </div>
                    ))}
                </div>

                {/* Midfield */}
                <div className="flex justify-around items-center">
                    {Array(4).fill(0).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 bg-gray-700/50 rounded-full"></div>
                            <div className="h-3 bg-gray-700/50 rounded w-16"></div>
                        </div>
                    ))}
                </div>

                {/* Defense */}
                <div className="flex justify-around items-center">
                    {Array(4).fill(0).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 bg-gray-700/50 rounded-full"></div>
                            <div className="h-3 bg-gray-700/50 rounded w-16"></div>
                        </div>
                    ))}
                </div>

                {/* Goalkeeper */}
                <div className="flex justify-center items-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 bg-gray-700/50 rounded-full"></div>
                        <div className="h-3 bg-gray-700/50 rounded w-20"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
