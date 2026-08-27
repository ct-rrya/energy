/**
 * Dashboard Skeleton Component
 * Loading state for the entire dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-neutral-200 rounded" />
          <div className="mt-2 h-4 w-64 bg-neutral-200 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-6 w-24 bg-neutral-200 rounded-full" />
          <div className="h-10 w-28 bg-neutral-200 rounded-lg" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-card bg-white p-6 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-12 w-12 bg-neutral-200 rounded-lg" />
              <div className="h-6 w-16 bg-neutral-200 rounded" />
            </div>
            <div className="h-4 w-24 bg-neutral-200 rounded mb-2" />
            <div className="h-8 w-32 bg-neutral-200 rounded" />
          </div>
        ))}
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card bg-white p-6 shadow-card">
            <div className="mb-4 h-6 w-40 bg-neutral-200 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-neutral-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 w-full bg-neutral-200 rounded mb-2" />
                    <div className="h-3 w-2/3 bg-neutral-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
