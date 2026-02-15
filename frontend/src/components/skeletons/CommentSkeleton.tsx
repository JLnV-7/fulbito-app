export function CommentSkeleton({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array(count).fill(0).map((_, idx) => (
                <div key={idx} className="flex gap-3 p-3 animate-pulse">
                    <div className="h-8 w-8 bg-gray-700/50 rounded-full shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-700/50 rounded w-24"></div>
                        <div className="h-3 bg-gray-700/50 rounded w-full"></div>
                        <div className="h-3 bg-gray-700/50 rounded w-3/4"></div>
                    </div>
                </div>
            ))}
        </>
    );
}
