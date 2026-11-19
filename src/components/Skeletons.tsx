export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-label="Loading listings"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-xl border border-[#DDD7C9] bg-white"
        >
          <div className="aspect-[4/3] w-full animate-pulse bg-[#EDE9DF]" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#EDE9DF]" />
            <div className="h-5 w-4/5 animate-pulse rounded bg-[#EDE9DF]" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-[#EDE9DF]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#EDE9DF]" />
            <div className="pt-2">
              <div className="h-9 w-full animate-pulse rounded-lg bg-[#EDE9DF]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading dashboard">
      <div className="h-8 w-64 animate-pulse rounded-lg bg-[#EDE9DF]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-[#DDD7C9] bg-white" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl border border-[#DDD7C9] bg-white" />
    </div>
  );
}
